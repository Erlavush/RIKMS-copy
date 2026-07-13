import os
import json
import webbrowser
import http.server
import socketserver
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
import threading
import subprocess
import shutil
import socket

PORT = 8888
XML_FILE = 'report.xml'
LARASTAN_FILE = 'larastan-report.json'
ZAP_FILE = 'zap-report.json'

ACTIVE_DASHBOARD_PORT = 8888

# ----------------- SCAN RUNNER AUTOMATION -----------------
def run_background_scans():
    # 1. Run Larastan Scan
    print("\n=======================================================")
    print("[SAST] Starting automated Larastan static analysis scan...")
    print("=======================================================")
    
    phpstan_bin = os.path.join('vendor', 'bin', 'phpstan')
    if os.path.exists(phpstan_bin):
        cmd = f"php {phpstan_bin} analyse --error-format=json"
    else:
        cmd = "php vendor/bin/phpstan analyse --error-format=json"
    
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        # Check if stdout contains JSON, otherwise write empty
        stdout_str = res.stdout.strip() if res.stdout else ""
        if stdout_str.startswith("{") or stdout_str.startswith("["):
            with open(LARASTAN_FILE, 'w', encoding='utf-8') as f:
                f.write(stdout_str)
            print(f"[SAST] Larastan scan complete. Saved to {LARASTAN_FILE}")
        else:
            # Maybe there was a configuration or path error, let's write what we got or empty dict
            with open(LARASTAN_FILE, 'w', encoding='utf-8') as f:
                f.write(json.dumps({"files": {}, "errors": [stdout_str or "Larastan execution output error"]}))
            print(f"[SAST] Larastan scan run with warning. Output saved to {LARASTAN_FILE}")
    except Exception as e:
        print(f"[SAST] Error running Larastan scan: {e}")

    # 2. Run ZAP Scan
    # Find ZAP
    zap_bin = None
    zap_bin_in_path = shutil.which("zap.bat") or shutil.which("zap.sh")
    if zap_bin_in_path:
        zap_bin = zap_bin_in_path
    else:
        local_app_data = os.environ.get('LOCALAPPDATA')
        app_data = os.environ.get('APPDATA')
        user_profile = os.environ.get('USERPROFILE') or os.path.expanduser('~')
        
        paths_to_check = [
            r"C:\Program Files\ZAP\Zed Attack Proxy\zap.bat",
            r"C:\Program Files (x86)\ZAP\Zed Attack Proxy\zap.bat",
            r"C:\Program Files\OWASP\Zed Attack Proxy\zap.bat",
            r"C:\Program Files (x86)\OWASP\Zed Attack Proxy\zap.bat",
            r"C:\Program Files\OWASP\Zed Attack Proxy\zap.sh",
            r"/usr/share/zaproxy/zap.sh",
            r"/usr/bin/zap.sh"
        ]
        
        if local_app_data:
            paths_to_check.append(os.path.join(local_app_data, "Programs", "OWASP", "Zed Attack Proxy", "zap.bat"))
            paths_to_check.append(os.path.join(local_app_data, "OWASP", "Zed Attack Proxy", "zap.bat"))
        if app_data:
            paths_to_check.append(os.path.join(app_data, "OWASP", "Zed Attack Proxy", "zap.bat"))
        if user_profile:
            paths_to_check.append(os.path.join(user_profile, "AppData", "Local", "Programs", "OWASP", "Zed Attack Proxy", "zap.bat"))
            
        for p in paths_to_check:
            if os.path.exists(p):
                zap_bin = p
                break
                
    if not zap_bin:
        print("\n=======================================================")
        print("[DAST] OWASP ZAP executable not found in PATH or standard installation folders.")
        print("[DAST] Skipping automated dynamic analysis scan.")
        print("[DAST] (See the step-by-step ZAP guide in the dashboard UI to run manually.)")
        print("=======================================================\n")
        return
        
    dashboard_port = ACTIVE_DASHBOARD_PORT
    running_port = None
    target_host = "127.0.0.1"
    
    # Check if target app is running (on 8000 or 8080) and make sure it is not our dashboard port
    for port in [8000, 8080]:
        if port == dashboard_port:
            continue
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        res_conn = s.connect_ex((target_host, port))
        s.close()
        if res_conn == 0:
            running_port = port
            break
            
    if not running_port:
        print("\n=======================================================")
        print("[DAST] Target web application is not running (checked ports 8000 and 8080).")
        print("[DAST] Skipping automated ZAP scan. ZAP requires the application to be running.")
        print("[DAST] Please start the Laravel application first (e.g. 'php artisan serve').")
        print("=======================================================\n")
        return
        
    target_url = f"http://{target_host}:{running_port}"
    print("\n=======================================================")
    print(f"[DAST] OWASP ZAP found at: {zap_bin}")
    print(f"[DAST] Starting automated ZAP quick scan on target {target_url}...")
    print("=======================================================")
    
    temp_report = os.path.abspath("zap-report-temp.json")
    zap_temp_dir = os.path.abspath(".zap_temp")
    os.makedirs(zap_temp_dir, exist_ok=True)
    zap_cmd = f'"{zap_bin}" -dir "{zap_temp_dir}" -port 8090 -cmd -quickurl {target_url} -quickout "{temp_report}"'
    
    try:
        # Run ZAP with timeout (3 minutes) and set cwd to ZAP folder to resolve jar path issues
        res = subprocess.run(zap_cmd, shell=True, capture_output=True, text=True, timeout=180, cwd=os.path.dirname(zap_bin))
        if os.path.exists(temp_report):
            if os.path.exists(ZAP_FILE):
                os.remove(ZAP_FILE)
            os.rename(temp_report, ZAP_FILE)
            print(f"[DAST] ZAP scan completed successfully. Saved to {ZAP_FILE}")
        else:
            print("[DAST] ZAP scan completed, but no report file was generated.")
            print(f"[DAST] ZAP stdout:\n{res.stdout}")
            print(f"[DAST] ZAP stderr:\n{res.stderr}")
    except subprocess.TimeoutExpired:
        print("[DAST] ZAP scan timed out after 3 minutes.")
    except Exception as e:
        print(f"[DAST] Error during automated ZAP scan: {e}")
    print("=======================================================\n")


# ----------------- PARSING LOGIC -----------------
def parse_junit_xml(file_path):
    if not os.path.exists(file_path):
        return None
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return None

    test_cases = []
    for testcase in root.iter('testcase'):
        name = testcase.get('name')
        classname = testcase.get('classname', 'Unknown')
        time = float(testcase.get('time', 0.0))
        
        status = 'Passed'
        failure = testcase.find('failure')
        error = testcase.find('error')
        skipped = testcase.find('skipped')
        
        failure_msg = ""
        if failure is not None:
            status = 'Failed'
            failure_msg = failure.text or failure.get('message', 'Assertion failed')
        elif error is not None:
            status = 'Failed'
            failure_msg = error.text or error.get('message', 'Execution error')
        elif skipped is not None:
            status = 'Skipped'
            failure_msg = skipped.text or skipped.get('message', 'Skipped')
            
        test_cases.append({
            'name': name,
            'class': classname.split('.')[-1],
            'fullname': classname,
            'time': time,
            'status': status,
            'message': failure_msg
        })
    return test_cases

def parse_larastan_json(file_path):
    if not os.path.exists(file_path):
        return None
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        errors = []
        files_data = data.get('files', {})
        for filepath, file_info in files_data.items():
            messages = file_info.get('messages', [])
            for msg in messages:
                errors.append({
                    'file': filepath,
                    'line': msg.get('line', 0),
                    'message': msg.get('message', 'No message details provided')
                })
        
        for gen_err in data.get('errors', []):
            errors.append({
                'file': 'Global/Generic',
                'line': 0,
                'message': str(gen_err)
            })
            
        return {
            'total_errors': len(errors),
            'errors': errors
        }
    except Exception as e:
        print(f"Error parsing Larastan JSON: {e}")
        return None

def parse_zap_json(file_path):
    if not os.path.exists(file_path):
        return None
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        alerts = []
        sites = data.get('site', [])
        if not sites and 'alerts' in data:
            sites = [{'alerts': data.get('alerts', [])}]
            
        for site in sites:
            site_alerts = site.get('alerts', [])
            for alert in site_alerts:
                risk = alert.get('riskdesc', alert.get('risk', 'Informational'))
                instances = alert.get('instances', [])
                uris = [inst.get('uri', '') for inst in instances]
                
                alerts.append({
                    'title': alert.get('alert', 'Unknown Alert'),
                    'risk': risk.split(' (')[0], 
                    'description': alert.get('desc', ''),
                    'solution': alert.get('solution', ''),
                    'urls': list(set(uris))
                })
        return alerts
    except Exception as e:
        print(f"Error parsing ZAP JSON: {e}")
        return None

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/results':
            results = parse_junit_xml(XML_FILE)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results or []).encode('utf-8'))
        elif parsed_path.path == '/api/larastan':
            results = parse_larastan_json(LARASTAN_FILE)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results or {}).encode('utf-8'))
        elif parsed_path.path == '/api/zap':
            results = parse_zap_json(ZAP_FILE)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results or []).encode('utf-8'))
        elif parsed_path.path == '/' or parsed_path.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(self.get_html_content().encode('utf-8'))
        else:
            super().do_GET()

    def get_html_content(self):
        return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RIKMS Executive Security & Audit Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --bg-primary: #090a0f;
            --bg-secondary: #111218;
            --bg-glass: rgba(255, 255, 255, 0.03);
            --border-glass: rgba(255, 255, 255, 0.06);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            
            --color-passed: #10b981;
            --color-failed: #ef4444;
            --color-skipped: #f59e0b;
            
            --color-high: #f43f5e;
            --color-medium: #fb923c;
            --color-low: #f59e0b;
            --color-info: #3b82f6;
            
            --font-main: 'Outfit', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-main);
            background-color: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 2rem;
            background-image: 
                radial-gradient(circle at 5% 5%, rgba(99, 102, 241, 0.07) 0%, transparent 40%),
                radial-gradient(circle at 95% 95%, rgba(16, 185, 129, 0.04) 0%, transparent 45%);
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border-glass);
            padding-bottom: 1.5rem;
        }

        .header-title h1 {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
        }

        .header-title p {
            color: var(--text-secondary);
            font-size: 0.95rem;
            margin-top: 0.25rem;
        }

        .refresh-btn {
            background: var(--bg-glass);
            border: 1px solid var(--border-glass);
            color: var(--text-primary);
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-family: var(--font-main);
            transition: all 0.2s ease;
        }

        .refresh-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
        }

        /* Mode Toggle */
        .mode-toggle {
            display: flex;
            align-items: center;
            background: rgba(0,0,0,0.2);
            border: 1px solid var(--border-glass);
            border-radius: 8px;
            padding: 0.25rem;
            margin-bottom: 1.5rem;
            width: fit-content;
        }

        .mode-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            padding: 0.4rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.85rem;
            font-family: var(--font-main);
            transition: all 0.2s ease;
        }

        .mode-btn.active {
            background: #4f46e5;
            color: #fff;
        }

        /* Executive Overview Panel */
        .executive-panel {
            background: linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 2rem;
            align-items: center;
        }

        @media (max-width: 900px) {
            .executive-panel {
                grid-template-columns: 1fr;
            }
        }

        .score-circle-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .score-circle {
            position: relative;
            width: 160px;
            height: 160px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .score-circle svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
        }

        .score-circle circle {
            fill: none;
            stroke-width: 12;
        }

        .score-circle .bg-ring {
            stroke: rgba(255, 255, 255, 0.05);
        }

        .score-circle .val-ring {
            stroke: var(--color-passed);
            stroke-linecap: round;
            transition: stroke-dashoffset 0.6s ease;
        }

        .score-text {
            position: absolute;
            font-size: 2.25rem;
            font-weight: 800;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .score-text span {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-secondary);
            margin-top: -2px;
        }

        .executive-summary-content h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            color: #a5b4fc;
        }

        .executive-summary-content p {
            font-size: 1.05rem;
            color: #d1d5db;
            line-height: 1.6;
            margin-bottom: 1.25rem;
        }

        .health-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.4rem 1rem;
            border-radius: 99px;
            font-weight: 700;
            font-size: 0.9rem;
            letter-spacing: 0.02em;
        }
        .health-badge.excellent { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .health-badge.good { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .health-badge.poor { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

        /* Navigation Tabs */
        .tabs {
            display: flex;
            gap: 0.5rem;
            background: rgba(0, 0, 0, 0.2);
            padding: 0.25rem;
            border-radius: 10px;
            border: 1px solid var(--border-glass);
            margin-bottom: 2rem;
            width: fit-content;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-family: var(--font-main);
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }

        .tab-btn.active {
            background: var(--bg-glass);
            color: var(--text-primary);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* Metrics grid */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .metric-card {
            background: var(--bg-glass);
            border: 1px solid var(--border-glass);
            backdrop-filter: blur(12px);
            border-radius: 16px;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
        }

        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--text-secondary);
        }

        .metric-card.passed::before { background: var(--color-passed); }
        .metric-card.failed::before { background: var(--color-failed); }
        .metric-card.high-alert::before { background: var(--color-high); }
        .metric-card.warn-alert::before { background: var(--color-medium); }

        .metric-label {
            font-size: 0.85rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
        }

        .metric-value {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.1;
        }

        .metric-subtext {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-top: 0.4rem;
        }

        /* Visualizations Grid */
        .viz-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        @media (max-width: 968px) {
            .viz-grid {
                grid-template-columns: 1fr;
            }
        }

        .viz-card {
            background: var(--bg-glass);
            border: 1px solid var(--border-glass);
            border-radius: 16px;
            padding: 1.5rem;
        }

        .viz-card h2 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1.25rem;
        }

        .chart-container {
            position: relative;
            width: 100%;
            height: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Panel Container */
        .panel {
            background: var(--bg-glass);
            border: 1px solid var(--border-glass);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .panel-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
        }

        .search-input {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-glass);
            color: var(--text-primary);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-family: var(--font-main);
            font-size: 0.9rem;
            min-width: 240px;
        }

        .search-input:focus {
            outline: none;
            border-color: #6366f1;
        }

        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        th {
            padding: 1rem;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--border-glass);
        }

        td {
            padding: 1rem;
            font-size: 0.95rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            vertical-align: top;
        }

        tr:hover td {
            background: rgba(255, 255, 255, 0.01);
        }

        /* Badges */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge.passed { background: rgba(16, 185, 129, 0.1); color: var(--color-passed); border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge.failed { background: rgba(239, 68, 68, 0.1); color: var(--color-failed); border: 1px solid rgba(239, 68, 68, 0.2); }
        .badge.skipped { background: rgba(245, 158, 11, 0.1); color: var(--color-skipped); border: 1px solid rgba(245, 158, 11, 0.2); }

        .badge.high { background: rgba(244, 63, 94, 0.1); color: var(--color-high); border: 1px solid rgba(244, 63, 94, 0.2); }
        .badge.medium { background: rgba(251, 146, 60, 0.1); color: var(--color-medium); border: 1px solid rgba(251, 146, 60, 0.2); }
        .badge.low { background: rgba(245, 158, 11, 0.1); color: var(--color-low); border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge.informational { background: rgba(59, 130, 246, 0.1); color: var(--color-info); border: 1px solid rgba(59, 130, 246, 0.2); }

        .code-path {
            font-family: var(--font-mono);
            font-size: 0.85rem;
            color: #818cf8;
        }

        .line-num {
            color: var(--text-secondary);
            font-family: var(--font-mono);
        }

        /* Business explanation styles */
        .business-explanation {
            background: rgba(99, 102, 241, 0.05);
            border-left: 2px solid #818cf8;
            padding: 0.75rem 1rem;
            margin-top: 0.5rem;
            border-radius: 0 8px 8px 0;
            font-size: 0.92rem;
            color: #e0e7ff;
            line-height: 1.4;
        }
        
        .business-explanation strong {
            color: #a5b4fc;
        }

        .technical-details {
            margin-top: 0.75rem;
            border-top: 1px dashed rgba(255, 255, 255, 0.04);
            padding-top: 0.75rem;
        }

        .technical-toggle-btn {
            background: transparent;
            border: none;
            color: #818cf8;
            font-size: 0.8rem;
            cursor: pointer;
            text-decoration: underline;
            padding: 0;
            margin-bottom: 0.5rem;
            display: inline-block;
        }

        .technical-box {
            display: none;
        }

        /* When technical mode is active, override hidden state */
        body.technical-mode .technical-box {
            display: block;
        }
        body.technical-mode .technical-toggle-btn {
            display: none;
        }

        .error-log {
            font-family: var(--font-mono);
            font-size: 0.8rem;
            background: rgba(239, 68, 68, 0.03);
            border: 1px solid rgba(239, 68, 68, 0.1);
            color: #fca5a5;
            padding: 0.75rem;
            border-radius: 8px;
            white-space: pre-wrap;
            max-height: 150px;
            overflow-y: auto;
        }

        .solution-box {
            background: rgba(16, 185, 129, 0.03);
            border-left: 2px solid var(--color-passed);
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
            margin-top: 0.5rem;
            color: #a7f3d0;
            border-radius: 0 4px 4px 0;
        }

        .no-data-msg {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-secondary);
        }

        .no-data-msg code {
            display: block;
            margin-top: 1rem;
            background: rgba(0,0,0,0.3);
            padding: 0.75rem;
            border-radius: 8px;
            font-family: var(--font-mono);
            color: #a5b4fc;
        }

        /* Guide formatting */
        .zap-guide-panel ol li {
            margin-bottom: 0.5rem;
        }
        .zap-guide-panel ul li {
            margin-bottom: 0.25rem;
            color: var(--text-secondary);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="header-title">
                <h1>RIKMS Verification & Security</h1>
                <p>Audits, quality validation checks, and security report details</p>
            </div>
            <div class="action-bar" style="display: flex; gap: 1rem; align-items: center;">
                <div class="mode-toggle">
                    <button id="btn-mode-exec" class="mode-btn active" onclick="setDashboardMode('executive')">Executive Summary</button>
                    <button id="btn-mode-tech" class="mode-btn" onclick="setDashboardMode('technical')">Technical View</button>
                </div>
                <button class="refresh-btn" onclick="loadAllData()">Refresh Dashboard</button>
            </div>
        </header>

        <!-- Executive Security Summary Section -->
        <section class="executive-panel">
            <div class="score-circle-container">
                <div class="score-circle">
                    <svg viewBox="0 0 100 100">
                        <circle class="bg-ring" cx="50" cy="50" r="40" />
                        <circle class="val-ring" id="health-ring" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="251.2" />
                    </svg>
                    <div class="score-text">
                        <span id="health-score-val">0</span>
                        <span>Health Score</span>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <span id="health-status-badge" class="health-badge poor">CALCULATING...</span>
                </div>
            </div>
            <div class="executive-summary-content">
                <h2>Executive Health Summary</h2>
                <p id="executive-summary-text">
                    Calculating audit parameters... Please make sure that your tests, code checks, and vulnerability reports have been loaded.
                </p>
                <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        <strong>Functional Quality:</strong> <span id="summary-functional-status">Passed (100%)</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        <strong>Code Architecture (SAST):</strong> <span id="summary-sast-status">N/A</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        <strong>Security Config (DAST):</strong> <span id="summary-dast-status">N/A</span>
                    </div>
                </div>
            </div>
        </section>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('tests')">PHPUnit Tests</button>
            <button class="tab-btn" onclick="switchTab('larastan')">SAST (Larastan)</button>
            <button class="tab-btn" onclick="switchTab('zap')">DAST (OWASP ZAP)</button>
        </div>

        <!-- ================= PHPUNIT TAB ================= -->
        <div id="tab-tests" class="tab-content active">
            <section class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Total Tests</div>
                    <div class="metric-value" id="test-total">0</div>
                    <div class="metric-subtext">Verified functions & routes</div>
                </div>
                <div class="metric-card passed">
                    <div class="metric-label">Passed</div>
                    <div class="metric-value" id="test-passed" style="color: var(--color-passed);">0</div>
                    <div class="metric-subtext" id="test-pass-pct">0% Success Rate</div>
                </div>
                <div class="metric-card failed">
                    <div class="metric-label">Failed</div>
                    <div class="metric-value" id="test-failed" style="color: var(--color-failed);">0</div>
                    <div class="metric-subtext">Requires code adjustments</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Duration</div>
                    <div class="metric-value" id="test-duration" style="color: #3b82f6;">0.00s</div>
                    <div class="metric-subtext" id="test-avg-time">Avg: 0.00s / test</div>
                </div>
            </section>

            <section class="viz-grid">
                <div class="viz-card">
                    <h2>Test Statuses</h2>
                    <div class="chart-container">
                        <canvas id="testPieChart"></canvas>
                    </div>
                </div>
                <div class="viz-card">
                    <h2>Top Slowest Test Cases</h2>
                    <div class="chart-container">
                        <canvas id="testBarChart"></canvas>
                    </div>
                </div>
            </section>

            <section class="panel">
                <div class="panel-header">
                    <h2>Test Case Details</h2>
                    <input type="text" id="testSearch" class="search-input" placeholder="Search test cases..." oninput="filterTests()">
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Test Case</th>
                                <th>Status</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody id="testTableBody"></tbody>
                    </table>
                </div>
            </section>
        </div>

        <!-- ================= LARASTAN TAB ================= -->
        <div id="tab-larastan" class="tab-content">
            <section class="metrics-grid">
                <div class="metric-card" id="sast-status-card">
                    <div class="metric-label">SAST Scan Status</div>
                    <div class="metric-value" id="sast-status">N/A</div>
                    <div class="metric-subtext">Static analysis health state</div>
                </div>
                <div class="metric-card failed">
                    <div class="metric-label">Total Code Errors</div>
                    <div class="metric-value" id="sast-errors" style="color: var(--color-failed);">0</div>
                    <div class="metric-subtext">Issues flagged by parser</div>
                </div>
            </section>

            <section class="panel">
                <div class="panel-header">
                    <h2>Larastan Code Violations</h2>
                    <input type="text" id="sastSearch" class="search-input" placeholder="Search errors..." oninput="filterLarastan()">
                </div>
                <div class="table-wrapper" id="larastan-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 25%;">File Location</th>
                                <th>Business Impact & Analysis</th>
                            </tr>
                        </thead>
                        <tbody id="larastanTableBody"></tbody>
                    </table>
                </div>
                <div id="larastan-no-data" class="no-data-msg" style="display: none;">
                    No Larastan analysis report found in the root directory. To generate it, run:
                    <code>php vendor/bin/phpstan analyse --error-format=json > larastan-report.json</code>
                </div>
            </section>
        </div>

        <!-- ================= OWASP ZAP TAB ================= -->
        <div id="tab-zap" class="tab-content">
            <section class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Total Alerts</div>
                    <div class="metric-value" id="zap-total">0</div>
                    <div class="metric-subtext">Unique security vulnerabilities</div>
                </div>
                <div class="metric-card high-alert">
                    <div class="metric-label">High Risk</div>
                    <div class="metric-value" id="zap-high" style="color: var(--color-high);">0</div>
                    <div class="metric-subtext">Critical risk issues</div>
                </div>
                <div class="metric-card warn-alert">
                    <div class="metric-label">Medium Risk</div>
                    <div class="metric-value" id="zap-medium" style="color: var(--color-medium);">0</div>
                    <div class="metric-subtext">Medium risk alerts</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Low & Info</div>
                    <div class="metric-value" id="zap-low" style="color: var(--color-low);">0</div>
                    <div class="metric-subtext">Minor alerts & disclosures</div>
                </div>
            </section>

            <!-- Guide Panel (Always available for easy instruction lookup) -->
            <section class="panel zap-guide-panel" style="margin-bottom: 2rem; border: 1px solid var(--border-glass);">
                <div class="panel-header" style="border-bottom: 1px solid var(--border-glass); padding-bottom: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="toggleZapGuide()">
                    <h2 style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem; color: #a5b4fc;">
                        <span>🛡️</span> Step-by-Step OWASP ZAP Scan Guide & Automation
                    </h2>
                    <span id="zap-guide-toggle-icon" style="color: #818cf8; font-size: 0.85rem; font-family: var(--font-mono); text-decoration: underline;">[ Show Guide ]</span>
                </div>
                <div id="zap-guide-content" style="margin-top: 1.25rem; display: none; font-size: 0.95rem; line-height: 1.6;">
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                        OWASP ZAP (Zed Attack Proxy) performs Dynamic Application Security Testing (DAST) by probing the running application from the outside, validating all vulnerability vectors listed in the project's penetration testing checklist.
                    </p>
                    <ol style="margin-left: 1.5rem; padding-left: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem; color: #d1d5db;">
                        <li>
                            <strong>Install OWASP ZAP Desktop:</strong> Download ZAP for Windows from <a href="https://www.zaproxy.org/download/" target="_blank" style="color: #818cf8; text-decoration: underline;">zaproxy.org/download</a> and install it.
                        </li>
                        <li>
                            <strong>Run the Target Application:</strong> Open a separate terminal and start your Laravel development server:
                            <code style="display: block; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 6px; font-family: var(--font-mono); margin-top: 0.4rem; color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2);">php artisan serve</code>
                            Ensure this runs on <code style="color: #a5b4fc; font-family: var(--font-mono);">http://localhost:8000</code> or <code style="color: #a5b4fc; font-family: var(--font-mono);">http://127.0.0.1:8000</code>.
                        </li>
                        <li>
                            <strong>Configure the Automated Scan:</strong>
                            <ul style="margin-left: 1.25rem; margin-top: 0.25rem; list-style-type: circle; display: flex; flex-direction: column; gap: 0.25rem;">
                                <li>Open <strong>OWASP ZAP Desktop</strong>.</li>
                                <li>Click on the <strong>Quick Start</strong> tab in the middle pane.</li>
                                <li>Click the big <strong>Automated Scan</strong> button.</li>
                                <li>Set <strong>URL to attack</strong> to: <code style="color: #818cf8; font-family: var(--font-mono);">http://127.0.0.1:8000</code></li>
                            </ul>
                        </li>
                        <li>
                            <strong>Launch Attack:</strong> Click the <strong>Attack</strong> button. ZAP will run a spider crawl followed by active dynamic testing. This simulates real attacks (XSS, SQL Injection, IDOR, Traversal, etc.).
                        </li>
                        <li>
                            <strong>Generate & Save JSON Report:</strong>
                            <ul style="margin-left: 1.25rem; margin-top: 0.25rem; list-style-type: circle; display: flex; flex-direction: column; gap: 0.25rem;">
                                <li>Wait for both progress bars at the bottom to reach 100%.</li>
                                <li>Go to the top menu and select: <strong>Report</strong> &gt; <strong>Generate Report</strong>.</li>
                                <li>Under **Template**, select <strong>JSON Report</strong> (this is crucial for parsing).</li>
                                <li>Click <strong>Generate Report</strong> and save the file directly in the RIKMS root folder as:
                                    <code style="color: #10b981; font-family: var(--font-mono); font-weight: bold;">zap-report.json</code>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Visualize:</strong> Click the <strong>Refresh Dashboard</strong> button at the top of this dashboard page.
                        </li>
                    </ol>
                    <div style="margin-top: 1.25rem; background: rgba(99, 102, 241, 0.08); border-left: 3px solid #6366f1; padding: 1rem; border-radius: 0 8px 8px 0; color: #a5b4fc; font-size: 0.9rem;">
                        <strong>🤖 Dashboard Scan Automation:</strong><br>
                        This dashboard script has been automated to search for standard ZAP installations on your computer (in standard Program Files paths or system PATH) and trigger a headlessly automated quick scan against the Laravel app if it detects it running on port 8000 or 8080! Check the python terminal log for scan progress.
                    </div>
                </div>
            </section>

            <section class="panel">
                <div class="panel-header">
                    <h2>Auditing Alerts</h2>
                    <input type="text" id="zapSearch" class="search-input" placeholder="Search security alerts..." oninput="filterZap()">
                </div>
                <div class="table-wrapper" id="zap-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 15%;">Risk</th>
                                <th style="width: 25%;">Vulnerability Title</th>
                                <th>Business Impact & Remedy Guide</th>
                            </tr>
                        </thead>
                        <tbody id="zapTableBody"></tbody>
                    </table>
                </div>
                <div id="zap-no-data" class="no-data-msg" style="display: none;">
                    No OWASP ZAP alert report found in the root directory. To generate it, save your ZAP scan alerts report as:
                    <code>zap-report.json</code>
                </div>
            </section>
        </div>
    </div>

    <script>
        // Data stores
        let testData = [];
        let larastanData = null;
        let zapData = [];

        // Chart instances
        let testPieInstance = null;
        let testBarInstance = null;

        // Toggle ZAP Guide panel
        function toggleZapGuide() {
            const content = document.getElementById('zap-guide-content');
            const icon = document.getElementById('zap-guide-toggle-icon');
            if (content.style.display === 'none' || content.style.display === '') {
                content.style.display = 'block';
                icon.innerText = '[ Hide Guide ]';
            } else {
                content.style.display = 'none';
                icon.innerText = '[ Show Guide ]';
            }
        }

        // Toggle dashboard view
        function setDashboardMode(mode) {
            document.getElementById('btn-mode-exec').classList.remove('active');
            document.getElementById('btn-mode-tech').classList.remove('active');
            document.body.classList.remove('technical-mode');

            if (mode === 'technical') {
                document.getElementById('btn-mode-tech').classList.add('active');
                document.body.classList.add('technical-mode');
            } else {
                document.getElementById('btn-mode-exec').classList.add('active');
            }
        }

        // Translation Maps for Non-Technical Users (SAST)
        function translateLarastanError(msg) {
            msg = msg.toLowerCase();
            if (msg.includes('undefined property') || msg.includes('has no property')) {
                return {
                    impact: "<strong>System Stability Risk:</strong> The program tried to access database information that does not exist. This could cause the page to crash or show error pages to agency administrators during document submission.",
                    remedy: "Ensure the field is properly defined in your database migrations and documented in the Eloquent model attributes."
                };
            }
            if (msg.includes('undefined method') || msg.includes('call to an undefined method')) {
                return {
                    impact: "<strong>Feature Reliability Risk:</strong> The system attempted to perform an action that was not defined in the code. This will cause operations (such as approving documents or extracting metadata) to fail completely when triggered.",
                    remedy: "Verify the method name spelling and ensure it is declared in the target class or service helper."
                };
            }
            if (msg.includes('expects') && msg.includes('given')) {
                return {
                    impact: "<strong>Data Integrity Risk:</strong> The system sent the wrong format of data (e.g. text instead of a number, or null/empty value instead of valid inputs). This could cause documents to be cataloged with corrupted or incomplete metadata records.",
                    remedy: "Refine input validation rules, add default fallback values, and define strict parameter type definitions."
                };
            }
            if (msg.includes('return type')) {
                return {
                    impact: "<strong>Functional Consistency Risk:</strong> A code function promised to return a specific type of output but delivered something else (or nothing). This is a source of silent logic failures in document approval processes.",
                    remedy: "Check return statements inside the flagged functions and align them with the return type declarations."
                };
            }
            
            return {
                impact: "<strong>General Logic Bug:</strong> Statically detected quality warning. This could cause unexpected behavior under load or when resolving draft records.",
                remedy: "Review code syntax for completeness and align parameter typing."
            };
        }

        // Translation Maps for Non-Technical Users (DAST) - Mapped to Key Vulnerabilities in docx
        function translateZapAlert(title) {
            title = title.toLowerCase();
            
            if (title.includes('clickjacking') || title.includes('x-frame-options')) {
                return {
                    impact: "<strong>User Hijacking Risk (Clickjacking - Security Misconfiguration):</strong> This vulnerability allows malicious websites to embed your application inside a hidden iframe. Attackers can overlay invisible buttons, tricking agency administrators into clicking buttons like 'Approve' or 'Delete' without their knowledge.",
                    remedy: "Configure your web server or Laravel middleware to send the header: <code>X-Frame-Options: SAMEORIGIN</code>."
                };
            }
            if (title.includes('content-type') || title.includes('sniffing')) {
                return {
                    impact: "<strong>Malicious File Execution Risk (MIME Sniffing - Security Misconfiguration):</strong> Without strict content type instructions, browsers might attempt to process document uploads as executable scripts. An attacker uploading a script disguised as a PDF could run malicious tasks in an administrator's browser.",
                    remedy: "Implement the security header: <code>X-Content-Type-Options: nosniff</code> in the server response headers."
                };
            }
            if (title.includes('httponly') || title.includes('cookie')) {
                return {
                    impact: "<strong>Session Hijacking Risk (Insecure Session / Cookie Misconfiguration):</strong> Login credentials/session indicators are stored in cookies that lack the 'HttpOnly' protection. If an attacker injects a script into the page, they can easily read this cookie and impersonate an administrator.",
                    remedy: "Ensure session cookies are configured with the <code>http_only => true</code> flag in <code>config/session.php</code>."
                };
            }
            if (title.includes('directory browsing') || title.includes('directory indexing')) {
                return {
                    impact: "<strong>Sensitive Data Leakage (Security Misconfiguration):</strong> Standard folder listing is allowed. Anyone can view the list of files in storage or public directories, potentially exposing private research documents or configuration assets.",
                    remedy: "Disable directory indexing in the Web server configuration (e.g. <code>Options -Indexes</code> in Apache, or remove indexing in Nginx)."
                };
            }
            if (title.includes('cors') || title.includes('cross-domain')) {
                return {
                    impact: "<strong>Information Disclosure Risk (CORS Vulnerability / Access Control):</strong> The server allows other websites to make requests and read data from your API endpoints without restrictions. Other domains could steal active session details.",
                    remedy: "Restrict CORS origins in <code>config/cors.php</code> to only allow trusted domain names."
                };
            }
            if (title.includes('sql injection') || title.includes('sql') || title.includes('database error')) {
                return {
                    impact: "<strong>Critical Data Exposure Risk (SQL Injection):</strong> Attackers can manipulate database queries through input fields (e.g. search/browse filters). This allows them to bypass authentication, read private research metadata, delete records, or extract administrator credentials.",
                    remedy: "Ensure all database queries use Eloquent ORM or parameterized bindings. Avoid raw query strings (e.g. <code>DB::raw</code>) with concatenated user inputs."
                };
            }
            if (title.includes('path traversal') || title.includes('directory traversal') || title.includes('file inclusion')) {
                return {
                    impact: "<strong>System File Access Risk (Path Traversal):</strong> Attackers can abuse file download or serving endpoints to access files outside the public storage directory (such as <code>.env</code> configurations or system files) by appending relative paths (e.g. <code>../../</code>).",
                    remedy: "Use Laravel's <code>Storage::download()</code> or parse filenames using <code>basename()</code>. Never build file paths using raw concatenated user input strings."
                };
            }
            if (title.includes('cross-site scripting') || title.includes('xss') || title.includes('script injection')) {
                return {
                    impact: "<strong>Session Hijacking & Defacement Risk (Cross-Site Scripting):</strong> Attackers inject malicious scripts into metadata fields (title, abstract, author). When an admin views the research record, the script runs in their browser, allowing session cookies to be stolen or actions to be performed on their behalf.",
                    remedy: "Ensure all output in Blade views is escaped using double braces <code>{{ $value }}</code>. For rich-text fields, run them through an HTML purifier library before rendering."
                };
            }
            if (title.includes('csrf') || title.includes('cross-site request forgery') || title.includes('session token')) {
                return {
                    impact: "<strong>Unauthorized State Modification Risk (CSRF):</strong> An attacker tricks an authenticated admin into clicking a link that triggers state-changing actions (e.g. changing passwords or deleting uploads) on RIKMS, exploiting their active session without their consent.",
                    remedy: "Verify that the <code>App\\Http\\Middleware\\ValidateCsrfToken</code> middleware is enabled for all web routes, and always include the <code>@csrf</code> directive in Blade forms."
                };
            }
            if (title.includes('access control') || title.includes('idor') || title.includes('insecure direct object reference') || title.includes('authorization')) {
                return {
                    impact: "<strong>Data Integrity & Privacy Leakage (IDOR / Broken Access Control):</strong> Users can access, edit, or download other users' research records simply by changing ID values in the URL (e.g., changing <code>/research/5</code> to <code>/research/6</code>) without proper permission validation.",
                    remedy: "Implement Laravel Policies or Gates. Always verify model ownership (e.g., <code>$request->user()->can('view', $document)</code>) before returning files or metadata."
                };
            }
            if (title.includes('file upload') || title.includes('unrestricted upload') || title.includes('upload vulnerability')) {
                return {
                    impact: "<strong>Remote Code Execution Risk (Unrestricted File Upload):</strong> Attackers upload malicious scripts (e.g. <code>.php</code> files) disguised as documents. If the server stores them in a public directory without verifying extensions, the attacker can execute commands on the server.",
                    remedy: "Validate uploaded file extensions and MIME types strictly using Laravel's validation rules (e.g. <code>mimes:pdf,docx</code>). Store files outside the web root (e.g. using private storage disk) and serve them via a controller."
                };
            }
            if (title.includes('rate limit') || title.includes('brute force') || title.includes('flooding')) {
                return {
                    impact: "<strong>Brute Force & Service Exhaustion Risk (Rate Limiting):</strong> Attackers can repeatedly submit login requests or upload huge files to crash the system or guess passwords without any rate limiting restrictions in place.",
                    remedy: "Apply Laravel's rate limiting middleware (<code>throttle:api</code> or custom rate limiters) to sensitive routes like login, register, and document upload."
                };
            }
            
            return {
                impact: "<strong>Security Configuration Warning:</strong> Standard server setup discrepancy. It may allow attackers to perform passive scanning or collect system information.",
                remedy: "Audit server response configurations and restrict header outputs to necessary metadata."
            };
        }

        function switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');
        }

        async function loadAllData() {
            await Promise.all([
                loadTestData(),
                loadLarastanData(),
                loadZapData()
            ]);
            calculateExecutiveHealth();
        }

        // --- PHPUNIT LOGIC ---
        async function loadTestData() {
            try {
                const response = await fetch('/api/results');
                testData = await response.json();
                renderTestMetrics();
                renderTestCharts();
                renderTestTable(testData);
            } catch (e) {
                console.error("Failed to load PHPUnit results:", e);
            }
        }

        function renderTestMetrics() {
            const total = testData.length;
            const passed = testData.filter(d => d.status === 'Passed').length;
            const failed = testData.filter(d => d.status === 'Failed').length;
            const totalTime = testData.reduce((acc, curr) => acc + curr.time, 0);
            const avgTime = total > 0 ? (totalTime / total) : 0;

            document.getElementById('test-total').innerText = total;
            document.getElementById('test-passed').innerText = passed;
            document.getElementById('test-failed').innerText = failed;
            document.getElementById('test-duration').innerText = totalTime.toFixed(2) + 's';
            
            const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
            document.getElementById('test-pass-pct').innerText = rate + '% Success Rate';
            document.getElementById('test-avg-time').innerText = 'Avg: ' + avgTime.toFixed(3) + 's / test';
        }

        function renderTestCharts() {
            const passed = testData.filter(d => d.status === 'Passed').length;
            const failed = testData.filter(d => d.status === 'Failed').length;
            const skipped = testData.filter(d => d.status === 'Skipped').length;

            if (passed === 0 && failed === 0 && skipped === 0) return;

            const pieCtx = document.getElementById('testPieChart').getContext('2d');
            if (testPieInstance) testPieInstance.destroy();
            testPieInstance = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'].filter((_, i) => [passed, failed, skipped][i] > 0),
                    datasets: [{
                        data: [passed, failed, skipped].filter(v => v > 0),
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'].filter((_, i) => [passed, failed, skipped][i] > 0),
                        borderColor: '#12131a',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#e5e7eb', font: { family: 'Outfit' } } }
                    },
                    cutout: '65%'
                }
            });

            const slowest = [...testData].sort((a, b) => b.time - a.time).slice(0, 5);
            const barCtx = document.getElementById('testBarChart').getContext('2d');
            if (testBarInstance) testBarInstance.destroy();
            testBarInstance = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: slowest.map(d => d.name.length > 25 ? d.name.substring(0, 25) + '...' : d.name),
                    datasets: [{
                        data: slowest.map(d => d.time),
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', font: { family: 'Outfit' } } },
                        y: { grid: { display: false }, ticks: { color: '#e5e7eb', font: { family: 'Outfit' } } }
                    }
                }
            });
        }

        function renderTestTable(data) {
            const tbody = document.getElementById('testTableBody');
            tbody.innerHTML = '';
            data.forEach(tc => {
                const tr = document.createElement('tr');
                let badgeClass = tc.status.toLowerCase();
                let detailRow = '';
                if (tc.status === 'Failed' && tc.message) {
                    detailRow = `<div class="error-log">${escapeHtml(tc.message)}</div>`;
                }

                tr.innerHTML = `
                    <td class="code-path">${escapeHtml(tc.class)}</td>
                    <td>
                        <div style="font-weight: 500; margin-bottom: 0.25rem;">${escapeHtml(tc.name)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(tc.fullname)}</div>
                        ${detailRow}
                    </td>
                    <td><span class="badge ${badgeClass}">${tc.status}</span></td>
                    <td class="duration-text">${tc.time.toFixed(4)}s</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function filterTests() {
            const query = document.getElementById('testSearch').value.toLowerCase();
            const filtered = testData.filter(d => 
                d.name.toLowerCase().includes(query) || 
                d.class.toLowerCase().includes(query)
            );
            renderTestTable(filtered);
        }

        // --- LARASTAN LOGIC ---
        async function loadLarastanData() {
            try {
                const response = await fetch('/api/larastan');
                larastanData = await response.json();
                
                const wrapper = document.getElementById('larastan-table-wrapper');
                const nodata = document.getElementById('larastan-no-data');
                
                if (!larastanData || Object.keys(larastanData).length === 0) {
                    wrapper.style.display = 'none';
                    nodata.style.display = 'block';
                    document.getElementById('sast-errors').innerText = '0';
                    document.getElementById('sast-status').innerText = 'N/A';
                    document.getElementById('sast-status-card').className = 'metric-card';
                    return;
                }
                
                wrapper.style.display = 'block';
                nodata.style.display = 'none';
                
                const errors = larastanData.errors || [];
                document.getElementById('sast-errors').innerText = errors.length;
                
                const statusEl = document.getElementById('sast-status');
                const cardEl = document.getElementById('sast-status-card');
                if (errors.length === 0) {
                    statusEl.innerText = 'PASSED';
                    statusEl.style.color = 'var(--color-passed)';
                    cardEl.className = 'metric-card passed';
                } else {
                    statusEl.innerText = 'FAILING';
                    statusEl.style.color = 'var(--color-failed)';
                    cardEl.className = 'metric-card failed';
                }
                
                renderLarastanTable(errors);
            } catch (e) {
                console.error("Failed to load Larastan results:", e);
            }
        }

        function renderLarastanTable(errors) {
            const tbody = document.getElementById('larastanTableBody');
            tbody.innerHTML = '';
            if (errors.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--color-passed); padding: 2rem;">Clean scan! Larastan found zero issues in your codebase.</td></tr>';
                return;
            }
            errors.forEach(err => {
                const tr = document.createElement('tr');
                const trans = translateLarastanError(err.message);
                
                tr.innerHTML = `
                    <td>
                        <div class="code-path">${escapeHtml(err.file)}</div>
                        <div class="line-num">Line ${err.line}</div>
                    </td>
                    <td>
                        <div class="business-explanation">
                            ${trans.impact}
                        </div>
                        <div class="technical-details">
                            <button class="technical-toggle-btn" onclick="toggleTechBox(this)">Show Technical Code Error</button>
                            <div class="technical-box">
                                <div class="error-log" style="margin-bottom: 0.5rem;">${escapeHtml(err.message)}</div>
                                <div style="font-size: 0.85rem; color: #a7f3d0;"><strong>Suggested Fix:</strong> ${trans.remedy}</div>
                            </div>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function toggleTechBox(btn) {
            const box = btn.nextElementSibling;
            if (box.style.display === 'block') {
                box.style.display = 'none';
                btn.innerText = 'Show Technical Code Error';
            } else {
                box.style.display = 'block';
                btn.innerText = 'Hide Technical Code Error';
            }
        }

        function filterLarastan() {
            if (!larastanData || !larastanData.errors) return;
            const query = document.getElementById('sastSearch').value.toLowerCase();
            const filtered = larastanData.errors.filter(d => 
                d.file.toLowerCase().includes(query) || 
                d.message.toLowerCase().includes(query)
            );
            renderLarastanTable(filtered);
        }

        // --- ZAP LOGIC ---
        async function loadZapData() {
            try {
                const response = await fetch('/api/zap');
                zapData = await response.json();
                
                const wrapper = document.getElementById('zap-table-wrapper');
                const nodata = document.getElementById('zap-no-data');
                
                if (!zapData || zapData.length === 0) {
                    wrapper.style.display = 'none';
                    nodata.style.display = 'block';
                    document.getElementById('zap-total').innerText = '0';
                    document.getElementById('zap-high').innerText = '0';
                    document.getElementById('zap-medium').innerText = '0';
                    document.getElementById('zap-low').innerText = '0';
                    return;
                }
                
                wrapper.style.display = 'block';
                nodata.style.display = 'none';
                
                const total = zapData.length;
                const high = zapData.filter(d => d.risk.toLowerCase() === 'high').length;
                const medium = zapData.filter(d => d.risk.toLowerCase() === 'medium').length;
                const lowOrInfo = total - high - medium;
                
                document.getElementById('zap-total').innerText = total;
                document.getElementById('zap-high').innerText = high;
                document.getElementById('zap-medium').innerText = medium;
                document.getElementById('zap-low').innerText = lowOrInfo;
                
                renderZapTable(zapData);
            } catch (e) {
                console.error("Failed to load ZAP results:", e);
            }
        }

        function renderZapTable(alerts) {
            const tbody = document.getElementById('zapTableBody');
            tbody.innerHTML = '';
            alerts.forEach(alert => {
                const tr = document.createElement('tr');
                const badgeClass = alert.risk.toLowerCase();
                const trans = translateZapAlert(alert.title);
                
                let urlsList = '';
                if (alert.urls && alert.urls.length > 0) {
                    urlsList = `<div style="margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">
                        <strong>Impacted Web Pages/APIs:</strong>
                        <ul style="list-style-type: none; margin-top: 0.25rem;">
                            ${alert.urls.map(u => `<li>${escapeHtml(u)}</li>`).join('')}
                        </ul>
                    </div>`;
                }

                tr.innerHTML = `
                    <td><span class="badge ${badgeClass}">${alert.risk}</span></td>
                    <td style="font-weight: 600;">${escapeHtml(alert.title)}</td>
                    <td>
                        <div class="business-explanation">
                            ${trans.impact}
                        </div>
                        ${urlsList}
                        <div class="technical-details">
                            <button class="technical-toggle-btn" onclick="toggleTechBox(this)">Show Technical Details & Fix</button>
                            <div class="technical-box">
                                <div class="description-box" style="margin-bottom: 0.5rem;">${escapeHtml(alert.description)}</div>
                                <div class="solution-box">
                                    <strong>How to Resolve:</strong><br>
                                    ${trans.remedy}<br><br>
                                    <em>Technical Recommendation:</em> ${escapeHtml(alert.solution)}
                                </div>
                            </div>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function filterZap() {
            const query = document.getElementById('zapSearch').value.toLowerCase();
            const filtered = zapData.filter(d => 
                d.title.toLowerCase().includes(query) || 
                d.description.toLowerCase().includes(query) ||
                d.risk.toLowerCase().includes(query)
            );
            renderZapTable(filtered);
        }

        // --- EXECUTIVE HEALTH SCORING ---
        function calculateExecutiveHealth() {
            let score = 100;
            let summaryText = "";

            // 1. PHPUnit Tests Contribution (max 40 pts)
            let testSubScore = 40;
            const testTotal = testData.length;
            const testPassed = testData.filter(d => d.status === 'Passed').length;
            const testFailed = testData.filter(d => d.status === 'Failed').length;
            if (testTotal > 0) {
                const passRate = testPassed / testTotal;
                testSubScore = Math.round(passRate * 40);
                if (testFailed > 0) {
                    summaryText += `Your application has ${testFailed} failing unit test(s) which will break basic system features. `;
                }
            } else {
                testSubScore = 0;
                summaryText += "No functional PHPUnit tests were detected. ";
            }

            // 2. Larastan SAST Contribution (max 30 pts)
            let sastSubScore = 30;
            let sastReportExists = false;
            let sastErrorsCount = 0;
            if (larastanData && Object.keys(larastanData).length > 0) {
                sastReportExists = true;
                sastErrorsCount = (larastanData.errors || []).length;
                sastSubScore = Math.max(0, 30 - (sastErrorsCount * 3)); // -3 pts per static error
                
                const sastStatusEl = document.getElementById('summary-sast-status');
                if (sastErrorsCount === 0) {
                    sastStatusEl.innerText = "Excellent (0 issues)";
                    sastStatusEl.style.color = "var(--color-passed)";
                } else {
                    sastStatusEl.innerText = `Needs Attention (${sastErrorsCount} errors)`;
                    sastStatusEl.style.color = "var(--color-failed)";
                }
            } else {
                sastSubScore = 15; // default middle points if report doesn't exist
                document.getElementById('summary-sast-status').innerText = "Report Missing (Pending Scan)";
                document.getElementById('summary-sast-status').style.color = "var(--text-secondary)";
            }

            // 3. OWASP ZAP DAST Contribution (max 30 pts)
            let dastSubScore = 30;
            let zapReportExists = false;
            let zapHighCount = 0;
            let zapMediumCount = 0;
            let zapLowCount = 0;

            if (zapData && zapData.length > 0) {
                zapReportExists = true;
                zapHighCount = zapData.filter(d => d.risk.toLowerCase() === 'high').length;
                zapMediumCount = zapData.filter(d => d.risk.toLowerCase() === 'medium').length;
                zapLowCount = zapData.filter(d => d.risk.toLowerCase() === 'low' || d.risk.toLowerCase() === 'warning').length;

                // Penalties: -15 per High, -5 per Medium, -1 per Low
                dastSubScore = Math.max(0, 30 - (zapHighCount * 15) - (zapMediumCount * 5) - (zapLowCount * 1));

                const dastStatusEl = document.getElementById('summary-dast-status');
                if (zapHighCount > 0) {
                    dastStatusEl.innerText = `Critical Risk (${zapHighCount} High Alerts)`;
                    dastStatusEl.style.color = "var(--color-high)";
                } else if (zapMediumCount > 0) {
                    dastStatusEl.innerText = `Warning (${zapMediumCount} Medium Alerts)`;
                    dastStatusEl.style.color = "var(--color-medium)";
                } else {
                    dastStatusEl.innerText = `Good (${zapLowCount} Low Alerts)`;
                    dastStatusEl.style.color = "var(--color-low)";
                }
            } else {
                dastSubScore = 15; // default middle
                document.getElementById('summary-dast-status').innerText = "Report Missing (Pending Scan)";
                document.getElementById('summary-dast-status').style.color = "var(--text-secondary)";
            }

            score = testSubScore + sastSubScore + dastSubScore;

            // Health description writing
            if (score >= 90) {
                summaryText = "The application health is Excellent. All functional test verification passes successfully, code formatting follows security practices, and there are no severe configuration issues. The prototype is safe for stakeholder demonstration.";
                document.getElementById('health-status-badge').innerText = "EXCELLENT HEALTH";
                document.getElementById('health-status-badge').className = "health-badge excellent";
            } else if (score >= 70) {
                summaryText = "The application health is Stable but Needs Attention. Basic operations function correctly, but we found code standard warnings or minor configuration vulnerabilities (like missing web security headers). Resolving these will secure user sessions and prevent page hijackings.";
                document.getElementById('health-status-badge').innerText = "STABLE / WARN";
                document.getElementById('health-status-badge').className = "health-badge good";
            } else {
                summaryText = "The application is currently At Risk. We detected active test failures, structural code errors, or significant vulnerability alerts (such as CORS exposure or clickjacking risks). Developers should focus on patching these items before exposing the portal to public traffic.";
                document.getElementById('health-status-badge').innerText = "CRITICAL RISK";
                document.getElementById('health-status-badge').className = "health-badge poor";
            }

            // Append report generation reminders
            let missingReports = [];
            if (!sastReportExists) missingReports.push("Larastan (SAST)");
            if (!zapReportExists) missingReports.push("OWASP ZAP (DAST)");
            if (missingReports.length > 0) {
                summaryText += ` Note: To compute a more accurate security health score, please generate and load the reports for ${missingReports.join(" and ")}.`;
            }

            document.getElementById('executive-summary-text').innerHTML = summaryText;

            // Animate Score circle ring
            document.getElementById('health-score-val').innerText = score;
            const circleRadius = 40;
            const circumference = 2 * Math.PI * circleRadius; // ~251.2
            const ringEl = document.getElementById('health-ring');
            const offset = circumference - (score / 100) * circumference;
            ringEl.style.strokeDashoffset = offset;
            
            // Adjust ring color dynamically
            if (score >= 90) ringEl.style.stroke = "var(--color-passed)";
            else if (score >= 70) ringEl.style.stroke = "var(--color-skipped)";
            else ringEl.style.stroke = "var(--color-failed)";
        }

        // Utils
        function escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Initialize
        window.onload = loadAllData;
    </script>
</body>
</html>
"""

def run_server():
    port = PORT
    handler = DashboardHandler
    socketserver.TCPServer.allow_reuse_address = True
    
    global ACTIVE_DASHBOARD_PORT
    
    while port < PORT + 50:
        try:
            with socketserver.TCPServer(("", port), handler) as httpd:
                ACTIVE_DASHBOARD_PORT = port
                print("=======================================================")
                print(f" RIKMS Verification & Auditing Dashboard is running at:")
                print(f" http://localhost:{port}/")
                print("=======================================================")
                
                # Start background scans automatically in a separate thread so startup is instant
                threading.Thread(target=run_background_scans, daemon=True).start()
                
                webbrowser.open(f"http://localhost:{port}/")
                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == '__main__':
    run_server()
