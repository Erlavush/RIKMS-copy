"use strict";

const token = document.querySelector('meta[name="rikms-lab-token"]').content;
const finalStates = new Set(["passed", "failed", "blocked", "skipped", "unavailable", "cancelled", "stale"]);
const charts = { pie: null, bar: null };
let snapshot = null;

const byId = (id) => document.getElementById(id);
const setText = (id, value) => {
  const element = byId(id);
  if (element) element.textContent = String(value);
};
const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

// Preserve Jaylord's original A/B leg pairing so the rigid cuboids keep their silhouette.
const minecraftLegs = [
  { selector: ".leg.l1", side: -1, phase: 0, reach: 1.08, feeler: true },
  { selector: ".leg.r1", side: 1, phase: Math.PI, reach: 1.08, feeler: true },
  { selector: ".leg.l2", side: -1, phase: Math.PI, reach: 0.92, feeler: false },
  { selector: ".leg.r2", side: 1, phase: 0, reach: 0.92, feeler: false },
  { selector: ".leg.l3", side: -1, phase: 0, reach: 0.92, feeler: false },
  { selector: ".leg.r3", side: 1, phase: Math.PI, reach: 0.92, feeler: false },
  { selector: ".leg.l4", side: -1, phase: Math.PI, reach: 1.08, feeler: false },
  { selector: ".leg.r4", side: 1, phase: 0, reach: 1.08, feeler: false },
];

function configureProceduralSpider() {
  const viewport = byId("spider-viewport");
  const spider = viewport?.querySelector(".mc-spider");
  if (!viewport || !spider) return;

  const legs = minecraftLegs
    .map((definition) => ({ ...definition, element: viewport.querySelector(definition.selector) }))
    .filter((leg) => leg.element);
  if (legs.length !== 8) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let gaitPhase = 0;
  let activity = 0;
  let previousTime = performance.now();

  const angle = (value) => `${value.toFixed(3)}deg`;
  const distance = (value) => `${value.toFixed(3)}px`;

  function resetPose() {
    activity = 0;
    viewport.dataset.gait = "reduced-motion";
    legs.forEach(({ element }) => {
      element.style.setProperty("--gait-yaw", "0deg");
      element.style.setProperty("--gait-roll", "0deg");
      element.style.setProperty("--gait-pitch", "0deg");
    });
    spider.style.setProperty("--body-x", "0px");
    spider.style.setProperty("--body-y", "0px");
    spider.style.setProperty("--body-z", "0px");
    spider.style.setProperty("--body-pitch", "0deg");
    spider.style.setProperty("--body-yaw", "0deg");
    spider.style.setProperty("--body-roll", "0deg");
  }

  function animate(time) {
    const deltaSeconds = Math.min(0.05, Math.max(0, (time - previousTime) / 1000));
    previousTime = time;

    if (reducedMotion.matches) {
      resetPose();
      window.requestAnimationFrame(animate);
      return;
    }
    if (document.hidden) {
      window.requestAnimationFrame(animate);
      return;
    }

    const isCrawling = viewport.classList.contains("scanning");
    const targetActivity = isCrawling ? 1 : 0;
    const response = isCrawling ? 5.8 : 3.2;
    activity += (targetActivity - activity) * (1 - Math.exp(-response * deltaSeconds));
    if (!isCrawling && activity < 0.001) activity = 0;

    gaitPhase += deltaSeconds * (0.8 + activity * 6.4);
    const idleWave = Math.sin(time * 0.00135);
    const stepWave = Math.sin(gaitPhase);
    const strideWave = Math.cos(gaitPhase);
    const bodyLift = (1 - Math.cos(gaitPhase * 2)) * 0.5;

    legs.forEach(({ element, side, phase, reach, feeler }) => {
      const legPhase = gaitPhase + phase;
      const stride = Math.cos(legPhase);
      const idleFeeler = feeler ? side * idleWave * 0.8 * (1 - activity) : 0;
      const yaw = side * -stride * 2.75 * reach * activity + idleFeeler;
      const roll = side * stride * 5.5 * reach * activity;
      const pitch = -stride * 7 * reach * activity;

      element.style.setProperty("--gait-yaw", angle(yaw));
      element.style.setProperty("--gait-roll", angle(roll));
      element.style.setProperty("--gait-pitch", angle(pitch));
    });

    const resting = 1 - activity;
    spider.style.setProperty("--body-x", distance(stepWave * 0.45 * activity));
    spider.style.setProperty("--body-y", distance(idleWave * 0.75 * resting - bodyLift * 1.35 * activity));
    spider.style.setProperty("--body-z", distance(strideWave * 0.2 * activity));
    spider.style.setProperty("--body-pitch", angle(Math.cos(gaitPhase * 2) * 0.35 * activity));
    spider.style.setProperty("--body-yaw", angle(idleWave * 0.2 * resting + stepWave * 0.45 * activity));
    spider.style.setProperty("--body-roll", angle(-stepWave * 0.65 * activity));
    viewport.dataset.gait = activity > 0.08 ? (isCrawling ? "crawl" : "settling") : "idle";

    window.requestAnimationFrame(animate);
  }

  viewport.classList.add("procedural-spider");
  viewport.dataset.gait = "idle";
  reducedMotion.addEventListener("change", () => {
    previousTime = performance.now();
    if (reducedMotion.matches) resetPose();
  });
  document.addEventListener("visibilitychange", () => {
    previousTime = performance.now();
  });
  window.requestAnimationFrame(animate);
}

function displayTime(value) {
  if (!value) return "Pending scan...";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleString();
}

function badgeState(status) {
  if (!status) return ["pending", "Not run"];
  if (status === "passed") return ["completed", "Completed"];
  return [status, status.replaceAll("_", " ")];
}

function setBadge(id, status) {
  const badge = byId(id);
  if (!badge) return;
  const [className, label] = badgeState(status);
  badge.className = `scan-badge ${className}`;
  badge.textContent = label;
}

function aggregateStatus(tools, names) {
  const statuses = names.map((name) => tools[name]?.status).filter(Boolean);
  if (!statuses.length) return null;
  if (statuses.includes("running")) return "running";
  if (statuses.includes("queued")) return "queued";
  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("unavailable")) return "unavailable";
  if (statuses.every((status) => status === "passed")) return "passed";
  return statuses[0];
}

function appendCell(row, value, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = String(value ?? "");
  row.append(cell);
  return cell;
}

function appendRow(body, values, searchText = "") {
  const row = document.createElement("tr");
  row.dataset.search = searchText.toLowerCase();
  values.forEach((value) => appendCell(row, value));
  body.append(row);
  return row;
}

function setEmpty(id, visible, message = "") {
  const element = byId(id);
  if (!element) return;
  if (message) element.textContent = message;
  element.style.display = visible ? "block" : "none";
}

function testMeaning(testCase) {
  const source = `${testCase.class} ${testCase.name}`.toLowerCase();
  if (source.includes("access") || source.includes("role") || source.includes("public")) {
    return ["Privacy & Access Boundary", "Checks that private records and role-restricted actions remain inaccessible."];
  }
  if (source.includes("document") || source.includes("upload") || source.includes("file")) {
    return ["Document Safety", "Checks secure upload, processing, extraction, and review behavior."];
  }
  if (source.includes("ai") || source.includes("ollama")) {
    return ["AI Safety Boundary", "Checks schema validation, source safety, and human review gates."];
  }
  if (source.includes("security") || source.includes("login") || source.includes("csrf")) {
    return ["Cybersecurity Defense", "Checks authentication, session, request, and configuration defenses."];
  }
  return ["Application Behavior", "Checks that the named workflow behaves as the application contract requires."];
}

function renderTests(tool, run) {
  const metrics = tool?.metrics || {};
  const total = asNumber(metrics.tests);
  const failed = asNumber(metrics.failures) + asNumber(metrics.errors);
  const skipped = asNumber(metrics.skipped);
  const passed = Math.max(0, total - failed - skipped);
  const duration = asNumber(tool?.duration_ms) / 1000;
  setText("test-total", total);
  setText("test-passed", passed);
  setText("test-failed", failed);
  setText("test-pass-pct", `${total ? Math.round((passed / total) * 100) : 0}% Success Rate`);
  setText("test-duration", `${duration.toFixed(2)}s`);
  setText("test-avg-time", `Avg: ${total ? (duration / total).toFixed(3) : "0.000"}s / test`);
  setText("test-scan-time", displayTime(tool?.completed_at || run?.completed_at));

  const cases = Array.isArray(metrics.test_cases) ? metrics.test_cases : [];
  const body = byId("testTableBody");
  body?.replaceChildren();
  cases.forEach((testCase) => {
    const [type, meaning] = testMeaning(testCase);
    appendRow(
      body,
      [testCase.class || "Application", type, meaning, testCase.status || "unknown", `${asNumber(testCase.time).toFixed(3)}s`],
      `${testCase.class} ${testCase.name} ${type} ${meaning} ${testCase.status}`,
    );
  });
  renderTestCharts(cases, passed, failed, skipped);
}

function renderTestCharts(cases, passed, failed, skipped) {
  if (!window.Chart) return;
  charts.pie?.destroy();
  charts.bar?.destroy();
  const pie = byId("testPieChart");
  const bar = byId("testBarChart");
  if (pie) {
    charts.pie = new window.Chart(pie, {
      type: "doughnut",
      data: { labels: ["Passed", "Failed", "Skipped"], datasets: [{ data: [passed, failed, skipped], backgroundColor: ["#10b981", "#ef4444", "#f59e0b"], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#d1d5db" } } } },
    });
  }
  if (bar) {
    const slowest = [...cases].sort((left, right) => asNumber(right.time) - asNumber(left.time)).slice(0, 8);
    charts.bar = new window.Chart(bar, {
      type: "bar",
      data: { labels: slowest.map((item) => String(item.name || "test").slice(0, 32)), datasets: [{ label: "Seconds", data: slowest.map((item) => asNumber(item.time)), backgroundColor: "#6366f1" }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,.05)" } }, y: { ticks: { color: "#9ca3af" }, grid: { display: false } } }, plugins: { legend: { display: false } } },
    });
  }
}

function renderLarastan(tool, run) {
  const metrics = tool?.metrics || {};
  const errors = asNumber(metrics.errors);
  setText("sast-status", tool ? (tool.status === "passed" ? "PASSED" : tool.status.toUpperCase()) : "NOT RUN");
  setText("sast-errors", errors);
  setText("larastan-scan-time", displayTime(tool?.completed_at || run?.completed_at));
  const messages = Array.isArray(metrics.messages) ? metrics.messages : [];
  const body = byId("larastanTableBody");
  body?.replaceChildren();
  messages.forEach((message) => appendRow(body, [`${message.file}:${message.line || "?"}`, message.message], `${message.file} ${message.message}`));
  setEmpty("larastan-no-data", !tool || messages.length === 0, tool?.status === "passed" ? "Larastan completed with no code errors." : "No Larastan evidence has been collected.");
}

function renderZap(tool, run) {
  const metrics = tool?.metrics || {};
  const findings = Array.isArray(tool?.findings) ? tool.findings : [];
  setText("zap-total", asNumber(metrics.alerts) || findings.length);
  setText("zap-high", asNumber(metrics.high) + asNumber(metrics.critical));
  setText("zap-medium", asNumber(metrics.medium));
  setText("zap-low", asNumber(metrics.low) + asNumber(metrics.informational) + asNumber(metrics.info));
  setText("zap-scan-time", displayTime(tool?.completed_at || run?.completed_at));
  const body = byId("zapTableBody");
  body?.replaceChildren();
  findings.forEach((finding) => appendRow(body, [finding.severity || "info", finding.title || finding.id, finding.observed || "Review private evidence."], `${finding.severity} ${finding.title} ${finding.observed}`));
  setEmpty("zap-no-data", findings.length === 0, tool ? tool.summary : "ZAP has not been run. It remains explicitly opt-in.");
}

function renderSca(composer, npm, run) {
  const composerItems = Array.isArray(composer?.metrics?.items) ? composer.metrics.items : [];
  const npmItems = Array.isArray(npm?.metrics?.items) ? npm.metrics.items : [];
  const composerCount = asNumber(composer?.metrics?.advisories);
  const npmCount = asNumber(npm?.metrics?.total);
  setText("sca-composer-count", composerCount);
  setText("sca-npm-count", npmCount);
  const status = aggregateStatus({ composer, npm }, ["composer", "npm"]);
  setText("sca-status-value", status ? status.toUpperCase() : "NOT RUN");
  setText("sca-scan-time", displayTime(composer?.completed_at || npm?.completed_at || run?.completed_at));
  const composerBody = byId("scaComposerTableBody");
  const npmBody = byId("scaNpmTableBody");
  composerBody?.replaceChildren();
  npmBody?.replaceChildren();
  composerItems.forEach((item) => appendRow(composerBody, [item.package, item.severity, item.cve, item.title, item.link]));
  npmItems.forEach((item) => appendRow(npmBody, [item.package, item.severity, item.cve, item.title, item.link]));
  setEmpty("sca-composer-no-data", composerItems.length === 0, composer?.status === "passed" ? "Composer audit found no known advisories." : "No Composer audit evidence has been collected.");
  setEmpty("sca-npm-no-data", npmItems.length === 0, npm?.status === "passed" ? "npm audit found no known advisories." : "No npm audit evidence has been collected.");
}

function renderNative(tool, run) {
  const metrics = tool?.metrics || {};
  const findings = Array.isArray(tool?.findings) ? tool.findings : [];
  const total = asNumber(metrics.checks);
  const passed = asNumber(metrics.passed);
  setText("native-total-count", total);
  setText("native-passed-count", passed);
  setText("native-failed-count", Math.max(findings.length, total - passed));
  setText("native-scan-time", displayTime(tool?.completed_at || run?.completed_at));
  const body = byId("nativeTableBody");
  body?.replaceChildren();
  findings.forEach((finding) => appendRow(body, [finding.id, finding.title, "Observation", finding.severity, finding.observed], `${finding.id} ${finding.title} ${finding.observed}`));
  setEmpty("native-no-data", findings.length === 0, tool?.status === "passed" ? "The native boundary checks completed without automated findings." : "No native boundary evidence has been collected.");
}

function renderAi(tool) {
  const metrics = tool?.metrics || {};
  setText("ai-total", asNumber(metrics.fixtures));
  setText("ai-passed", asNumber(metrics.passed));
  setText("ai-failed", asNumber(metrics.failed));
  setText("ai-model", metrics.model || "Not run");
  const root = byId("ai-findings");
  root?.replaceChildren();
  const findings = Array.isArray(tool?.findings) ? tool.findings : [];
  if (!tool || findings.length === 0) {
    const empty = document.createElement("div");
    empty.className = "no-data-msg";
    empty.textContent = tool ? tool.summary : "No AI evidence has been collected.";
    root?.append(empty);
    return;
  }
  findings.forEach((finding) => {
    const card = document.createElement("article");
    card.className = "ai-finding";
    const title = document.createElement("strong");
    const observed = document.createElement("span");
    title.textContent = `${finding.severity || "info"}: ${finding.title || finding.id}`;
    observed.textContent = finding.observed || "Review the private evidence.";
    card.append(title, observed);
    root?.append(card);
  });
}

function renderCoverage(run, tools) {
  const selectedTools = Object.values(tools);
  const complete = selectedTools.filter((tool) => finalStates.has(tool.status)).length;
  const coverage = selectedTools.length ? Math.round((complete / selectedTools.length) * 100) : 0;
  setText("health-score-val", coverage);
  const ring = byId("health-ring");
  if (ring) {
    ring.style.strokeDashoffset = String(251.2 - (coverage / 100) * 251.2);
    ring.style.stroke = selectedTools.some((tool) => tool.status === "failed") ? "var(--color-failed)" : "var(--color-passed)";
  }
  const badge = byId("health-status-badge");
  if (badge) {
    badge.textContent = run ? run.status.toUpperCase() : "NOT RUN";
    badge.className = `health-badge ${run?.status === "passed" ? "excellent" : run ? "good" : "poor"}`;
  }
  setText("summary-functional-status", tools.phpunit?.status || "Not run");
  setText("summary-sast-status", tools.larastan?.status || "Not run");
  setText("summary-dast-status", tools.zap?.status || "Not run");
  setText("summary-native-status", tools.native?.status || "Not run");
  setText("executive-summary-text", run ? `Evidence coverage is ${coverage}% for revision ${String(run.revision).slice(0, 12)} and target ${run.target}. Automated observations require manual reproduction before confirmation.` : "No evidence has been collected for this revision. Run the checks explicitly before reviewing results.");
}

function render(data) {
  snapshot = data;
  const run = data.run;
  const tools = run?.tools || {};
  setBadge("scan-status-phpunit", tools.phpunit?.status);
  setBadge("scan-status-larastan", tools.larastan?.status);
  setBadge("scan-status-sca", aggregateStatus(tools, ["composer_audit", "npm_audit"]));
  setBadge("scan-status-routes", tools.routes?.status);
  setBadge("scan-status-native", tools.native?.status);
  setBadge("scan-status-zap", tools.zap?.status);
  setBadge("scan-status-ai", tools.ai_metadata?.status);

  const viewport = byId("spider-viewport");
  viewport?.classList.toggle("scanning", data.running);
  setText("spider-state-label", data.running ? "Spider is crawling authorized boundaries..." : run ? "Scan complete. Spider is resting." : "Spider is resting. No scan is automatic.");
  setText("scan-global-status", data.running ? "Scans are actively executing" : run ? `Evidence run ${run.status}` : "Ready for an explicit scan");

  renderCoverage(run, tools);
  renderTests(tools.phpunit, run);
  renderLarastan(tools.larastan, run);
  renderZap(tools.zap, run);
  renderSca(tools.composer_audit, tools.npm_audit, run);
  renderNative(tools.native, run);
  renderAi(tools.ai_metadata);
  document.querySelectorAll(".refresh-btn").forEach((button) => { button.disabled = data.running; });
}

async function poll() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error(`Status request failed (${response.status})`);
    render(await response.json());
  } catch (error) {
    setText("core-feedback", error.message);
  }
}

async function startRun(selected, feedbackId) {
  setText(feedbackId, "Starting a bounded local evidence run...");
  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-RIKMS-Lab-Token": token },
      body: JSON.stringify({ selected }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || payload.error || "Run was refused");
    setText(feedbackId, `Started ${payload.message}`);
    await poll();
  } catch (error) {
    setText(feedbackId, error.message);
  }
}

function filterRows(inputId, bodyId) {
  const query = byId(inputId)?.value.trim().toLowerCase() || "";
  byId(bodyId)?.querySelectorAll("tr").forEach((row) => {
    row.hidden = query !== "" && !row.dataset.search.includes(query);
  });
}

function configureInteractions() {
  const tabNames = ["tests", "larastan", "zap", "sca", "native", "ai"];
  document.querySelectorAll(".tab-btn").forEach((button, index) => {
    const tab = button.dataset.tab || tabNames[index];
    button.dataset.tab = tab;
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelectorAll(".tab-content").forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${tab}`));
    });
  });

  byId("btn-mode-exec")?.addEventListener("click", () => {
    byId("btn-mode-exec").classList.add("active");
    byId("btn-mode-tech")?.classList.remove("active");
    document.body.classList.remove("technical-mode");
  });
  byId("btn-mode-tech")?.addEventListener("click", () => {
    byId("btn-mode-tech").classList.add("active");
    byId("btn-mode-exec")?.classList.remove("active");
    document.body.classList.add("technical-mode");
  });

  const core = document.querySelector(".action-bar > .refresh-btn");
  if (core) {
    const feedback = document.createElement("span");
    feedback.id = "core-feedback";
    feedback.className = "run-feedback";
    core.after(feedback);
    core.addEventListener("click", () => startRun(["code", "passive"], "core-feedback"));
  }
  byId("run-ai")?.addEventListener("click", () => startRun(["ai"], "run-feedback"));

  const zapHeader = byId("tab-zap")?.querySelector(".panel-header");
  if (zapHeader) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "refresh-btn";
    button.textContent = "Run Authorized ZAP";
    button.addEventListener("click", (event) => { event.stopPropagation(); startRun(["zap"], "core-feedback"); });
    zapHeader.append(button);
    zapHeader.addEventListener("click", () => {
      const guide = byId("zap-guide-content");
      const visible = guide?.style.display !== "none";
      if (guide) guide.style.display = visible ? "none" : "block";
      setText("zap-guide-toggle-icon", visible ? "[ Show Guide ]" : "[ Hide Guide ]");
    });
  }

  byId("testSearch")?.addEventListener("input", () => filterRows("testSearch", "testTableBody"));
  byId("sastSearch")?.addEventListener("input", () => filterRows("sastSearch", "larastanTableBody"));
  byId("zapSearch")?.addEventListener("input", () => filterRows("zapSearch", "zapTableBody"));
}

configureProceduralSpider();
configureInteractions();
poll();
setInterval(poll, 1500);
