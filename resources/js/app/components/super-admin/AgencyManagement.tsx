import { useState, useRef, useEffect, useCallback } from "react";
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Users,
  Upload,
  Globe,
  Mail,
  X,
  ArrowUpDown,
  Eye,
  Power,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  Image,
  ChevronDown,
  AlertTriangle,
  Save,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { AGENCIES } from "../../data/mock-data";

type AgencyStatus = "Active" | "Inactive";
type SortOption = "newest" | "most-research" | "name-asc";

interface AgencyAdmin {
  name: string;
  email: string;
}

interface ExtendedAgency {
  id: number;
  name: string;
  abbreviation: string;
  type: string;
  publications: number;
  description: string;
  latestYear: number;
  status: AgencyStatus;
  admin: AgencyAdmin;
  lastUpdated: string;
  joinDate: string;
  website: string;
  contactEmail: string;
  yearlyResearch: { year: string; count: number }[];
}

const ADMIN_NAMES: AgencyAdmin[] = [
  { name: "Juan Dela Cruz", email: "jdelacruz@dost11.gov.ph" },
  { name: "Maria Santos", email: "msantos@ched11.gov.ph" },
  { name: "Roberto Garcia", email: "rgarcia@neda11.gov.ph" },
  { name: "Elena Marquez", email: "emarquez@dti11.gov.ph" },
  { name: "Carlos Reyes", email: "creyes@dict11.gov.ph" },
  { name: "Ana Fernandez", email: "afernandez@rhrdc11.gov.ph" },
  { name: "Pedro Villanueva", email: "pvillanueva@drieerdc.gov.ph" },
  { name: "Sofia Aquino", email: "saquino@smaarrdec.gov.ph" },
  { name: "Miguel Torres", email: "mtorres@usep.edu.ph" },
];

const LAST_UPDATED = [
  "Mar 4, 2026", "Mar 3, 2026", "Feb 28, 2026", "Mar 1, 2026",
  "Feb 25, 2026", "Mar 2, 2026", "Jan 15, 2026", "Mar 5, 2026", "Feb 20, 2026",
];

const JOIN_DATES = [
  "Jan 2023", "Feb 2023", "Mar 2023", "Mar 2023",
  "Apr 2023", "May 2023", "Jun 2023", "Jul 2023", "Aug 2023",
];

const EXTENDED_AGENCIES: ExtendedAgency[] = AGENCIES.map((a, i) => ({
  ...a,
  status: (i === 6 ? "Inactive" : "Active") as AgencyStatus,
  admin: ADMIN_NAMES[i],
  lastUpdated: LAST_UPDATED[i],
  joinDate: JOIN_DATES[i],
  website: `https://www.${a.abbreviation.toLowerCase().replace(/\s/g, "")}.gov.ph`,
  contactEmail: ADMIN_NAMES[i].email,
  yearlyResearch: [
    { year: "2023", count: Math.floor(a.publications * 0.2) },
    { year: "2024", count: Math.floor(a.publications * 0.35) },
    { year: "2025", count: Math.floor(a.publications * 0.3) },
    { year: "2026", count: Math.floor(a.publications * 0.15) },
  ],
}));

const TOTAL_RESEARCH = EXTENDED_AGENCIES.reduce((s, a) => s + a.publications, 0);

/* ─── Toast ─── */
function Toast({ message, visible, onHide }: { message: string; visible: boolean; onHide: () => void }) {
  useEffect(() => { if (visible) { const t = setTimeout(onHide, 3500); return () => clearTimeout(t); } }, [visible, onHide]);
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[100]" style={{ animation: "am-slide-in 0.3s ease-out" }}>
      <div className="bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3.5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
        <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{message}</p>
        <button onClick={onHide} className="p-1 rounded hover:bg-gray-100 text-gray-400 ml-2 shrink-0"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: AgencyStatus }) {
  const isActive = status === "Active";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`} style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
      {status}
    </span>
  );
}

/* ─── Toggle Switch ─── */
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ backgroundColor: enabled ? "#16A34A" : "#D1D5DB" }}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" style={{ transform: enabled ? "translateX(22px)" : "translateX(2px)" }} />
    </button>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Create Agency Modal ─── */
/* ═══════════════════════════════════════════ */
function CreateAgencyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    name: "", shortName: "", description: "", website: "", contactEmail: "", assignedAdmin: "",
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>Create New Agency</h2>
            <p className="text-gray-500 text-xs mt-0.5">Add a new participating agency to the RIKMS platform.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Agency Logo</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#1E3A8A]/30 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><Image className="w-5 h-5 text-gray-400" /></div>
              <p className="text-sm text-gray-500"><span className="text-[#1E3A8A]" style={{ fontWeight: 600 }}>Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Agency Name <span className="text-red-500">*</span></label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Department of Science and Technology – Region XI"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Agency Short Name <span className="text-red-500">*</span></label>
            <input type="text" value={formData.shortName} onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              placeholder="e.g. DOST XI"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Agency Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
              placeholder="Brief description of the agency's role and research focus..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://..."
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="admin@agency.gov.ph"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Assign Agency Admin</label>
            <select value={formData.assignedAdmin} onChange={(e) => setFormData({ ...formData, assignedAdmin: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 bg-white">
              <option value="">Select an admin user...</option>
              {ADMIN_NAMES.map((a) => (<option key={`ca-${a.email}`} value={a.email}>{a.name} ({a.email})</option>))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { onCreated(); onClose(); }} className="px-5 py-2.5 text-sm text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Create Agency</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Edit Agency Panel ─── */
/* ═══════════════════════════════════════════ */
function EditAgencyPanel({ agency, onClose, onSaved }: { agency: ExtendedAgency | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState({
    name: "", shortName: "", description: "", website: "", contactEmail: "", isActive: true,
  });
  const [admins, setAdmins] = useState<AgencyAdmin[]>([]);

  useEffect(() => {
    if (agency) {
      setForm({
        name: agency.name,
        shortName: agency.abbreviation,
        description: agency.description,
        website: agency.website,
        contactEmail: agency.contactEmail,
        isActive: agency.status === "Active",
      });
      setAdmins([agency.admin]);
    }
  }, [agency]);

  if (!agency) return null;

  const handleSave = () => {
    onSaved(`Agency "${form.shortName}" has been updated successfully.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto relative z-10" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center"><Edit2 className="w-5 h-5 text-[#1E3A8A]" /></div>
            <div>
              <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>Edit Agency</h2>
              <p className="text-xs text-gray-500">{agency.abbreviation}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Section: Agency Information */}
          <div>
            <h3 className="text-sm text-[#0F172A] mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
              <Building2 className="w-4 h-4 text-[#1E3A8A]" /> Agency Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Agency Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Short Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Agency Branding */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm text-[#0F172A] mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
              <Image className="w-4 h-4 text-[#1E3A8A]" /> Agency Branding
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-[#1E3A8A]" />
              </div>
              <div>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-xs rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                  <Upload className="w-3.5 h-3.5" /> Upload Logo
                </button>
                <p className="text-[11px] text-gray-400 mt-1">PNG, SVG, or JPG. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Section: Agency Status */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm text-[#0F172A] mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
              <Power className="w-4 h-4 text-[#1E3A8A]" /> Agency Status
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{form.isActive ? "Active" : "Inactive"}</p>
                <p className="text-xs text-gray-400">{form.isActive ? "Agency can upload research and manage records." : "Agency is disabled. Administrators cannot upload new research."}</p>
              </div>
              <ToggleSwitch enabled={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} />
            </div>
          </div>

          {/* Section: Assigned Agency Admins */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-[#0F172A] flex items-center gap-2" style={{ fontWeight: 700 }}>
                <Users className="w-4 h-4 text-[#1E3A8A]" /> Assigned Agency Admins
              </h3>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1E3A8A]/5 text-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/10 transition-colors" style={{ fontWeight: 600 }}>
                <UserPlus className="w-3.5 h-3.5" /> Add Admin
              </button>
            </div>
            <div className="space-y-2">
              {admins.map((admin) => (
                <div key={`ea-admin-${admin.email}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#1E3A8A]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{admin.name}</p>
                      <p className="text-xs text-gray-400">{admin.email}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                    <UserMinus className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-white bg-[#1E3A8A] rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm" style={{ fontWeight: 600 }}>
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Deactivate Agency Dialog ─── */
/* ═══════════════════════════════════════════ */
function DeactivateDialog({ agency, open, onClose, onConfirm }: { agency: ExtendedAgency | null; open: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open || !agency) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <h2 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>Deactivate Agency</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            This will disable <span style={{ fontWeight: 600 }}>{agency.abbreviation}</span> and prevent its administrators from uploading new research.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Existing research records will remain accessible, but no new uploads or edits will be allowed until the agency is reactivated.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2.5 text-sm text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Deactivate Agency</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Delete Agency Dialog (with type-to-confirm) ─── */
/* ═══════════════════════════════════════════ */
function DeleteDialog({ agency, open, onClose, onConfirm }: { agency: ExtendedAgency | null; open: boolean; onClose: () => void; onConfirm: () => void }) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) setConfirmText("");
  }, [open]);

  if (!open || !agency) return null;

  const canDelete = confirmText === agency.abbreviation;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
          <h2 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>Delete Agency</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            This action will permanently remove <span style={{ fontWeight: 600 }}>{agency.abbreviation}</span> from the system.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 leading-relaxed">
              Associated research records may also be affected. This action cannot be undone.
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>
              Type "<span className="text-red-600">{agency.abbreviation}</span>" to confirm deletion.
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={agency.abbreviation}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!canDelete}
            className={`px-5 py-2.5 text-sm text-white rounded-xl shadow-sm transition-colors ${canDelete ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"}`}
            style={{ fontWeight: 600 }}
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Agency Detail Panel ─── */
/* ═══════════════════════════════════════════ */
function AgencyDetailPanel({ agency, onClose, onEdit, onDeactivate }: { agency: ExtendedAgency | null; onClose: () => void; onEdit: (a: ExtendedAgency) => void; onDeactivate: (a: ExtendedAgency) => void }) {
  if (!agency) return null;

  const maxYearlyCount = Math.max(...agency.yearlyResearch.map((y) => y.count));

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>Agency Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A]/10 flex items-center justify-center shrink-0"><Building2 className="w-7 h-7 text-[#1E3A8A]" /></div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>{agency.abbreviation}</h3>
              <p className="text-gray-500 text-sm mt-0.5">{agency.name}</p>
              <div className="mt-2"><StatusBadge status={agency.status} /></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600" style={{ lineHeight: 1.7 }}>{agency.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-[#1E3A8A]" /><span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Agency Admin</span></div>
              <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{agency.admin.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{agency.admin.email}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-[#7C3AED]" /><span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Research</span></div>
              <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{agency.publications} records</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-emerald-600" /><span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Website</span></div>
              <p className="text-xs text-[#1E3A8A] truncate" style={{ fontWeight: 500 }}>{agency.website}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-amber-600" /><span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Joined</span></div>
              <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{agency.joinDate}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-[#1E3A8A]" /><h4 className="text-sm text-[#0F172A]" style={{ fontWeight: 700 }}>Research by Year</h4></div>
            <div className="space-y-3">
              {agency.yearlyResearch.map((yr) => (
                <div key={`yr-${yr.year}`} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-10 shrink-0" style={{ fontWeight: 500 }}>{yr.year}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="h-full bg-[#1E3A8A]/80 rounded-full flex items-center justify-end pr-2 transition-all duration-500" style={{ width: `${Math.max((yr.count / maxYearlyCount) * 100, 12)}%` }}>
                      <span className="text-[10px] text-white" style={{ fontWeight: 600 }}>{yr.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-[#1E3A8A]" /><span className="text-xs text-[#1E3A8A]" style={{ fontWeight: 600 }}>Contact Email</span></div>
            <p className="text-sm text-gray-700">{agency.contactEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={() => { onClose(); onEdit(agency); }} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
            <Edit2 className="w-4 h-4" /> Edit Agency
          </button>
          <button onClick={() => { onClose(); onDeactivate(agency); }} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors" style={{ fontWeight: 500 }}>
            <Power className="w-4 h-4" /> {agency.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════ */
export function AgencyManagement() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AgencyStatus | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailAgency, setDetailAgency] = useState<ExtendedAgency | null>(null);
  const [editAgency, setEditAgency] = useState<ExtendedAgency | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ExtendedAgency | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExtendedAgency | null>(null);

  const [toast, setToast] = useState({ visible: false, message: "" });
  const showToast = useCallback((msg: string) => setToast({ visible: true, message: msg }), []);
  const hideToast = useCallback(() => setToast({ visible: false, message: "" }), []);

  const activeCount = EXTENDED_AGENCIES.filter((a) => a.status === "Active").length;
  const inactiveCount = EXTENDED_AGENCIES.filter((a) => a.status === "Inactive").length;

  const filtered = EXTENDED_AGENCIES.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.abbreviation.toLowerCase().includes(search.toLowerCase()) ||
      a.admin.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "most-research") return b.publications - a.publications;
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    return EXTENDED_AGENCIES.indexOf(b) - EXTENDED_AGENCIES.indexOf(a);
  });

  return (
    <div className="space-y-6 max-w-[1376px]">
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Agency Management</h1>
          <p className="text-[#6B7280] text-sm">Manage participating agencies contributing research to the RIKMS platform.</p>
        </div>
        <button onClick={() => setCreateModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm self-start" style={{ fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Create New Agency
        </button>
      </div>

      {/* ─── Section 1: Overview Metrics ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Agencies", value: EXTENDED_AGENCIES.length, sub: "Participating agencies", icon: Building2, color: "#1E3A8A", bg: "#DBEAFE" },
          { label: "Active Agencies", value: activeCount, sub: "Currently active", icon: CheckCircle2, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Inactive Agencies", value: inactiveCount, sub: "Currently inactive", icon: XCircle, color: "#6B7280", bg: "#F3F4F6" },
          { label: "Total Research Records", value: TOTAL_RESEARCH, sub: "Across all agencies", icon: Database, color: "#7C3AED", bg: "#EDE9FE" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={`stat-${s.label}`} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5" style={{ fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Section 2 & 3: Filters + Table ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search agencies..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AgencyStatus | "All")}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
              <option value="newest">Newest Agency</option>
              <option value="most-research">Most Research</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* ─── Desktop/Tablet Table ─── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Agency</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Short Name</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Agency Admin</th>
                <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Total Research</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Status</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Last Updated</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((agency) => (
                <tr key={`row-${agency.id}`} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center shrink-0"><Building2 className="w-4.5 h-4.5 text-[#1E3A8A]" /></div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate max-w-[260px]" style={{ fontWeight: 600 }}>{agency.name}</p>
                        <p className="text-xs text-gray-400">{agency.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded" style={{ fontWeight: 600 }}>{agency.abbreviation}</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div><p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{agency.admin.name}</p><p className="text-xs text-gray-400">{agency.admin.email}</p></div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-700 flex items-center justify-center gap-1.5"><FileText className="w-3.5 h-3.5 text-gray-400" />{agency.publications}</span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={agency.status} /></td>
                  <td className="px-6 py-4 hidden xl:table-cell"><span className="text-xs text-gray-400">{agency.lastUpdated}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center gap-1">
                      <button onClick={() => setDetailAgency(agency)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors opacity-0 group-hover:opacity-100" title="View Agency"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setEditAgency(agency)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors opacity-0 group-hover:opacity-100" title="Edit Agency"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setMenuOpen(menuOpen === agency.id ? null : agency.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      {menuOpen === agency.id && (
                        <div>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                            <button onClick={() => { setDetailAgency(agency); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> View Agency
                            </button>
                            <button onClick={() => { setEditAgency(agency); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Edit Agency
                            </button>
                            <button onClick={() => { setDeactivateTarget(agency); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                              <Power className="w-3.5 h-3.5 text-gray-400" /> {agency.status === "Active" ? "Deactivate" : "Activate"} Agency
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => { setDeleteTarget(agency); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                              <Trash2 className="w-3.5 h-3.5" /> Delete Agency
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile Card Layout ─── */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((agency) => (
            <div key={`mobile-${agency.id}`} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-[#1E3A8A]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 600 }}>{agency.abbreviation}</p>
                      <p className="text-xs text-gray-400 truncate">{agency.name}</p>
                    </div>
                    <StatusBadge status={agency.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-gray-400" />{agency.publications} research</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" />{agency.admin.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => setDetailAgency(agency)} className="flex-1 text-center text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 py-2 rounded-lg hover:bg-[#1E3A8A]/10 transition-colors" style={{ fontWeight: 600 }}>View Details</button>
                    <button onClick={() => setEditAgency(agency)} className="flex-1 text-center text-xs text-gray-600 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ fontWeight: 500 }}>Edit</button>
                    <button onClick={() => { setDeleteTarget(agency); }} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Pagination ─── */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {filtered.length} of {EXTENDED_AGENCIES.length} agencies</p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-xs" style={{ fontWeight: 600 }}>1</button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* ─── Modals & Panels ─── */}
      <CreateAgencyModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreated={() => showToast("Agency created successfully.")} />
      <AgencyDetailPanel agency={detailAgency} onClose={() => setDetailAgency(null)} onEdit={(a) => setEditAgency(a)} onDeactivate={(a) => setDeactivateTarget(a)} />
      <EditAgencyPanel agency={editAgency} onClose={() => setEditAgency(null)} onSaved={(msg) => showToast(msg)} />
      <DeactivateDialog agency={deactivateTarget} open={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} onConfirm={() => { showToast(`Agency "${deactivateTarget?.abbreviation}" has been deactivated.`); setDeactivateTarget(null); }} />
      <DeleteDialog agency={deleteTarget} open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { showToast(`Agency "${deleteTarget?.abbreviation}" has been deleted permanently.`); setDeleteTarget(null); }} />

      <style>{`
        @keyframes am-slide-in { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
