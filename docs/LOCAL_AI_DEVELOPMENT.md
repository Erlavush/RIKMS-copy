# Local Ollama Metadata Development

RIKMS can use a loopback Ollama model for local development and testing. This
is the safe integration point for the useful part of Julse's local-model
concept: extract PDF text, request structured metadata, validate it with the
canonical RIKMS schema, and keep every result behind human review.

This work does not deploy a model to Google Cloud. Production continues to
default to the existing Vertex provider unless a separate reviewed deployment
changes that configuration.

## Architecture

```text
private PDF
  -> source signature, MIME, size, hash and malware-state gate
  -> pdftotext, embedded extraction, or bounded OCR
  -> loopback Ollama provider
  -> strict shared JSON schema and Laravel validation
  -> versioned AI suggestion record
  -> editable draft and human review
```

The provider never publishes, approves, changes access, or directly overwrites
authoritative metadata. The existing queue job checks the source-safety gate
before and after inference so a replaced document cannot accept stale output.

## Windows setup

Install Ollama and confirm it is available from PowerShell:

```powershell
ollama --version
ollama serve
ollama list
```

Install the chosen local model only when the machine owner approves the model
download and disk use:

```powershell
ollama pull qwen3.5:4b
```

For local PDF extraction, install Poppler and Tesseract, then put the exact
executable paths in the local `.env`. Example paths vary by installation:

```env
RIKMS_AI_ENABLED=true
RIKMS_AI_AUTO_QUEUE=true
RIKMS_AI_PROVIDER=ollama
RIKMS_AI_MODEL=qwen3.5:4b

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3.5:4b
OLLAMA_NUM_CTX=8192
OLLAMA_MAX_INPUT_CHARACTERS=24000
OLLAMA_KEEP_ALIVE=30m

LOCAL_PDF_TEXT_COMMAND=C:\Tools\poppler\Library\bin\pdftotext.exe
LOCAL_PDF_RENDER_COMMAND=C:\Tools\poppler\Library\bin\pdftoppm.exe
LOCAL_OCR_COMMAND=C:\Program Files\Tesseract-OCR\tesseract.exe
LOCAL_OCR_LANGUAGE=eng
LOCAL_OCR_MAX_PAGES=20
LOCAL_OCR_DPI=180
LOCAL_OCR_PAGE_TIMEOUT_SECONDS=15
```

Use the real installed paths. The values are passed as process arguments; do
not add shell fragments, pipes, redirects or embedded command options.

Clear cached configuration, start the app and run the AI queue worker:

```powershell
php artisan config:clear
php artisan serve --host=127.0.0.1 --port=8000
php artisan queue:work --queue=default,ai --tries=3
```

When using Jaylord's launcher with `-StartApp`, Laravel, this queue worker, and
Vite are started together from the current repository. Do not separately run
Vite or Laravel from a different clone.

Jaylord can start the local services and open the security workbench with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\security-dashboard.ps1 `
  -StartApp -StartOllama -AI
```

The dashboard will report the AI lane as `unavailable` when the requested
model is not installed. It never downloads a model automatically.

## Linux setup

Use executable paths reported by the local machine:

```bash
command -v pdftotext pdftoppm tesseract ollama
ollama list
```

Typical local values are:

```env
LOCAL_PDF_TEXT_COMMAND=/usr/bin/pdftotext
LOCAL_PDF_RENDER_COMMAND=/usr/bin/pdftoppm
LOCAL_OCR_COMMAND=/usr/bin/tesseract
```

Run the focused checks before using real synthetic test documents:

```bash
php artisan test --filter=OllamaDocumentAnalysisTest
python3 -m unittest discover -s security/tests -v
python3 -m security.lab --run ai
```

For interactive RIKMS document testing, start Ollama in one terminal and the
complete Laravel development stack in another:

```bash
ollama serve
composer run dev
```

Open RIKMS on `http://127.0.0.1:8000`. Port 5173 is only Vite. A queued
analysis requires the `default,ai` worker included in `composer run dev`; if
that worker is absent, the edit page now reports the missing local runtime
instead of displaying an indefinite generic processing message.

## Security boundaries

- Ollama is accepted only in `local` or `testing` environments.
- Its configured endpoint must be `localhost`, `127.0.0.1`, or `::1`; remote
  and credential-bearing URLs are rejected before the PDF is read.
- Input length, context, output prediction, OCR pages, DPI and per-page time are
  bounded.
- Model JSON is untrusted. Unknown fields, invalid SDGs, invalid confidence,
  malformed arrays and invalid pages are rejected.
- Uploaded papers are not security fixtures. Use the synthetic documents under
  `security/fixtures/ai` for prompt-injection and leakage testing.
- Ollama output and prompts are not written to application logs.

## Later MinerU adapter

Julse's branch demonstrated a MinerU-to-Markdown extraction idea. It is not
merged as-is because it contains a machine-specific Linux path and bypasses the
current source-safety and queue boundaries. A future optional MinerU adapter is
acceptable after it:

1. uses configured repository-relative or environment-provided executables;
2. runs through argument arrays with time, page, memory and output limits;
3. operates only on the private document selected by RIKMS;
4. returns page-aware text through `DocumentTextExtractionService`;
5. has Windows and Linux tests and is benchmarked against pdftotext plus OCR;
6. never commits generated Markdown, source PDFs or model responses.
