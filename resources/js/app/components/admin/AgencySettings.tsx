import { useState } from "react";
import {
  Shield,
  Bell,
  User,
  Key,
  Eye,
  EyeOff,
  Save,
  Mail,
  Lock,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

export function AgencySettings() {
  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "security">("account");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  // Account settings
  const [adminName, setAdminName] = useState("Admin User");
  const [adminEmail, setAdminEmail] = useState("admin@dost11.gov.ph");
  const [adminRole, setAdminRole] = useState("Agency Administrator");

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNewRequest: true,
    emailApproval: true,
    emailNewUpload: false,
    browserNotifications: true,
    weeklyDigest: true,
    monthlyReport: false,
  });

  // Security settings
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "account" as const, label: "Account", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Settings
        </h1>
        <p className="text-[#6B7280] text-sm">
          Manage your account preferences, notifications, and security settings.
        </p>
      </div>

      {/* Success Toast */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700" style={{ fontWeight: 500 }}>Settings saved successfully.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#1E3A8A]/10 text-[#1E3A8A]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                >
                  <tab.icon className="w-[18px] h-[18px]" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Account Settings */}
          {activeTab === "account" && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Account Information
                </h3>
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-[#1E3A8A] rounded-full flex items-center justify-center">
                    <span className="text-white text-lg" style={{ fontWeight: 600 }}>AD</span>
                  </div>
                  <div>
                    <p className="text-gray-800" style={{ fontWeight: 600 }}>{adminName}</p>
                    <p className="text-sm text-gray-500">{adminRole}</p>
                    <button className="text-xs text-[#1E3A8A] hover:underline mt-1">Change photo</button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                      Role
                    </label>
                    <input
                      type="text"
                      value={adminRole}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                      Agency
                    </label>
                    <input
                      type="text"
                      value="DOST XI"
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Change Password
                </h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 pr-10"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                Notification Preferences
              </h3>

              <div className="space-y-1">
                <h4 className="text-sm text-gray-800 mb-3" style={{ fontWeight: 600 }}>Email Notifications</h4>
                {[
                  { key: "emailNewRequest" as const, label: "New access requests", desc: "Receive an email when someone requests access to your research" },
                  { key: "emailApproval" as const, label: "Request approvals/denials", desc: "Get notified when access requests are processed" },
                  { key: "emailNewUpload" as const, label: "New research uploads", desc: "Receive notification when new research is uploaded by your team" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className="shrink-0"
                    >
                      {notifications[item.key] ? (
                        <ToggleRight className="w-9 h-9 text-[#1E3A8A]" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-gray-300" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm text-gray-800 mb-3" style={{ fontWeight: 600 }}>Other Notifications</h4>
                {[
                  { key: "browserNotifications" as const, label: "Browser notifications", desc: "Show desktop notifications for important updates" },
                  { key: "weeklyDigest" as const, label: "Weekly digest", desc: "Receive a weekly summary of activity" },
                  { key: "monthlyReport" as const, label: "Monthly analytics report", desc: "Receive a monthly report of research performance" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className="shrink-0"
                    >
                      {notifications[item.key] ? (
                        <ToggleRight className="w-9 h-9 text-[#1E3A8A]" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-gray-300" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Security Settings
                </h3>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>Two-Factor Authentication</p>
                    <p className="text-xs text-gray-400 mt-0.5">Add an extra layer of security to your account</p>
                  </div>
                  <button onClick={() => setTwoFactor(!twoFactor)} className="shrink-0">
                    {twoFactor ? (
                      <ToggleRight className="w-9 h-9 text-[#1E3A8A]" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-gray-300" />
                    )}
                  </button>
                </div>

                <div className="py-3">
                  <label className="block text-sm text-gray-800 mb-1.5" style={{ fontWeight: 500 }}>
                    Session Timeout
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Automatically log out after inactivity</p>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Active Sessions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>Current Session</p>
                      <p className="text-xs text-gray-500 mt-0.5">Chrome on Windows • Davao City, PH</p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs" style={{ fontWeight: 500 }}>
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700" style={{ fontWeight: 600 }}>Danger Zone</p>
                    <p className="text-xs text-red-600 mt-1">
                      Deactivating your account will remove all access. This action requires Super Admin approval.
                    </p>
                    <button className="mt-3 px-4 py-2 text-xs bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors" style={{ fontWeight: 500 }}>
                      Request Account Deactivation
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white rounded-lg text-sm hover:bg-[#1E3A8A]/90 transition-colors w-full sm:w-auto justify-center"
              style={{ fontWeight: 500 }}
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}