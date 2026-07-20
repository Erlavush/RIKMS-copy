#!/usr/bin/env python3
import os
import re
import sys
import json
import argparse
from pathlib import Path
import requests
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Rich library styling for console logs
from rich.console import Console

# Handle stdout/stderr encoding issues in legacy Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

console = Console()

OLLAMA_URL = "http://127.0.0.1:11434"
MODEL_NAME = "gemma2:2b"
CHUNK_SIZE = 1000  # Target characters per chunk
DEFAULT_TOP_K = 4
SIMILARITY_THRESHOLD = 0.05

class MetadataExtractorRAG:
    def __init__(self, file_path):
        self.file_path = Path(file_path).resolve()
        self.content = ""
        self.chunks = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self.needs_ocr = False

    def load_document(self):
        """Reads plain text / markdown file directly from the filesystem."""
        if not self.file_path.exists():
            raise FileNotFoundError(f"File not found at: {self.file_path}")
        self.content = self.file_path.read_text(encoding="utf-8")

        # Chunking logic
        lines = self.content.splitlines()
        current_header = "Document Header"
        current_chunk_lines = []
        current_length = 0
        
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            header_match = re.match(r'^(#+)\s+(.+)$', stripped)
            if header_match:
                if current_chunk_lines:
                    self.chunks.append({
                        "text": "\n".join(current_chunk_lines),
                        "source": self.file_path.name,
                        "section": current_header
                    })
                    current_chunk_lines = []
                    current_length = 0
                current_header = header_match.group(2).strip()
                continue
            
            current_chunk_lines.append(line)
            current_length += len(line)
            if current_length >= CHUNK_SIZE:
                self.chunks.append({
                    "text": "\n".join(current_chunk_lines),
                    "source": self.file_path.name,
                    "section": current_header
                })
                overlap = current_chunk_lines[-2:] if len(current_chunk_lines) > 2 else current_chunk_lines[-1:]
                current_chunk_lines = list(overlap)
                current_length = sum(len(l) for l in current_chunk_lines)
                
        if current_chunk_lines:
            self.chunks.append({
                "text": "\n".join(current_chunk_lines),
                "source": self.file_path.name,
                "section": current_header
            })
        return len(self.chunks)

    def build_index(self):
        if not self.chunks:
            return False
        corpus = [c["text"] for c in self.chunks]
        self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        return True

    def retrieve_context(self, query, top_k=DEFAULT_TOP_K):
        if not self.vectorizer or self.tfidf_matrix is None:
            return []
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        sorted_indices = similarities.argsort()[::-1]
        
        retrieved = []
        for idx in sorted_indices:
            score = similarities[idx]
            if score < SIMILARITY_THRESHOLD and len(retrieved) >= 1:
                break
            if len(retrieved) >= top_k:
                break
            chunk_data = self.chunks[idx].copy()
            chunk_data["similarity_score"] = float(score)
            retrieved.append(chunk_data)
        return retrieved

    def query_ollama_json(self, prompt):
        url = f"{OLLAMA_URL}/api/generate"
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.1, "num_ctx": 4096}
        }
        try:
            r = requests.post(url, json=payload, timeout=120)
            if r.status_code == 200:
                return json.loads(r.json().get("response", "{}"))
        except Exception:
            pass
        return {}

    def extract_header_fields(self):
        header_text = self.content[:12000]
        prompt = f"""You are an intelligent metadata extractor. Your task is to extract information from the document text below and format it into JSON.

Important Instructions:
- Do NOT copy the text word-for-word from the source document.
- Make fixes to the extracted text to ensure correct and grammatically sound paragraphs and sentences. Fix issues like broken words, spacing, or punctuation.
- Remove all formatting anomalies, such as HTML tags/entities or markdown-related artifacts (e.g., headers, hashes, asterisks, backticks).
- Locate the following fields:
  - title: The full title of the document.
  - abstract: The complete abstract, with paragraphs and sentences cleaned of formatting anomalies.
  - authors: The list of author names.
  - keywords: The list of keywords.
  - doi: The DOI string, or null if not present.
  - category: The document category, or null if not present.

Output ONLY a raw JSON object. Do not include any introductory or concluding explanation.
{{
  "title": "extracted title",
  "abstract": "extracted abstract with fixes",
  "authors": ["author name"],
  "keywords": ["keyword"],
  "doi": "doi string or null",
  "category": "category or null"
}}
Document text:
{header_text}
"""
        result = self.query_ollama_json(prompt)
        title_match = re.search(r'^#\s+(.+)$', self.content, re.MULTILINE)
        if title_match:
            result["title"] = title_match.group(1).strip()
        abstract_match = re.search(r'##\s+ABSTRACT\s*\n+([\s\S]+?)(?=\n+##\s+\d+|\n+##\s+[A-Z]|$)', self.content, re.IGNORECASE)
        if abstract_match:
            result["abstract"] = re.sub(r'\s+', ' ', abstract_match.group(1)).strip()
        return result

    def extract_rag_sections(self):
        sections = {}
        
        # 1. Methodology
        meth_chunks = self.retrieve_context("research methodology materials experimental design algorithms models implementation details", top_k=3)
        meth_ctx = "\n\n".join([c['text'] for c in meth_chunks])
        prompt = f"""Extract the methodology details from the context below. Do not copy the text word-for-word. Make fixes to form clear paragraphs and sentences, and remove any anomalies such as HTML elements, tags, or markdown-related artifacts. Do not include any introductory or concluding explanation.
JSON schema: {{ "methodology": "extracted methodology text" }}
Context:
{meth_ctx}
"""
        sections["methodology"] = self.query_ollama_json(prompt).get("methodology", "")

        # 2. Review of Related Literature
        lit_chunks = self.retrieve_context("related work review literature references background", top_k=2)
        lit_ctx = "\n\n".join([c['text'] for c in lit_chunks])
        prompt = f"""Extract the review of related literature from the context below. Do not copy the text word-for-word. Make fixes to form clear paragraphs and sentences, and remove any anomalies such as HTML elements, tags, or markdown-related artifacts. Do not include any introductory or concluding explanation.
JSON schema: {{ "review_of_related_literature": "extracted related literature text" }}
Context:
{lit_ctx}
"""
        sections["review_of_related_literature"] = self.query_ollama_json(prompt).get("review_of_related_literature", "")

        # 3. Theoretical Framework
        theory_chunks = self.retrieve_context("theoretical framework conceptual framework theories models foundations principles", top_k=2)
        theory_ctx = "\n\n".join([c['text'] for c in theory_chunks])
        prompt = f"""Extract the theoretical framework from the context below. Do not copy the text word-for-word. Make fixes to form clear paragraphs and sentences, and remove any anomalies such as HTML elements, tags, or markdown-related artifacts. Do not include any introductory or concluding explanation.
JSON schema: {{ "theoretical_framework": "extracted theoretical framework text" }}
Context:
{theory_ctx}
"""
        sections["theoretical_framework"] = self.query_ollama_json(prompt).get("theoretical_framework", "")

        # 4. Results & Discussion
        res_chunks = self.retrieve_context("results discussion evaluation outcomes performance metrics tables values", top_k=3)
        res_ctx = "\n\n".join([c['text'] for c in res_chunks])
        prompt = f"""Extract the results and discussion section from the context below. Do not copy the text word-for-word. Make fixes to form clear paragraphs and sentences, and remove any anomalies such as HTML elements, tags, or markdown-related artifacts, while preserving all numbers, metric values, and table data. Do not include any introductory or concluding explanation.
JSON schema: {{ "results_and_discussion": "extracted results and discussion text" }}
Context:
{res_ctx}
"""
        sections["results_and_discussion"] = self.query_ollama_json(prompt).get("results_and_discussion", "")

        # 5. Executive Summary & Recommendations
        exec_chunks = self.retrieve_context("conclusion executive summary recommendations future work policy implications", top_k=3)
        exec_ctx = "\n\n".join([c['text'] for c in exec_chunks])
        prompt = f"""Extract the executive summary and recommendations from the context below. Do not copy the text word-for-word. Make fixes to form clear paragraphs and sentences, and remove any anomalies such as HTML elements, tags, or markdown-related artifacts. Ensure recommendation points are cleaned of any formatting symbols. Do not include any introductory or concluding explanation.
JSON schema:
{{
  "executive_summary": "extracted executive summary text",
  "recommendations": ["extracted recommendation point"]
}}
Context:
{exec_ctx}
"""
        res = self.query_ollama_json(prompt)
        sections["executive_summary"] = res.get("executive_summary", "")
        sections["recommendations"] = res.get("recommendations", [])

        # 6. SDGs
        sdg_chunks = self.retrieve_context("sustainable development goals SDG poverty health environment climate gender water energy infrastructure", top_k=3)
        sdg_ctx = "\n\n".join([c['text'] for c in sdg_chunks])
        prompt = f"""Suggest matching Sustainable Development Goals (SDGs 1-17) based on the context. Provide a clear reason for each match, written in complete sentences, without copying word-for-word from the raw text and removing any formatting anomalies.
JSON schema:
{{
  "suggested_sdgs": [
    {{ "number": 1, "reason": "reason for matching this SDG", "confidence": 0.85 }}
  ],
  "evidence_pages": [1]
}}
Context:
{sdg_ctx}
"""
        res = self.query_ollama_json(prompt)
        sections["suggested_sdgs"] = res.get("suggested_sdgs", [])
        sections["evidence_pages"] = res.get("evidence_pages", [1])

        return sections

    def run_full_pipeline(self):
        header = self.extract_header_fields()
        sections = self.extract_rag_sections()
        
        return {
            "title": header.get("title", "Unknown Title"),
            "abstract": header.get("abstract", "Not Found"),
            "methodology": sections.get("methodology", ""),
            "review_of_related_literature": sections.get("review_of_related_literature", ""),
            "theoretical_framework": sections.get("theoretical_framework", ""),
            "results_and_discussion": sections.get("results_and_discussion", ""),
            "keywords": header.get("keywords", []),
            "authors": header.get("authors", []),
            "doi": header.get("doi") or "",
            "category": header.get("category") or "Uncategorized",
            "executive_summary": sections.get("executive_summary", ""),
            "recommendations": sections.get("recommendations", []),
            "suggested_sdgs": sections.get("suggested_sdgs", []),
            "overall_confidence": 0.85,
            "evidence_pages": sections.get("evidence_pages", [1]),
            "needs_ocr": self.needs_ocr,
        }

def main():
    global MODEL_NAME
    import time
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=str, required=True)
    parser.add_argument("--action", type=str, default="extract")
    parser.add_argument("--output", type=str, required=True)
    parser.add_argument("--model", type=str, default="gemma2:2b")
    args = parser.parse_args()
    
    MODEL_NAME = args.model
    
    extractor = MetadataExtractorRAG(args.file)
    extractor.load_document()
    
    start_model = time.time()
    extractor.build_index()
    extracted_data = extractor.run_full_pipeline()
    model_duration = int(time.time() - start_model)
    
    extracted_data["model_duration"] = model_duration
    
    Path(args.output).write_text(json.dumps(extracted_data, indent=4), encoding="utf-8")
    sys.exit(0)

if __name__ == "__main__":
    main()
