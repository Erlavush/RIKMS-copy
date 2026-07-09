import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ChevronRight,
  Globe,
  ShieldCheck,
  Lock,
  CalendarClock,
  ExternalLink,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Send,
  Check,
  AlertTriangle,
} from "lucide-react";
import { RESEARCH_DATA } from "../../data/mock-data";

type PolicyType =
  | "public"
  | "request-access"
  | "restricted"
  | "embargo"
  | "external-link";

interface PolicyOption {
  id: PolicyType;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const POLICY_OPTIONS: PolicyOption[] = [
  {
    id: "public",
    icon: Globe,
    title: "Public Download",
    description:
      "Anyone can download the research file without restrictions.",
    color: "#16A34A",
  },
  {
    id: "request-access",
    icon: ShieldCheck,
    title: "Request Access Approval",
    description:
      "Users must submit a request and receive approval before downloading.",
    color: "#D97706",
  },
  {
    id: "restricted",
    icon: Lock,
    title: "Restricted Access",
    description:
      "Only authorized Agency Administrators and System Administrators can download this file.",
    color: "#DC2626",
  },
  {
    id: "embargo",
    icon: CalendarClock,
    title: "Embargo Until Date",
    description:
      "The file will remain restricted until a specified release date.",
    color: "#7C3AED",
  },
  {
    id: "external-link",
    icon: ExternalLink,
    title: "External Link Only",
    description:
      "No file is hosted in RIKMS. Users are redirected to an external source.",
    color: "#0284C7",
  },
];

interface AuditEntry {
  id: number;
  userName: string;
  email: string;
  researchTitle: string;
  accessDate: string;
  action: "Download" | "Request Submitted" | "Request Approved" | "Request Denied";
}

const MOCK_AUDIT_LOG: AuditEntry[] = [
  { id: 1, userName: "Juan Dela Cruz", email: "juan@usep.edu.ph", researchTitle: "Impact of Climate Change on Coastal Communities", accessDate: "2025-03-01", action: "Download" },
  { id: 2, userName: "Maria Santos", email: "maria@ched.gov.ph", researchTitle: "Impact of Climate Change on Coastal Communities", accessDate: "2025-02-28", action: "Request Approved" },
  { id: 3, userName: "Carlos Tan", email: "carlos@neda.gov.ph", researchTitle: "Impact of Climate Change on Coastal Communities", accessDate: "2025-02-25", action: "Request Submitted" },
  { id: 4, userName: "Elena Torres", email: "elena@dost.gov.ph", researchTitle: "Impact of Climate Change on Coastal Communities", accessDate: "2025-02-20", action: "Download" },
  { id: 5, userName: "Pedro Villanueva", email: "pedro@smaarrdec.org", researchTitle: "Impact of Climate Change on Coastal Communities", accessDate: "2025-02-18", action: "Request Denied" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ActionBadge({ action }: { action: AuditEntry["action"] }) {
  const cfg: Record<string, string> = {
    Download: "bg-blue-50 text-blue-700 border-blue-200",
    "Request Submitted": "bg-amber-50 text-amber-700 border-amber-200",
    "Request Approved": "bg-green-50 text-green-700 border-green-200",
    "Request Denied": "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${cfg[action]}`} style={{ fontWeight: 500 }}>
      {action}
    </span>
  );
}

export function AccessControlManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const research = RESEARCH_DATA.find((r) => r.id === Number(id));

  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>("request-access");
  const [savedPolicy, setSavedPolicy] = useState<PolicyType>("request-access");

  // Request Access config
  const [reqFullName, setReqFullName] = useState(true);
  const [reqEmail, setReqEmail] = useState(true);
  const [reqOrganization, setReqOrganization] = useState(true);
  const [reqPurpose, setReqPurpose] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  // Embargo config
  const [embargoDate, setEmbargoDate] = useState("2026-06-30");

  // External link config
  const [externalUrl, setExternalUrl] = useState("https://repository.dost.gov.ph/research123");

  // UI state
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const hasChanges = selectedPolicy !== savedPolicy;

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSave = () => {
    if (hasChanges) {
      setConfirmOpen(true);
    } else {
      showToast("No changes to save.");
    }
  };

  const confirmSave = () => {
    setSavedPolicy(selectedPolicy);
    setConfirmOpen(false);
    showToast("Access policy updated successfully.");
  };

  const handleCancel = () => {
    setSelectedPolicy(savedPolicy);
  };

  // Summary helpers
  const currentPolicyOption = POLICY_OPTIONS.find((p) => p.id === selectedPolicy)!;

  const getSummaryDescription = (): string => {
    switch (selectedPolicy) {
      case "public":
        return "Open to all users.";
      case "request-access":
        return "Requester approval required.";
      case "restricted":
        return "Admins only.";
      case "embargo":
        return `Embargoed until ${formatDate(embargoDate)}.`;
      case "external-link":
        return "Redirects to external source.";
    }
  };

  const getDownloadStatus = (): string => {
    switch (selectedPolicy) {
      case "public":
        return "Available for download";
      case "request-access":
        return "Restricted until approval";
      case "restricted":
        return "Admin-only access";
      case "embargo":
        return "Embargoed";
      case "external-link":
        return "No file download";
    }
  };

  if (!research) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-gray-700 mb-2" style={{ fontSize: "1.1rem", fontWeight: 600 }}>Research Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">The research record you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/agency/research")} className="px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors" style={{ fontWeight: 500 }}>
          Back to Repository
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {savedToast && (
        <div className="fixed top-20 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-[fadeIn_0.2s_ease]" style={{ fontWeight: 500 }}>
          <CheckCircle2 className="w-4 h-4" />
          {savedToast}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setConfirmOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: "1rem", fontWeight: 600 }}>
                  Update Access Policy?
                </h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to update the access policy for this research document? This change will take effect immediately.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link to="/agency/dashboard" className="hover:text-[#1E3A8A] transition-colors">Agency</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/agency/research" className="hover:text-[#1E3A8A] transition-colors">Research Repository</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/agency/research/${id}/edit`} className="hover:text-[#1E3A8A] transition-colors">Research Details</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>Access Control</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Access Control Management
        </h1>
        <p className="text-[#6B7280] text-sm">
          Configure download permissions and access policies for this research document.
        </p>
        <div className="mt-2 px-3 py-2 bg-[#1E3A8A]/5 rounded-lg inline-block">
          <p className="text-sm text-[#1E3A8A] truncate max-w-xl" style={{ fontWeight: 500 }}>
            {research.title}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT — Access Policy Settings (70%) */}
        <div className="flex-1 lg:w-[70%] space-y-6">
          {/* Section 1 — Download Access Policy */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <h3 className="text-[#1E3A8A] mb-1 pb-2 border-b border-gray-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              Download Access Policy
            </h3>
            <p className="text-xs text-gray-400 mb-5">Select how users can access and download this research file.</p>

            {/* Policy Radio Cards */}
            <div className="space-y-3">
              {POLICY_OPTIONS.map((policy) => {
                const isSelected = selectedPolicy === policy.id;
                const Icon = policy.icon;
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => setSelectedPolicy(policy.id)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-[#1E3A8A] bg-[#1E3A8A]/[0.03] shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    {/* Radio indicator */}
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-[#1E3A8A]" : "border-gray-300"
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${policy.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: policy.color }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                        {policy.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{policy.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Policy Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <h3 className="text-[#1E3A8A] mb-4 pb-2 border-b border-gray-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              Policy Configuration
            </h3>

            {/* Public Download */}
            {selectedPolicy === "public" && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-green-800" style={{ fontWeight: 500 }}>Public Access Enabled</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    This research file will be publicly accessible to all users. No approval or authentication is required.
                  </p>
                </div>
              </div>
            )}

            {/* Request Access Approval */}
            {selectedPolicy === "request-access" && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-gray-700 mb-3" style={{ fontWeight: 500 }}>
                    Requester Information Required
                  </p>
                  <p className="text-xs text-gray-400 mb-3">Select which fields requesters must fill out when submitting an access request.</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Full Name", checked: reqFullName, onChange: setReqFullName },
                      { label: "Email Address", checked: reqEmail, onChange: setReqEmail },
                      { label: "Organization / Affiliation", checked: reqOrganization, onChange: setReqOrganization },
                      { label: "Purpose of Request", checked: reqPurpose, onChange: setReqPurpose },
                    ].map((field) => (
                      <label key={field.label} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={field.checked}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]/30 accent-[#1E3A8A]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Auto Approve Toggle */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Auto Approve Requests</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Automatically approve all incoming access requests without manual review.
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoApprove(!autoApprove)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        autoApprove ? "bg-[#1E3A8A]" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          autoApprove ? "translate-x-[22px]" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  {autoApprove && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        All access requests will be approved automatically. This may reduce security for sensitive documents.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Restricted Access */}
            {selectedPolicy === "restricted" && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <Lock className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-800" style={{ fontWeight: 500 }}>Restricted Access</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Only authorized Agency Administrators and System Administrators can download this file. No public access is available.
                  </p>
                </div>
              </div>
            )}

            {/* Embargo Until Date */}
            {selectedPolicy === "embargo" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Embargo End Date
                  </label>
                  <input
                    type="date"
                    value={embargoDate}
                    onChange={(e) => setEmbargoDate(e.target.value)}
                    className="w-full max-w-xs px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                  />
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <CalendarClock className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-purple-800" style={{ fontWeight: 500 }}>Embargo Active</p>
                    <p className="text-xs text-purple-600 mt-0.5">
                      The file will remain restricted until <strong>{formatDate(embargoDate)}</strong>. After this date, the file will become publicly accessible.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* External Link Only */}
            {selectedPolicy === "external-link" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                    External Research URL
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://repository.dost.gov.ph/research123"
                    className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                  />
                  <p className="text-xs text-gray-400 mt-1">Users will be redirected to this URL instead of downloading from RIKMS.</p>
                </div>
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#0284C7]/10 text-[#0284C7] rounded-lg hover:bg-[#0284C7]/20 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open External Source
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Access Audit Log */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setAuditLogOpen(!auditLogOpen)}
              className="w-full flex items-center justify-between px-5 lg:px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <span className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Access Activity Log</span>
              {auditLogOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {auditLogOpen && (
              <div className="border-t border-gray-100">
                {/* Mobile cards */}
                <div className="sm:hidden p-4 space-y-3">
                  {MOCK_AUDIT_LOG.map((entry) => (
                    <div key={entry.id} className="p-3 bg-[#F9FAFB] rounded-lg border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{entry.userName}</p>
                        <ActionBadge action={entry.action} />
                      </div>
                      <p className="text-xs text-gray-500">{entry.email}</p>
                      <p className="text-xs text-gray-400">{formatDate(entry.accessDate)}</p>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>User Name</th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Email</th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Research Title</th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Date</th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_AUDIT_LOG.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-5 py-3 text-gray-800" style={{ fontWeight: 500 }}>{entry.userName}</td>
                          <td className="px-4 py-3 text-gray-500">{entry.email}</td>
                          <td className="px-4 py-3 text-gray-500 truncate max-w-[200px] hidden lg:table-cell">{entry.researchTitle}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(entry.accessDate)}</td>
                          <td className="px-4 py-3"><ActionBadge action={entry.action} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg transition-colors ${
                  hasChanges
                    ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                style={{ fontWeight: 500 }}
              >
                <Save className="w-4 h-4" />
                Save Policy Changes
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
              {hasChanges && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Access Summary Panel (30%) */}
        <div className="lg:w-[30%] space-y-5">
          {/* Access Policy Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Access Policy</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Current policy */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${currentPolicyOption.color}15` }}
                >
                  <currentPolicyOption.icon className="w-5 h-5" style={{ color: currentPolicyOption.color }} />
                </div>
                <div>
                  <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{currentPolicyOption.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getSummaryDescription()}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Download Status</span>
                  <span className="text-xs text-gray-800" style={{ fontWeight: 500 }}>{getDownloadStatus()}</span>
                </div>
                {selectedPolicy === "embargo" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Embargo Until</span>
                    <span className="text-xs text-gray-800" style={{ fontWeight: 500 }}>{formatDate(embargoDate)}</span>
                  </div>
                )}
                {selectedPolicy === "request-access" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Auto Approve</span>
                    <span className={`text-xs ${autoApprove ? "text-green-600" : "text-gray-800"}`} style={{ fontWeight: 500 }}>
                      {autoApprove ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                )}
              </div>

              {hasChanges && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 pt-1">
                  <AlertTriangle className="w-3 h-3" />
                  Policy has unsaved changes.
                </div>
              )}
            </div>
          </div>

          {/* Access Request Statistics */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Access Request Statistics</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-600">Pending Requests</p>
                  <p className="text-lg text-amber-700" style={{ fontWeight: 700 }}>5</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-600">Approved Requests</p>
                  <p className="text-lg text-green-700" style={{ fontWeight: 700 }}>23</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <XCircle className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-red-500">Denied Requests</p>
                  <p className="text-lg text-red-600" style={{ fontWeight: 700 }}>3</p>
                </div>
              </div>

              <Link
                to="/agency/access-requests"
                className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/20 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <ShieldCheck className="w-4 h-4" />
                View Access Requests
              </Link>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Document Info</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>
                    {research.title.replace(/\s+/g, "_").substring(0, 35)}.pdf
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">2.4 MB • PDF</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Agency</span>
                  <span className="text-xs text-gray-800" style={{ fontWeight: 500 }}>{research.agencyAbbr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Published</span>
                  <span className="text-xs text-gray-800" style={{ fontWeight: 500 }}>{research.year}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Downloads</span>
                  <span className="text-xs text-gray-800" style={{ fontWeight: 500 }}>{research.downloads.toLocaleString()}</span>
                </div>
              </div>
              <Link
                to={`/agency/research/${id}/edit`}
                className="inline-flex items-center gap-1.5 text-sm text-[#1E3A8A] hover:underline mt-1"
                style={{ fontWeight: 500 }}
              >
                <FileText className="w-3.5 h-3.5" />
                Edit Metadata
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
