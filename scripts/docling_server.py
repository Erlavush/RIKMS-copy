#!/usr/bin/env python3
"""
RIKMS Docling Server  (GPU-accelerated)
========================================
A standalone HTTP API that wraps IBM Docling for PDF → Markdown conversion.
Run once and keep alive; the metadata extractor calls it via HTTP just like Ollama.

GPU support
-----------
Docling uses torch-based layout and OCR models. This server picks the best
available accelerator automatically (CUDA → MPS → CPU) via AcceleratorDevice.AUTO.
When CUDA is found the models run on the GPU; otherwise they fall back to CPU.

OCR handling
------------
* POST /detect  — fast pre-flight: inspects the PDF with pypdf to determine
                  whether all pages are image-only (no embedded text).
                  Returns {"needs_ocr": bool} within milliseconds.
                  Called by Laravel BEFORE queuing the analysis job so the UI
                  can warn the user immediately.

* POST /convert — full conversion.  If needs_ocr is True, PdfPipelineOptions
                  is configured with do_ocr=True so Docling's OCR pipeline
                  (EasyOCR / RapidOCR, running on GPU) is activated.
                  Results are cached on disk; subsequent calls return instantly.

* GET  /health  — liveness probe.

Usage:
    python scripts/docling_server.py [--host 127.0.0.1] [--port 5001]
"""

import os
import sys
import json
import argparse
import threading
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── UTF-8 on Windows legacy consoles ────────────────────────────────────────
if sys.platform == "win32":
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except Exception:
            pass

# ── Accelerator selection ────────────────────────────────────────────────────
try:
    import torch
    # For Windows, add torch's bundled CUDA/cuDNN DLL directory to the DLL search path
    # so that onnxruntime-gpu can locate them (e.g. cudnn64_9.dll)
    if sys.platform == "win32":
        import os
        torch_lib = os.path.join(os.path.dirname(torch.__file__), "lib")
        if os.path.isdir(torch_lib):
            os.add_dll_directory(torch_lib)
    _CUDA_AVAILABLE = torch.cuda.is_available()
except ImportError:
    _CUDA_AVAILABLE = False

try:
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    _HAS_PIPELINE_OPTIONS = True
except ImportError:
    _HAS_PIPELINE_OPTIONS = False

try:
    from docling.datamodel.pipeline_options import AcceleratorOptions, AcceleratorDevice
    # Prioritize CUDA if PyTorch indicates it is available
    if _CUDA_AVAILABLE:
        _ACCEL_DEVICE = AcceleratorDevice.CUDA
    else:
        _ACCEL_DEVICE = AcceleratorDevice.AUTO
    _HAS_ACCEL_OPTIONS = True
except ImportError:
    _HAS_ACCEL_OPTIONS = False

# ── Thread-safe lazy converter cache (one per pipeline variant) ──────────────
_converters: dict = {}
_converter_lock = threading.Lock()


def _build_converter(force_ocr: bool):
    """
    Create and cache a DocumentConverter for the given (force_ocr) config.
    Uses GPU via AcceleratorDevice.AUTO when available.
    Correct API: DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=...)})
    """
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat

    if not _HAS_PIPELINE_OPTIONS:
        return DocumentConverter()

    if _HAS_ACCEL_OPTIONS:
        options = PdfPipelineOptions(
            do_ocr=force_ocr,
            do_table_structure=True,
            accelerator_options=AcceleratorOptions(
                num_threads=4,
                device=_ACCEL_DEVICE,          # AUTO → CUDA if present
            ),
        )
    else:
        options = PdfPipelineOptions(
            do_ocr=force_ocr,
            do_table_structure=True,
        )

    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=options),
        }
    )


def get_converter(force_ocr: bool = False):
    key = "ocr" if force_ocr else "noocr"
    with _converter_lock:
        if key not in _converters:
            _converters[key] = _build_converter(force_ocr)
    return _converters[key]


# ── OCR detection (fast, uses fitz/PyMuPDF — already a docling dependency) ──
def detect_needs_ocr(file_path: Path) -> bool:
    """
    Return True when a PDF has no embedded text on any page (i.e. it is a
    scanned / image-only document and OCR is required).
    Uses fitz (PyMuPDF), which is already installed as part of docling's
    dependency tree — no extra package required.
    """
    try:
        import fitz  # PyMuPDF — shipped with docling
        doc = fitz.open(str(file_path))
        for page in doc:
            text = page.get_text() or ""
            if len(text.strip()) > 20:
                doc.close()
                return False        # at least one page has real text → no OCR
        doc.close()
        return True                 # no page had extractable text → OCR needed
    except Exception:
        return False                # cannot determine → assume no OCR needed


# ── Conversion logic ─────────────────────────────────────────────────────────
def convert_pdf(file_path_str: str, use_cache: bool = True):
    file_path = Path(file_path_str).resolve()

    if not file_path.exists():
        return {
            "markdown": "", "needs_ocr": False,
            "cached": False, "error": f"File not found: {file_path}",
        }

    # ── Step 1: fast OCR detection ──────────────────────────────────────────
    needs_ocr = detect_needs_ocr(file_path)
    device_label = "CUDA/GPU" if _CUDA_AVAILABLE else "CPU"
    print(
        f"[docling-server] Converting '{file_path.name}' "
        f"| OCR={needs_ocr} | device={device_label}",
        flush=True,
    )

    # ── Step 2: cache lookup ────────────────────────────────────────────────
    output_dir = file_path.parent.parent / "markdown_docling"
    output_dir.mkdir(parents=True, exist_ok=True)
    converted_path = output_dir / f"{file_path.stem}_docling.md"

    if use_cache and converted_path.exists():
        md = converted_path.read_text(encoding="utf-8")
        return {
            "markdown": md, "needs_ocr": needs_ocr,
            "cached": True, "error": None,
        }

    # ── Step 3: Fast-path direct text extraction for digital PDFs (no OCR needed) ──
    if not needs_ocr:
        try:
            import fitz
            doc = fitz.open(str(file_path))
            text_parts = []
            for page in doc:
                text_parts.append(page.get_text())
            doc.close()
            md_content = "\n\n".join(text_parts)
            converted_path.write_text(md_content, encoding="utf-8")
            return {
                "markdown": md_content, "needs_ocr": needs_ocr,
                "cached": False, "error": None,
            }
        except Exception as e:
            # Fall back to Docling below
            print(f"[docling-server] Direct fitz extraction failed, falling back to Docling: {e}", flush=True)

    # ── Step 4: GPU-accelerated Docling conversion (for scanned images) ─────
    try:
        converter = get_converter(force_ocr=needs_ocr)
        result = converter.convert(str(file_path))
        md_content = result.document.export_to_markdown()
        converted_path.write_text(md_content, encoding="utf-8")
        return {
            "markdown": md_content, "needs_ocr": needs_ocr,
            "cached": False, "error": None,
        }
    except Exception as e:
        return {
            "markdown": "", "needs_ocr": needs_ocr,
            "cached": False, "error": str(e),
        }


# ── HTTP handler ─────────────────────────────────────────────────────────────
class DoclingHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[docling-server] {fmt % args}", flush=True)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except Exception:
            return None

    def send_json(self, code: int, body: dict):
        data = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    # GET /health
    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {
                "status": "ok",
                "cuda": _CUDA_AVAILABLE,
                "device": "CUDA/GPU" if _CUDA_AVAILABLE else "CPU",
            })
        else:
            self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        # ── POST /detect ────────────────────────────────────────────────────
        if self.path == "/detect":
            payload = self._read_json()
            if not payload:
                self.send_json(400, {"error": "Invalid JSON"})
                return
            file_path_str = payload.get("file", "")
            if not file_path_str:
                self.send_json(400, {"error": "Missing 'file' parameter"})
                return
            fp = Path(file_path_str).resolve()
            if not fp.exists():
                self.send_json(404, {"error": f"File not found: {fp}"})
                return
            needs_ocr = detect_needs_ocr(fp)
            device_label = "CUDA/GPU" if _CUDA_AVAILABLE else "CPU"
            print(
                f"[docling-server] /detect '{fp.name}' → needs_ocr={needs_ocr} | device={device_label}",
                flush=True,
            )
            self.send_json(200, {
                "needs_ocr": needs_ocr,
                "device": device_label,
            })
            return

        # ── POST /convert ───────────────────────────────────────────────────
        if self.path == "/convert":
            payload = self._read_json()
            if not payload:
                self.send_json(400, {"error": "Invalid JSON"})
                return
            file_path = payload.get("file", "")
            use_cache = bool(payload.get("use_cache", True))
            if not file_path:
                self.send_json(400, {"error": "Missing 'file' parameter"})
                return
            result = convert_pdf(file_path, use_cache)
            status = 500 if result.get("error") and not result.get("markdown") else 200
            self.send_json(status, result)
            return

        self.send_json(404, {"error": "Not found"})


def assert_gpu_available():
    import sys
    if not _CUDA_AVAILABLE:
        print("[docling-server] ERROR: PyTorch CUDA is not available. GPU exclusivity is enabled.", file=sys.stderr)
        sys.exit(1)
        
    try:
        import onnxruntime as ort
        # Verify CUDA provider is available in ONNX Runtime
        if "CUDAExecutionProvider" not in ort.get_available_providers():
            print("[docling-server] ERROR: CUDAExecutionProvider is not available in ONNX Runtime. GPU exclusivity is enabled.", file=sys.stderr)
            sys.exit(1)
            
        # Test loading the RapidOCR detector model to verify CUDA DLLs are working
        import rapidocr
        from pathlib import Path
        model_path = Path(rapidocr.__file__).parent / "models" / "PP-OCRv6_det_small.onnx"
        if model_path.exists():
            sess = ort.InferenceSession(str(model_path), providers=["CUDAExecutionProvider"])
            if "CUDAExecutionProvider" not in sess.get_providers():
                print("[docling-server] ERROR: ONNX Runtime failed to load CUDAExecutionProvider (fell back to CPU). GPU exclusivity is enabled.", file=sys.stderr)
                sys.exit(1)
    except Exception as e:
        print(f"[docling-server] ERROR: GPU verification failed: {e}", file=sys.stderr)
        sys.exit(1)


# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="RIKMS Docling HTTP Server (GPU)")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5001)
    args = parser.parse_args()

    print(f"[docling-server] Verifying GPU/CUDA availability (exclusivity mode)...", flush=True)
    assert_gpu_available()

    device_label = "CUDA/GPU" if _CUDA_AVAILABLE else "CPU"
    print(f"[docling-server] Accelerator: {device_label}", flush=True)
    print(f"[docling-server] Pre-loading base converter...", flush=True)
    get_converter(force_ocr=False)          # warm up the layout models on GPU
    print(
        f"[docling-server] Ready. Listening on http://{args.host}:{args.port}",
        flush=True,
    )

    server = HTTPServer((args.host, args.port), DoclingHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[docling-server] Shutting down.", flush=True)
        server.server_close()


if __name__ == "__main__":
    main()
