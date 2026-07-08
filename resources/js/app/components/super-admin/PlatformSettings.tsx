import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Globe,
  Shield,
  Bell,
  Mail,
  Database,
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Lock,
  Users,
  FileText,
  Palette,
  Server,
  HardDrive,
  Upload,
  Image,
  X,
  Info,
  Eye,
  EyeOff,
  ChevronRight,
  Wrench,
  BookOpen,
} from "lucide-react";

/* ─── Toggle Switch ─── */
function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label?: string }) {
  return (
    <button onClick={onChange} className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ backgroundColor: enabled ? "#1E3A8A" : "#D1D5DB" }} aria-label={label}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" style={{ transform: enabled ? "translateX(22px)" : "translateX(2px)" }} />
    </button>
  );
}

/* ─── Setting Row ─── */
function SettingRow({ icon: Icon, label, description, enabled, onChange }: { icon: any; label: string; description: string; enabled: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-5 h-5 text-gray-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} label={label} />
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ message, visible, onHide }: { message: string; visible: boolean; onHide: () => void }) {
  useEffect(() => { if (visible) { const t = setTimeout(onHide, 3500); return () => clearTimeout(t); } }, [visible, onHide]);
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[100]" style={{ animation: "ps-slide-in 0.3s ease-out" }}>
      <div className="bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3.5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
        <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{message}</p>
        <button onClick={onHide} className="p-1 rounded hover:bg-gray-100 text-gray-400 ml-2 shrink-0"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ icon: Icon, iconColor, iconBg, title, children }: { icon: any; iconColor: string; iconBg: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <h2 className="text-sm text-[#0F172A]" style={{ fontWeight: 700 }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════ */
export function PlatformSettings() {
  const [toast, setToast] = useState({ visible: false, message: "" });
  const showToast = useCallback((msg: string) => setToast({ visible: true, message: msg }), []);
  const hideToast = useCallback(() => setToast({ visible: false, message: "" }), []);

  const [settings, setSettings] = useState({
    // General
    systemName: "Regionwide Integrated Knowledge Management System",
    systemShortName: "RIKMS",
    defaultLanguage: "English",
    timezone: "Asia/Manila (UTC+8)",
    // Research Repository
    maxUploadSize: "50",
    allowedFileTypes: "PDF",
    defaultResearchStatus: "Draft",
    reqTitle: true,
    reqAuthors: true,
    reqAbstract: true,
    reqPubYear: true,
    // Access Control
    enableAccessRequest: true,
    defaultAccessPolicy: "Request Access",
    embargoOption: true,
    embargoDuration: "12",
    // Security
    mfaSuperAdmin: true,
    loginAlerts: true,
    lockoutThreshold: "5",
    sessionTimeout: "30",
    // Notifications
    systemNotifications: true,
    emailNotifications: true,
    securityAlerts: true,
    accessRequestAlerts: true,
    researchPublished: true,
    weeklyDigest: false,
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: "The system is temporarily unavailable for maintenance.",
    // Backup
    lastBackupDate: "Mar 10, 2026 – 03:00 AM",
    backupFrequency: "Daily",
  });

  const update = <K extends keyof typeof settings>(key: K, val: (typeof settings)[K]) =>
    setSettings((prev) => ({ ...prev, [key]: val }));
  const toggle = (key: keyof typeof settings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6 max-w-[1376px]">
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Platform Settings</h1>
          <p className="text-[#6B7280] text-sm">Configure system-wide settings for the RIKMS platform.</p>
        </div>
        <button
          onClick={() => showToast("All settings have been saved successfully.")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm self-start"
          style={{ fontWeight: 600 }}
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      {/* ─── Section 1: General Platform Settings ─── */}
      <SectionCard icon={Globe} iconColor="#1E3A8A" iconBg="#DBEAFE" title="General Platform Settings">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>System Name</label>
              <input type="text" value={settings.systemName} onChange={(e) => update("systemName", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>System Short Name</label>
              <input type="text" value={settings.systemShortName} onChange={(e) => update("systemShortName", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>System Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#1E3A8A] flex items-center justify-center shrink-0">
                <span className="text-white text-lg" style={{ fontWeight: 800 }}>R</span>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
              <span className="text-xs text-gray-400">PNG, SVG, or JPG. Max 2MB.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Default Language</label>
              <select value={settings.defaultLanguage} onChange={(e) => update("defaultLanguage", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                <option>English</option>
                <option>Filipino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Timezone</label>
              <input type="text" value={settings.timezone} readOnly
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 2: Research Repository Settings ─── */}
      <SectionCard icon={BookOpen} iconColor="#7C3AED" iconBg="#EDE9FE" title="Research Repository Settings">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Maximum Upload File Size</label>
              <div className="relative">
                <input type="text" value={settings.maxUploadSize} onChange={(e) => update("maxUploadSize", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 pr-12" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400" style={{ fontWeight: 500 }}>MB</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Allowed File Types</label>
              <select value={settings.allowedFileTypes} onChange={(e) => update("allowedFileTypes", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                <option>PDF</option>
                <option>PDF, DOCX</option>
                <option>PDF, DOCX, XLSX</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Default Research Status</label>
              <select value={settings.defaultResearchStatus} onChange={(e) => update("defaultResearchStatus", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                <option>Draft</option>
                <option>Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-2.5" style={{ fontWeight: 600 }}>Metadata Requirements</label>
            <p className="text-xs text-gray-400 mb-3">Toggle required fields for research record uploads.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: "reqTitle" as const, label: "Title" },
                { key: "reqAuthors" as const, label: "Authors" },
                { key: "reqAbstract" as const, label: "Abstract" },
                { key: "reqPubYear" as const, label: "Publication Year" },
              ].map((field) => (
                <div key={`meta-${field.key}`} className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 px-3.5 py-3">
                  <span className="text-xs text-gray-700" style={{ fontWeight: 500 }}>{field.label}</span>
                  <ToggleSwitch enabled={settings[field.key] as boolean} onChange={() => toggle(field.key)} label={field.label} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 3: Access Control Policies ─── */}
      <SectionCard icon={Lock} iconColor="#D97706" iconBg="#FEF3C7" title="Access Control Policies">
        <div className="space-y-4">
          <SettingRow icon={Users} label="Enable Access Request System" description="Allow users to request access to restricted research" enabled={settings.enableAccessRequest} onChange={() => toggle("enableAccessRequest")} />

          <div>
            <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Default Access Policy</label>
            <div className="grid grid-cols-3 gap-3">
              {["Public", "Request Access", "Restricted"].map((policy) => (
                <button
                  key={`policy-${policy}`}
                  onClick={() => update("defaultAccessPolicy", policy)}
                  className={`py-3 rounded-xl border text-sm transition-colors ${
                    settings.defaultAccessPolicy === policy
                      ? "bg-[#1E3A8A]/5 border-[#1E3A8A]/30 text-[#1E3A8A]"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{ fontWeight: settings.defaultAccessPolicy === policy ? 700 : 500 }}
                >
                  {policy}
                </button>
              ))}
            </div>
          </div>

          <SettingRow icon={Clock} label="Embargo Option" description="Allow time-limited embargo on newly published research" enabled={settings.embargoOption} onChange={() => toggle("embargoOption")} />

          {settings.embargoOption && (
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Embargo Duration</label>
              <div className="relative max-w-[200px]">
                <input type="text" value={settings.embargoDuration} onChange={(e) => update("embargoDuration", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 pr-16" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400" style={{ fontWeight: 500 }}>months</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ─── Section 4: Security Policies ─── */}
      <SectionCard icon={Shield} iconColor="#DC2626" iconBg="#FEE2E2" title="Security Policies">
        <div className="space-y-4">
          <SettingRow icon={Lock} label="Require MFA for Super Admin" description="Enforce multi-factor authentication for Super Admin accounts" enabled={settings.mfaSuperAdmin} onChange={() => toggle("mfaSuperAdmin")} />

          <SettingRow icon={Bell} label="Enable Login Alerts" description="Notify admins on new or suspicious login activity" enabled={settings.loginAlerts} onChange={() => toggle("loginAlerts")} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Account Lockout Threshold</label>
              <div className="relative">
                <input type="text" value={settings.lockoutThreshold} onChange={(e) => update("lockoutThreshold", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 pr-28" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400" style={{ fontWeight: 500 }}>failed attempts</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Session Timeout Duration</label>
              <div className="relative">
                <input type="text" value={settings.sessionTimeout} onChange={(e) => update("sessionTimeout", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 pr-20" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400" style={{ fontWeight: 500 }}>minutes</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 5: Notification Settings ─── */}
      <SectionCard icon={Bell} iconColor="#16A34A" iconBg="#DCFCE7" title="Notification Settings">
        <div className="space-y-3">
          <SettingRow icon={Bell} label="Enable System Notifications" description="Show in-app system notifications" enabled={settings.systemNotifications} onChange={() => toggle("systemNotifications")} />
          <SettingRow icon={Mail} label="Enable Email Notifications" description="Send email alerts for system events" enabled={settings.emailNotifications} onChange={() => toggle("emailNotifications")} />
          <SettingRow icon={Shield} label="Enable Security Alerts" description="Receive alerts for security incidents and suspicious activity" enabled={settings.securityAlerts} onChange={() => toggle("securityAlerts")} />

          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs text-gray-600 mb-3" style={{ fontWeight: 600 }}>Notification Events</p>
            <div className="space-y-2">
              {[
                { key: "accessRequestAlerts" as const, label: "Access request submitted", desc: "When a user submits an access request for research" },
                { key: "researchPublished" as const, label: "Research published", desc: "When a new research record is published" },
                { key: "weeklyDigest" as const, label: "Weekly activity digest", desc: "Receive a summary of platform activity each week" },
              ].map((item) => (
                <div key={`notif-${item.key}`} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <ToggleSwitch enabled={settings[item.key] as boolean} onChange={() => toggle(item.key)} label={item.label} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 6: System Maintenance Controls ─── */}
      <SectionCard icon={Wrench} iconColor="#D97706" iconBg="#FEF3C7" title="System Maintenance Controls">
        <div className="space-y-5">
          <div className={`p-5 rounded-xl border ${settings.maintenanceMode ? "bg-red-50 border-red-200" : "bg-amber-50/50 border-amber-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${settings.maintenanceMode ? "text-red-600" : "text-amber-600"}`} />
                <div>
                  <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>Maintenance Mode</p>
                  <p className="text-xs text-gray-500">When enabled, only Super Admins can access the platform</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.maintenanceMode} onChange={() => toggle("maintenanceMode")} label="Maintenance Mode" />
            </div>
            {settings.maintenanceMode && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200" style={{ fontWeight: 600 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Maintenance Active
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Maintenance Message</label>
            <textarea value={settings.maintenanceMessage} onChange={(e) => update("maintenanceMessage", e.target.value)} rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 resize-none" />
            <p className="text-[11px] text-gray-400 mt-1">This message will be displayed to users when maintenance mode is active.</p>
          </div>

          <div className="flex items-center gap-3">
            {!settings.maintenanceMode ? (
              <button onClick={() => { update("maintenanceMode", true); showToast("Maintenance mode has been enabled."); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors" style={{ fontWeight: 600 }}>
                <AlertTriangle className="w-4 h-4" /> Enable Maintenance Mode
              </button>
            ) : (
              <button onClick={() => { update("maintenanceMode", false); showToast("Maintenance mode has been disabled."); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors" style={{ fontWeight: 600 }}>
                <CheckCircle2 className="w-4 h-4" /> Disable Maintenance Mode
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 7: Backup and Data Recovery ─── */}
      <SectionCard icon={Database} iconColor="#1E3A8A" iconBg="#DBEAFE" title="Backup and Data Recovery">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>Last Backup</span>
              </div>
              <p className="text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>{settings.lastBackupDate}</p>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600" style={{ fontWeight: 500 }}>Completed successfully</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="w-5 h-5 text-[#1E3A8A]" />
                <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>Backup Frequency</span>
              </div>
              <select value={settings.backupFrequency} onChange={(e) => update("backupFrequency", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>

          <button onClick={() => showToast("System backup initiated. This may take a few minutes.")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm" style={{ fontWeight: 600 }}>
            <Database className="w-4 h-4" /> Run System Backup
          </button>
        </div>
      </SectionCard>

      {/* ─── Footer Save ─── */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
          Reset to Defaults
        </button>
        <button
          onClick={() => showToast("All settings have been saved successfully.")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm"
          style={{ fontWeight: 600 }}
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <style>{`
        @keyframes ps-slide-in { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
