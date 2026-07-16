#!/usr/bin/env python3
"""Convert one validated local PDF to bounded Markdown for RIKMS.

This is deliberately a one-shot CLI, not a web server. The Laravel caller
supplies one private source path and one private temporary output path, waits
for a bounded process, validates the result, and deletes it immediately.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bounded RIKMS Docling extractor")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--max-pages", required=True, type=int)
    parser.add_argument("--max-characters", required=True, type=int)
    return parser.parse_args()


def validated_paths(arguments: argparse.Namespace) -> tuple[Path, Path]:
    source = Path(arguments.input).resolve(strict=True)
    output = Path(arguments.output).resolve(strict=False)
    output_parent = output.parent.resolve(strict=True)

    if not source.is_file() or source.suffix.lower() != ".pdf":
        raise ValueError("The input must be a regular PDF file.")
    if source.open("rb").read(5) != b"%PDF-":
        raise ValueError("The input does not have a PDF signature.")
    if output.exists() or output.parent != output_parent:
        raise ValueError("The output must be a new file in an existing directory.")

    return source, output


def convert(source: Path, max_pages: int) -> tuple[str, int]:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import (
        AcceleratorDevice,
        AcceleratorOptions,
        PdfPipelineOptions,
    )
    from docling.document_converter import DocumentConverter, PdfFormatOption

    options = PdfPipelineOptions(
        do_ocr=True,
        do_table_structure=True,
        accelerator_options=AcceleratorOptions(
            num_threads=4,
            device=AcceleratorDevice.AUTO,
        ),
    )
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=options),
        }
    )
    result = converter.convert(str(source), max_num_pages=max_pages)
    document = result.document
    markdown = document.export_to_markdown()
    page_count = len(getattr(document, "pages", {}) or {})
    return markdown, page_count


def main() -> int:
    arguments = parse_args()
    max_pages = max(1, min(100, arguments.max_pages))
    max_characters = max(1_000, min(600_000, arguments.max_characters))

    try:
        source, output = validated_paths(arguments)
        markdown, page_count = convert(source, max_pages)
        payload = {
            "text": markdown[:max_characters],
            "page_count": min(max_pages, max(0, page_count)),
        }
        output.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return 0
    except Exception as error:  # The caller receives only a failed exit status.
        print(f"Docling extraction failed: {type(error).__name__}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
