import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Lock,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Eye,
  Clock,
  Globe,
  Fingerprint,
  Users,
  Download,
  Activity,
  Monitor,
  Smartphone,
  X,
  LogOut,
  ChevronRight,
  Laptop,
  MapPin,
} from "lucide-react";

/* ─── Types ─── */
type AlertSeverity = "High" | "Medium" | "Low";

interface SecurityAlert {
  id: number;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
}

interface LoginActivity {
  id: number;
  user: string;
  role: string;
  ip: string;
  location: string;
  device: string;
  loginTime: string;
  status: "Success" | "Failed";
}

interface ActiveSession {
  id: number;
  user: string;
  device: string;
  ip: string;
  lastActivity: string;
}

interface SecurityEvent {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  type: "login" | "password" | "permission" | "agency" | "alert";
}

/* ─── Mock Data ─── */
const INITIAL_ALERTS: SecurityAlert[] = [
  { id: 1, title: "Multiple failed login attempts detected", description: "5 failed login attempts from IP 203.177.45.112 targeting agency admin accounts in the last 30 minutes.", severity: "High", timestamp: "Mar 10, 2026 – 10:15 AM", acknowledged: false },
  { id: 2, title: "New admin login from unknown device", description: "Dr. Elena Marquez logged in from Safari / iOS — a device not previously associated with this account.", severity: "High", timestamp: "Mar 10, 2026 – 09:30 AM", acknowledged: false },
  { id: 3, title: "RBAC permissions changed", description: "Super Admin updated permissions for the Auditor role — 2 permissions added, 1 removed.", severity: "Medium", timestamp: "Mar 9, 2026 – 04:20 PM", acknowledged: false },
  { id: 4, title: "New admin account created", description: "A new Agency Administrator account was created for DOST XI by Super Admin.", severity: "Medium", timestamp: "Mar 9, 2026 – 02:00 PM", acknowledged: true },
  { id: 5, title: "SSL certificate renewal due in 15 days", description: "The platform SSL certificate will expire on March 25, 2026. Renewal is recommended.", severity: "Low", timestamp: "Mar 8, 2026 – 10:00 AM", acknowledged: true },
  { id: 6, title: "Session timeout policy updated", description: "Idle session timeout was updated from 30 to 15 minutes by Super Admin.", severity: "Low", timestamp: "Mar 7, 2026 – 11:00 AM", acknowledged: true },
];

const LOGIN_ACTIVITY: LoginActivity[] = [
  { id: 1, user: "Juan Dela Cruz", role: "Super Admin", ip: "192.168.1.45", location: "Davao City", device: "Chrome / Windows", loginTime: "Mar 10, 2026 – 10:32 AM", status: "Success" },
  { id: 2, user: "Maria Santos", role: "Super Admin", ip: "192.168.1.78", location: "Davao City", device: "Firefox / macOS", loginTime: "Mar 10, 2026 – 09:15 AM", status: "Success" },
  { id: 3, user: "Unknown", role: "—", ip: "203.177.45.112", location: "Unknown", device: "curl / CLI", loginTime: "Mar 10, 2026 – 10:12 AM", status: "Failed" },
  { id: 4, user: "Dr. Elena Marquez", role: "Agency Admin", ip: "192.168.3.67", location: "Tagum City", device: "Safari / iOS", loginTime: "Mar 10, 2026 – 09:30 AM", status: "Success" },
  { id: 5, user: "Unknown", role: "—", ip: "203.177.45.112", location: "Unknown", device: "curl / CLI", loginTime: "Mar 10, 2026 – 10:08 AM", status: "Failed" },
  { id: 6, user: "Prof. Roberto Garcia", role: "Agency Admin", ip: "10.0.1.89", location: "Davao City", device: "Chrome / Windows", loginTime: "Mar 10, 2026 – 08:45 AM", status: "Success" },
  { id: 7, user: "Dr. Antonio Mendoza", role: "Agency Admin", ip: "10.0.2.34", location: "Davao City", device: "Chrome / Android", loginTime: "Mar 10, 2026 – 08:00 AM", status: "Success" },
  { id: 8, user: "Unknown", role: "—", ip: "180.190.23.45", location: "Manila", device: "Python / Requests", loginTime: "Mar 9, 2026 – 11:45 PM", status: "Failed" },
  { id: 9, user: "Carlo Reyes", role: "System Moderator", ip: "192.168.4.22", location: "Davao City", device: "Firefox / Linux", loginTime: "Mar 9, 2026 – 03:20 PM", status: "Success" },
  { id: 10, user: "Leo Tanaka", role: "Data Manager", ip: "192.168.5.11", location: "Davao City", device: "Chrome / Windows", loginTime: "Mar 9, 2026 – 09:45 AM", status: "Success" },
];

const ACTIVE_SESSIONS: ActiveSession[] = [
  { id: 1, user: "Juan Dela Cruz", device: "Chrome / Windows", ip: "192.168.1.45", lastActivity: "Just now" },
  { id: 2, user: "Maria Santos", device: "Firefox / macOS", ip: "192.168.1.78", lastActivity: "2 minutes ago" },
  { id: 3, user: "Dr. Elena Marquez", device: "Safari / iOS", ip: "192.168.3.67", lastActivity: "8 minutes ago" },
  { id: 4, user: "Prof. Roberto Garcia", device: "Chrome / Windows", ip: "10.0.1.89", lastActivity: "15 minutes ago" },
  { id: 5, user: "Dr. Antonio Mendoza", device: "Chrome / Android", ip: "10.0.2.34", lastActivity: "22 minutes ago" },
];

const SECURITY_EVENTS: SecurityEvent[] = [
  { id: 1, user: "Juan Dela Cruz", action: "Admin login successful", timestamp: "Mar 10, 2026 – 10:32 AM", type: "login" },
  { id: 2, user: "System", action: "Failed login attempt blocked (IP 203.177.45.112)", timestamp: "Mar 10, 2026 – 10:15 AM", type: "alert" },
  { id: 3, user: "Dr. Elena Marquez", action: "Admin login from new device", timestamp: "Mar 10, 2026 – 09:30 AM", type: "login" },
  { id: 4, user: "Super Admin", action: "Password reset for user m.aquino@drieerdc.gov.ph", timestamp: "Mar 9, 2026 – 04:45 PM", type: "password" },
  { id: 5, user: "Super Admin", action: "RBAC permission updated for Auditor role", timestamp: "Mar 9, 2026 – 04:20 PM", type: "permission" },
  { id: 6, user: "Super Admin", action: "New Agency Administrator account created (DOST XI)", timestamp: "Mar 9, 2026 – 02:00 PM", type: "agency" },
  { id: 7, user: "Carlo Reyes", action: "Admin login successful", timestamp: "Mar 9, 2026 – 03:20 PM", type: "login" },
  { id: 8, user: "Super Admin", action: "Session timeout policy updated (30 → 15 min)", timestamp: "Mar 7, 2026 – 11:00 AM", type: "permission" },
];

/* ─── Toast ─── */
function Toast({ message, visible, onHide }: { message: string; visible: boolean; onHide: () => void }) {
  useEffect(() => { if (visible) { const t = setTimeout(onHide, 3500); return () => clearTimeout(t); } }, [visible, onHide]);
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[100]" style={{ animation: "sc-slide-in 0.3s ease-out" }}>
      <div className="bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3.5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
        <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{message}</p>
        <button onClick={onHide} className="p-1 rounded hover:bg-gray-100 text-gray-400 ml-2 shrink-0"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

/* ─── Severity Badge ─── */
function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const styles: Record<AlertSeverity, string> = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-blue-50 text-blue-600 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border ${styles[severity]}`} style={{ fontWeight: 700, letterSpacing: "0.04em" }}>
      <span className={`w-1.5 h-1.5 rounded-full ${severity === "High" ? "bg-red-500" : severity === "Medium" ? "bg-amber-500" : "bg-blue-500"}`} />
      {severity}
    </span>
  );
}

/* ─── Status Badge ─── */
function LoginStatusBadge({ status }: { status: "Success" | "Failed" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
      status === "Success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
    }`} style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Success" ? "bg-green-500" : "bg-red-500"}`} />
      {status}
    </span>
  );
}

/* ─── Event Icon ─── */
function EventDot({ type }: { type: SecurityEvent["type"] }) {
  const config = {
    login: { color: "border-green-400 bg-green-100" },
    password: { color: "border-blue-400 bg-blue-100" },
    permission: { color: "border-amber-400 bg-amber-100" },
    agency: { color: "border-purple-400 bg-purple-100" },
    alert: { color: "border-red-400 bg-red-100" },
  }[type];
  return <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${config.color}`} />;
}

/* ═══════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════ */
export function SecurityCenter() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const showToast = useCallback((msg: string) => setToast({ visible: true, message: msg }), []);
  const hideToast = useCallback(() => setToast({ visible: false, message: "" }), []);

  // Confirm dialog for terminate/force logout
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; session: ActiveSession | null; action: string }>({ open: false, session: null, action: "" });

  const acknowledgeAlert = (id: number) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
    showToast("Alert acknowledged.");
  };

  const mfaCount = 23;
  const totalAdmins = 27;
  const failedAttempts = LOGIN_ACTIVITY.filter((l) => l.status === "Failed").length;
  const lockedAccounts = 1;

  return (
    <div className="space-y-6 max-w-[1376px]">
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setConfirmDialog({ open: false, session: null, action: "" })} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] relative z-10" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <h2 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>{confirmDialog.action}</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to {confirmDialog.action.toLowerCase()} the session for <span style={{ fontWeight: 600 }}>{confirmDialog.session?.user}</span>?
                This will immediately end their active session.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setConfirmDialog({ open: false, session: null, action: "" })} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={() => { showToast(`Session for ${confirmDialog.session?.user} has been terminated.`); setConfirmDialog({ open: false, session: null, action: "" }); }} className="px-5 py-2.5 text-sm text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm" style={{ fontWeight: 600 }}>{confirmDialog.action}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Security Center</h1>
          <p className="text-[#6B7280] text-sm">Monitor system security events and administrative access across the RIKMS platform.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors self-start shadow-sm" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" /> Export Security Report
        </button>
      </div>

      {/* ─── Section 1: Security Overview Metrics ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "MFA Enabled Admins", value: `${mfaCount}/${totalAdmins}`, sub: `${Math.round((mfaCount / totalAdmins) * 100)}% coverage`, icon: Fingerprint, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Failed Login Attempts", value: failedAttempts.toString(), sub: "Last 24 hours", icon: XCircle, color: "#DC2626", bg: "#FEE2E2" },
          { label: "Locked Accounts", value: lockedAccounts.toString(), sub: "Requires review", icon: Lock, color: "#D97706", bg: "#FEF3C7" },
          { label: "Active Admin Sessions", value: ACTIVE_SESSIONS.length.toString(), sub: "Currently online", icon: Activity, color: "#1E3A8A", bg: "#DBEAFE" },
          { label: "Security Alerts", value: alerts.filter((a) => !a.acknowledged).length.toString(), sub: `${alerts.filter((a) => a.severity === "High" && !a.acknowledged).length} high priority`, icon: ShieldAlert, color: "#7C3AED", bg: "#EDE9FE" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={`sec-stat-${s.label}`} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
              <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Section 2: Security Alerts Panel ─── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center"><ShieldAlert className="w-4 h-4 text-red-500" /></div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Security Alerts</h2>
          </div>
          <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>
            {alerts.filter((a) => !a.acknowledged).length} Active
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {alerts.map((alert) => (
            <div key={`alert-${alert.id}`} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <SeverityBadge severity={alert.severity} />
                    {alert.acknowledged && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200" style={{ fontWeight: 600 }}>Acknowledged</span>
                    )}
                  </div>
                  <h3 className="text-sm text-gray-800 mb-0.5" style={{ fontWeight: 600 }}>{alert.title}</h3>
                  <p className="text-xs text-gray-400 mb-1.5 leading-relaxed">{alert.description}</p>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.timestamp}</span>
                </div>
                {!alert.acknowledged && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 3: Login Activity Monitoring ─── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center"><Activity className="w-4 h-4 text-[#1E3A8A]" /></div>
          <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Login Activity Monitoring</h2>
        </div>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>User</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Role</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>IP Address</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Location</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Device / Browser</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Login Time</th>
                <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {LOGIN_ACTIVITY.map((entry) => (
                <tr key={`login-${entry.id}`} className={`hover:bg-gray-50/60 transition-colors ${entry.status === "Failed" ? "bg-red-50/20" : ""}`}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${entry.status === "Failed" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`} style={{ fontWeight: 700 }}>
                        {entry.user === "Unknown" ? "?" : entry.user.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{entry.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5"><span className="text-xs text-gray-600">{entry.role}</span></td>
                  <td className="px-6 py-3.5 hidden xl:table-cell"><code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{entry.ip}</code></td>
                  <td className="px-6 py-3.5 hidden xl:table-cell"><span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{entry.location}</span></td>
                  <td className="px-6 py-3.5 hidden lg:table-cell"><span className="text-xs text-gray-500 flex items-center gap-1"><Monitor className="w-3 h-3 text-gray-400" />{entry.device}</span></td>
                  <td className="px-6 py-3.5"><span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{entry.loginTime}</span></td>
                  <td className="px-6 py-3.5 text-center"><LoginStatusBadge status={entry.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {LOGIN_ACTIVITY.map((entry) => (
            <div key={`mob-login-${entry.id}`} className={`p-4 ${entry.status === "Failed" ? "bg-red-50/30" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs shrink-0 ${entry.status === "Failed" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`} style={{ fontWeight: 700 }}>
                  {entry.user === "Unknown" ? "?" : entry.user.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{entry.user}</span>
                    <LoginStatusBadge status={entry.status} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 mt-1">
                    <span>{entry.role}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{entry.ip}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.loginTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 4: Active Admin Sessions ─── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center"><Monitor className="w-4 h-4 text-green-600" /></div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Active Admin Sessions</h2>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>
            {ACTIVE_SESSIONS.length} Online
          </span>
        </div>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>User</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Device</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>IP Address</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Last Activity</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ACTIVE_SESSIONS.map((session) => (
                <tr key={`sess-${session.id}`} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-[#1E3A8A]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{session.user}</span>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-gray-600 flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5 text-gray-400" />{session.device}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{session.ip}</code>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{session.lastActivity}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setConfirmDialog({ open: true, session, action: "Terminate Session" })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Terminate
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ open: true, session, action: "Force Logout" })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <LogOut className="w-3.5 h-3.5" /> Force Logout
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {ACTIVE_SESSIONS.map((session) => (
            <div key={`mob-sess-${session.id}`} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{session.user}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1"><Laptop className="w-3 h-3" />{session.device}</span>
                    <span>{session.ip}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.lastActivity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setConfirmDialog({ open: true, session, action: "Terminate Session" })} className="text-xs text-red-600 hover:underline" style={{ fontWeight: 500 }}>Terminate</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => setConfirmDialog({ open: true, session, action: "Force Logout" })} className="text-xs text-gray-600 hover:underline" style={{ fontWeight: 500 }}>Force Logout</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 5: Security Event Timeline ─── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"><Clock className="w-4 h-4 text-gray-600" /></div>
          <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Security Event Timeline</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {SECURITY_EVENTS.map((event, idx) => (
            <div key={`evt-${event.id}`} className="px-6 py-3.5 flex items-start gap-4 hover:bg-gray-50/40 transition-colors">
              <div className="flex flex-col items-center shrink-0 relative pt-1" style={{ width: 20 }}>
                <EventDot type={event.type} />
                {idx < SECURITY_EVENTS.length - 1 && (
                  <div className="w-px h-full bg-gray-200 absolute top-4" style={{ minHeight: 24 }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{event.action}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-gray-500" style={{ fontWeight: 500 }}>{event.user}</span>
                  <span className="text-[11px] text-gray-400">{event.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes sc-slide-in { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
