from __future__ import annotations

import re
from pathlib import Path


DASHBOARD_ROOT = Path(__file__).resolve().parent / "dashboard"
ORIGINAL_TEMPLATE = DASHBOARD_ROOT / "jaylord-original.html"
STYLE_BLOCK = re.compile(r"\s*<style>(.*?)</style>", re.DOTALL)
INLINE_SCRIPT = re.compile(r"\s*<script>(.*?)</script>", re.DOTALL)
EVENT_HANDLER = re.compile(r"\s+on(?:click|input)=\"[^\"]*\"")


def original_css() -> str:
    template = ORIGINAL_TEMPLATE.read_text(encoding="utf-8")
    match = STYLE_BLOCK.search(template)
    if match is None:
        raise RuntimeError("Jaylord's original dashboard CSS is missing.")

    return match.group(1) + """

@font-face { font-family: 'Outfit'; src: url('/fonts/outfit-300.woff2') format('woff2'); font-style: normal; font-weight: 300; font-display: swap; }
@font-face { font-family: 'Outfit'; src: url('/fonts/outfit-400.woff2') format('woff2'); font-style: normal; font-weight: 400; font-display: swap; }
@font-face { font-family: 'Outfit'; src: url('/fonts/outfit-500.woff2') format('woff2'); font-style: normal; font-weight: 500; font-display: swap; }
@font-face { font-family: 'Outfit'; src: url('/fonts/outfit-600.woff2') format('woff2'); font-style: normal; font-weight: 600; font-display: swap; }
@font-face { font-family: 'Outfit'; src: url('/fonts/outfit-700.woff2') format('woff2'); font-style: normal; font-weight: 700; font-display: swap; }
@font-face { font-family: 'JetBrains Mono'; src: url('/fonts/jetbrains-400.woff2') format('woff2'); font-style: normal; font-weight: 400; font-display: swap; }
@font-face { font-family: 'JetBrains Mono'; src: url('/fonts/jetbrains-500.woff2') format('woff2'); font-style: normal; font-weight: 500; font-display: swap; }
.scan-badge.blocked, .scan-badge.unavailable {
    background: rgba(245, 158, 11, 0.1);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.25);
}
.scan-badge.passed { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.scan-badge.queued { background: rgba(107, 114, 128, 0.1); color: #9ca3af; }
.run-feedback { color: var(--text-secondary); font-size: .82rem; min-height: 1.2rem; }
.run-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.ai-findings { display: grid; gap: .75rem; }
.ai-finding { padding: 1rem; background: rgba(255,255,255,.02); border: 1px solid var(--border-glass); }
.ai-finding strong, .ai-finding span { display: block; }
.ai-finding span { margin-top: .4rem; color: var(--text-secondary); line-height: 1.5; }

/* Jaylord's original rigid Minecraft geometry, driven by a procedural gait. */
.spider-viewport.procedural-spider .mc-spider {
    animation: none;
    transform:
        translate3d(var(--body-x, 0px), calc(5px + var(--body-y, 0px)), var(--body-z, 0px))
        rotateX(calc(-20deg + var(--body-pitch, 0deg)))
        rotateY(calc(-35deg + var(--body-yaw, 0deg)))
        rotateZ(var(--body-roll, 0deg))
        scale3d(1.7, 1.7, 1.7);
    transform-style: preserve-3d;
    will-change: transform;
}
.spider-viewport.procedural-spider .leg,
.spider-viewport.procedural-spider.scanning .leg {
    animation: none !important;
    transform:
        translate3d(var(--tx), var(--ty), var(--tz))
        rotateY(calc(var(--rot-y) + var(--gait-yaw, 0deg)))
        rotateZ(calc(var(--rot-z) + var(--gait-roll, 0deg)))
        rotateX(var(--gait-pitch, 0deg));
    will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
    .spider-viewport.procedural-spider .mc-spider,
    .spider-viewport.procedural-spider .leg {
        animation: none !important;
        will-change: auto;
    }
}
"""


def original_page(token: str) -> str:
    page = ORIGINAL_TEMPLATE.read_text(encoding="utf-8")
    page = STYLE_BLOCK.sub('\n    <link rel="stylesheet" href="/dashboard.css">', page, count=1)
    page = INLINE_SCRIPT.sub("", page, count=1)
    page = EVENT_HANDLER.sub("", page)
    page = page.replace(
        '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">',
        "",
    )
    page = page.replace(
        '<script id="chart-js-lib" src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>',
        '<script id="chart-js-lib" src="/chart.umd.js" defer></script>',
    )
    page = page.replace(
        "<title>RIKMS Executive Security & Audit Dashboard</title>",
        "<title>RIKMS Executive Security & Audit Dashboard</title>\n"
        f'    <meta name="rikms-lab-token" content="{token}">',
    )
    page = page.replace("Initializing scans...", "Ready for an explicit scan")
    page = page.replace("Pentesting target boundaries...", "Spider is resting. No scan is automatic.")
    page = page.replace("Refresh Dashboard", "Run Core Checks")
    page = page.replace("Health Score", "Evidence Coverage")
    page = page.replace("Executive Health Summary", "Executive Evidence Summary")
    page = page.replace("Active boundary tests", "Authorized boundary tests")
    page = page.replace("Click the <strong>Refresh Dashboard</strong> button at the top of this dashboard page.", "Use the <strong>Run Authorized ZAP</strong> control in this panel.")
    page = page.replace(
        "This dashboard script has been automated to search for standard ZAP installations on your computer (in standard Program Files paths or system PATH) and trigger a headlessly automated quick scan against the Laravel app if it detects it running on port 8000 or 8080! Check the python terminal log for scan progress.",
        "ZAP remains explicitly opt-in. The local runner verifies the authorized target and mode before starting ZAP, and missing or blocked evidence never becomes a pass.",
    )
    page = page.replace("CALCULATING...", "NOT RUN")
    page = page.replace(
        "Calculating audit parameters... Please make sure that your tests, code checks, and vulnerability reports have been loaded.",
        "No evidence has been collected for this revision. Run the checks explicitly before reviewing results.",
    )
    page = page.replace(
        '<span id="scan-status-zap" class="scan-badge pending">Pending</span>',
        '<span id="scan-status-zap" class="scan-badge pending">Pending</span>\n'
        '                    </div>\n'
        '                    <div class="scan-status-item">\n'
        '                        <span class="scan-name">Local Metadata AI Red Team</span>\n'
        '                        <span id="scan-status-ai" class="scan-badge pending">Pending</span>',
    )
    page = page.replace(
        '<button class="tab-btn">Boundary Audit (Native)</button>',
        '<button class="tab-btn">Boundary Audit (Native)</button>\n'
        '            <button class="tab-btn" data-tab="ai">Local Metadata AI</button>',
    )
    ai_panel = """

        <div id="tab-ai" class="tab-content">
            <section class="metrics-grid">
                <div class="metric-card"><div class="metric-label">Fixture Cases</div><div class="metric-value" id="ai-total">0</div><div class="metric-subtext">Synthetic metadata attacks</div></div>
                <div class="metric-card passed"><div class="metric-label">Passed</div><div class="metric-value" id="ai-passed" style="color: var(--color-passed);">0</div><div class="metric-subtext">Model resisted the fixture</div></div>
                <div class="metric-card failed"><div class="metric-label">Failed</div><div class="metric-value" id="ai-failed" style="color: var(--color-failed);">0</div><div class="metric-subtext">Requires prompt or model work</div></div>
                <div class="metric-card"><div class="metric-label">Model</div><div class="metric-value" id="ai-model" style="font-size: 1.25rem;">Not run</div><div class="metric-subtext">Loopback Ollama only</div></div>
            </section>
            <div class="scan-context-card">
                <div><strong>🔍 Type of Test:</strong> Local metadata-model security evaluation</div>
                <div><strong>🛡️ What is scanned:</strong> Prompt injection, canary leakage, malformed output, unsupported fields, fabricated evidence pages, and metadata integrity.</div>
                <div class="run-actions"><button id="run-ai" class="refresh-btn" type="button">Run Local AI Checks</button><span id="run-feedback" class="run-feedback"></span></div>
            </div>
            <section class="panel"><div class="panel-header"><h2>AI Security Observations</h2></div><div id="ai-findings" class="ai-findings"><div class="no-data-msg">No AI evidence has been collected.</div></div></section>
        </div>
"""
    page = page.replace("\n    </div>\n\n    <script>", ai_panel + "\n    </div>\n\n    <script>")
    page = page.replace("\n    </div>\n</body>", ai_panel + "\n    </div>\n</body>") if 'id="tab-ai"' not in page else page
    page = page.replace("</body>", '    <script src="/dashboard.js" defer></script>\n</body>')

    return page
