import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import {
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  X,
  Building2,
  Clock,
  AlertTriangle,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Save,
  ToggleLeft,
  ToggleRight,
  Zap,
  History,
  GitCompareArrows,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

/* ─── Types ─── */
type TabKey = "roles" | "permissions" | "assignments";

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
  assignedRoles: string[];
}

interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissionsCount: number;
  isSystem: boolean;
  createdDate: string;
  color: string;
  bg: string;
  permissionMatrix: { module: string; actions: { name: string; allowed: boolean }[] }[];
}

interface UserAssignment {
  id: number;
  name: string;
  email: string;
  role: string;
  agency: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

interface ChangeHistoryEntry {
  id: number;
  roleName: string;
  changedBy: string;
  changeType: string;
  date: string;
  added: string[];
  removed: string[];
}

/* ─── Mock Data ─── */
const PERMISSION_CATEGORIES = [
  "Agency Management",
  "User Management",
  "Research Repository",
  "Moderation",
  "Analytics",
  "Security",
  "System Settings",
];

const ALL_PERMISSIONS: Permission[] = [
  { id: "agency.create", name: "agency.create", category: "Agency Management", description: "Create new agency records", assignedRoles: ["Super Admin"] },
  { id: "agency.update", name: "agency.update", category: "Agency Management", description: "Update agency information and settings", assignedRoles: ["Super Admin", "Agency Administrator"] },
  { id: "agency.view", name: "agency.view", category: "Agency Management", description: "View agency details and profiles", assignedRoles: ["Super Admin", "Agency Administrator", "System Moderator", "Data Manager", "Auditor"] },
  { id: "agency.delete", name: "agency.delete", category: "Agency Management", description: "Delete or deactivate agency records", assignedRoles: ["Super Admin"] },
  { id: "user.create", name: "user.create", category: "User Management", description: "Create new user accounts", assignedRoles: ["Super Admin", "Agency Administrator"] },
  { id: "user.update", name: "user.update", category: "User Management", description: "Update user profiles and settings", assignedRoles: ["Super Admin", "Agency Administrator"] },
  { id: "user.view", name: "user.view", category: "User Management", description: "View user information and activity", assignedRoles: ["Super Admin", "Agency Administrator", "Auditor"] },
  { id: "user.delete", name: "user.delete", category: "User Management", description: "Remove or deactivate user accounts", assignedRoles: ["Super Admin"] },
  { id: "user.assign_role", name: "user.assign_role", category: "User Management", description: "Assign or change user roles", assignedRoles: ["Super Admin"] },
  { id: "research.view", name: "research.view", category: "Research Repository", description: "View research records and metadata", assignedRoles: ["Super Admin", "Agency Administrator", "System Moderator", "Data Manager", "Auditor"] },
  { id: "research.upload", name: "research.upload", category: "Research Repository", description: "Upload new research records", assignedRoles: ["Super Admin", "Agency Administrator", "Data Manager"] },
  { id: "research.edit", name: "research.edit", category: "Research Repository", description: "Edit research metadata and content", assignedRoles: ["Super Admin", "Agency Administrator", "Data Manager"] },
  { id: "research.archive", name: "research.archive", category: "Research Repository", description: "Archive or restore research records", assignedRoles: ["Super Admin", "Agency Administrator"] },
  { id: "research.publish", name: "research.publish", category: "Research Repository", description: "Publish or unpublish research records", assignedRoles: ["Super Admin", "Agency Administrator", "System Moderator"] },
  { id: "research.delete", name: "research.delete", category: "Research Repository", description: "Permanently delete research records", assignedRoles: ["Super Admin"] },
  { id: "moderation.review", name: "moderation.review", category: "Moderation", description: "Review flagged or pending research", assignedRoles: ["Super Admin", "System Moderator"] },
  { id: "moderation.approve", name: "moderation.approve", category: "Moderation", description: "Approve or reject research submissions", assignedRoles: ["Super Admin", "System Moderator"] },
  { id: "moderation.flag", name: "moderation.flag", category: "Moderation", description: "Flag research for review", assignedRoles: ["Super Admin", "System Moderator", "Agency Administrator"] },
  { id: "analytics.view", name: "analytics.view", category: "Analytics", description: "View system analytics and reports", assignedRoles: ["Super Admin", "Auditor"] },
  { id: "analytics.export", name: "analytics.export", category: "Analytics", description: "Export analytics reports", assignedRoles: ["Super Admin", "Auditor"] },
  { id: "security.view", name: "security.view", category: "Security", description: "View security logs and settings", assignedRoles: ["Super Admin", "Auditor"] },
  { id: "security.configure", name: "security.configure", category: "Security", description: "Configure security policies", assignedRoles: ["Super Admin"] },
  { id: "system.settings.view", name: "system.settings.view", category: "System Settings", description: "View platform configuration", assignedRoles: ["Super Admin"] },
  { id: "system.settings.update", name: "system.settings.update", category: "System Settings", description: "Modify platform settings", assignedRoles: ["Super Admin"] },
];

const INITIAL_ROLES: Role[] = [
  {
    id: 1, name: "Super Admin", description: "Full system access with all administrative privileges across the entire RIKMS platform.", userCount: 3, permissionsCount: 24, isSystem: true, createdDate: "Jan 15, 2024", color: "#DC2626", bg: "#FEE2E2",
    permissionMatrix: [
      { module: "Agency Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: true }, { name: "Edit", allowed: true }, { name: "Delete", allowed: true }] },
      { module: "User Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: true }, { name: "Edit", allowed: true }, { name: "Delete", allowed: true }, { name: "Assign Role", allowed: true }] },
      { module: "Research Repository", actions: [{ name: "View", allowed: true }, { name: "Upload", allowed: true }, { name: "Edit", allowed: true }, { name: "Archive", allowed: true }, { name: "Publish", allowed: true }, { name: "Delete", allowed: true }] },
      { module: "Moderation", actions: [{ name: "Review", allowed: true }, { name: "Approve", allowed: true }, { name: "Flag", allowed: true }] },
      { module: "Analytics", actions: [{ name: "View", allowed: true }, { name: "Export", allowed: true }] },
      { module: "Security", actions: [{ name: "View", allowed: true }, { name: "Configure", allowed: true }] },
      { module: "System Settings", actions: [{ name: "View", allowed: true }, { name: "Update", allowed: true }] },
    ],
  },
  {
    id: 2, name: "System Moderator", description: "Reviews and moderates research submissions across all agencies. Can approve, reject, or flag content.", userCount: 5, permissionsCount: 8, isSystem: true, createdDate: "Jan 15, 2024", color: "#D97706", bg: "#FEF3C7",
    permissionMatrix: [
      { module: "Agency Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: false }, { name: "Edit", allowed: false }, { name: "Delete", allowed: false }] },
      { module: "User Management", actions: [{ name: "View", allowed: false }, { name: "Create", allowed: false }, { name: "Edit", allowed: false }, { name: "Delete", allowed: false }, { name: "Assign Role", allowed: false }] },
      { module: "Research Repository", actions: [{ name: "View", allowed: true }, { name: "Upload", allowed: false }, { name: "Edit", allowed: false }, { name: "Archive", allowed: false }, { name: "Publish", allowed: true }, { name: "Delete", allowed: false }] },
      { module: "Moderation", actions: [{ name: "Review", allowed: true }, { name: "Approve", allowed: true }, { name: "Flag", allowed: true }] },
      { module: "Analytics", actions: [{ name: "View", allowed: false }, { name: "Export", allowed: false }] },
      { module: "Security", actions: [{ name: "View", allowed: false }, { name: "Configure", allowed: false }] },
      { module: "System Settings", actions: [{ name: "View", allowed: false }, { name: "Update", allowed: false }] },
    ],
  },
  {
    id: 3, name: "Data Manager", description: "Manages research data entry, uploads, and metadata editing within assigned agency.", userCount: 12, permissionsCount: 6, isSystem: false, createdDate: "Mar 22, 2024", color: "#16A34A", bg: "#DCFCE7",
    permissionMatrix: [
      { module: "Agency Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: false }, { name: "Edit", allowed: false }, { name: "Delete", allowed: false }] },
      { module: "User Management", actions: [{ name: "View", allowed: false }, { name: "Create", allowed: false }, { name: "Edit", allowed: false }, { name: "Delete", allowed: false }, { name: "Assign Role", allowed: false }] },
      { module: "Research Repository", actions: [{ name: "View", allowed: true }, { name: "Upload", allowed: true }, { name: "Edit", allowed: true }, { name: "Archive", allowed: false }, { name: "Publish", allowed: false }, { name: "Delete", allowed: false }] },
      { module: "Moderation", actions: [{ name: "Review", allowed: false }, { name: "Approve", allowed: false }, { name: "Flag", allowed: false }] },
      { module: "Analytics", actions: [{ name: "View", allowed: false }, { name: "Export", allowed: false }] },
      { module: "Security", actions: [{ name: "View", allowed: false }, { name: "Configure", allowed: false }] },
      { module: "System Settings", actions: [{ name: "View", allowed: false }, { name: "Update", allowed: false }] },
    ],
  },
  {
    id: 4, name: "Auditor", description: "Read-only access to analytics, security logs, and user activity for audit and compliance purposes.", userCount: 4, permissionsCount: 5, isSystem: false, createdDate: "Jun 10, 2024", color: "#7C3AED", bg: "#EDE9FE",
    permissionMatrix: [
      { module: "Agency Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: false }, { name: "Edit", allowed: false }, { name: "Delete", allowed: false }] },
      { module: "User Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: false }, { name: "Edit", allowed: false }, { name: "Delete", allowed: false }, { name: "Assign Role", allowed: false }] },
      { module: "Research Repository", actions: [{ name: "View", allowed: true }, { name: "Upload", allowed: false }, { name: "Edit", allowed: false }, { name: "Archive", allowed: false }, { name: "Publish", allowed: false }, { name: "Delete", allowed: false }] },
      { module: "Moderation", actions: [{ name: "Review", allowed: false }, { name: "Approve", allowed: false }, { name: "Flag", allowed: false }] },
      { module: "Analytics", actions: [{ name: "View", allowed: true }, { name: "Export", allowed: true }] },
      { module: "Security", actions: [{ name: "View", allowed: true }, { name: "Configure", allowed: false }] },
      { module: "System Settings", actions: [{ name: "View", allowed: false }, { name: "Update", allowed: false }] },
    ],
  },
  {
    id: 5, name: "Agency Administrator", description: "Full management access within their assigned agency, including research and user management.", userCount: 18, permissionsCount: 14, isSystem: true, createdDate: "Jan 15, 2024", color: "#1E3A8A", bg: "#DBEAFE",
    permissionMatrix: [
      { module: "Agency Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: false }, { name: "Edit", allowed: true }, { name: "Delete", allowed: false }] },
      { module: "User Management", actions: [{ name: "View", allowed: true }, { name: "Create", allowed: true }, { name: "Edit", allowed: true }, { name: "Delete", allowed: false }, { name: "Assign Role", allowed: false }] },
      { module: "Research Repository", actions: [{ name: "View", allowed: true }, { name: "Upload", allowed: true }, { name: "Edit", allowed: true }, { name: "Archive", allowed: true }, { name: "Publish", allowed: true }, { name: "Delete", allowed: false }] },
      { module: "Moderation", actions: [{ name: "Review", allowed: false }, { name: "Approve", allowed: false }, { name: "Flag", allowed: true }] },
      { module: "Analytics", actions: [{ name: "View", allowed: false }, { name: "Export", allowed: false }] },
      { module: "Security", actions: [{ name: "View", allowed: false }, { name: "Configure", allowed: false }] },
      { module: "System Settings", actions: [{ name: "View", allowed: false }, { name: "Update", allowed: false }] },
    ],
  },
];

const USER_ASSIGNMENTS: UserAssignment[] = [
  { id: 1, name: "Juan Dela Cruz", email: "juan.delacruz@admin.rikms.gov.ph", role: "Super Admin", agency: "System", status: "Active", lastLogin: "Mar 5, 2026 – 10:32 AM" },
  { id: 2, name: "Maria Santos", email: "m.santos@admin.rikms.gov.ph", role: "Super Admin", agency: "System", status: "Active", lastLogin: "Mar 5, 2026 – 09:15 AM" },
  { id: 3, name: "Dr. Elena Marquez", email: "e.marquez@ched.gov.ph", role: "Agency Administrator", agency: "CHED XI", status: "Active", lastLogin: "Mar 5, 2026 – 08:47 AM" },
  { id: 4, name: "Dr. Teresa Mendez", email: "t.mendez@neda.gov.ph", role: "Agency Administrator", agency: "NEDA XI", status: "Active", lastLogin: "Mar 4, 2026 – 04:30 PM" },
  { id: 5, name: "Dr. Antonio Mendoza", email: "a.mendoza@dti.gov.ph", role: "Agency Administrator", agency: "DTI XI", status: "Active", lastLogin: "Mar 4, 2026 – 11:15 AM" },
  { id: 6, name: "Prof. Roberto Garcia", email: "r.garcia@usep.edu.ph", role: "Agency Administrator", agency: "USEP", status: "Active", lastLogin: "Mar 4, 2026 – 12:30 PM" },
  { id: 7, name: "Dr. Isabella Cruz", email: "i.cruz@rhrdc.gov.ph", role: "Agency Administrator", agency: "RHRDC XI", status: "Active", lastLogin: "Mar 4, 2026 – 01:40 PM" },
  { id: 8, name: "Carlo Reyes", email: "c.reyes@dost.gov.ph", role: "System Moderator", agency: "DOST XI", status: "Active", lastLogin: "Mar 3, 2026 – 03:20 PM" },
  { id: 9, name: "Ana Villanueva", email: "a.villanueva@rikms.gov.ph", role: "System Moderator", agency: "System", status: "Active", lastLogin: "Mar 2, 2026 – 11:00 AM" },
  { id: 10, name: "Leo Tanaka", email: "l.tanaka@dict.gov.ph", role: "Data Manager", agency: "DICT XI", status: "Active", lastLogin: "Mar 3, 2026 – 09:45 AM" },
  { id: 11, name: "Grace Lim", email: "g.lim@smaarrdec.gov.ph", role: "Data Manager", agency: "SMAARRDEC", status: "Active", lastLogin: "Mar 1, 2026 – 02:15 PM" },
  { id: 12, name: "Mark Aquino", email: "m.aquino@drieerdc.gov.ph", role: "Data Manager", agency: "DRIEERDC", status: "Inactive", lastLogin: "Feb 15, 2026 – 10:00 AM" },
  { id: 13, name: "Dr. Pedro Fernandez", email: "p.fernandez@rikms.gov.ph", role: "Auditor", agency: "System", status: "Active", lastLogin: "Mar 4, 2026 – 09:00 AM" },
  { id: 14, name: "Sofia Magsaysay", email: "s.magsaysay@dost.gov.ph", role: "Agency Administrator", agency: "DOST XI", status: "Active", lastLogin: "Mar 5, 2026 – 10:24 AM" },
  { id: 15, name: "Ramon Torres", email: "r.torres@rikms.gov.ph", role: "Auditor", agency: "System", status: "Inactive", lastLogin: "Jan 28, 2026 – 04:00 PM" },
];

const CHANGE_HISTORY: ChangeHistoryEntry[] = [
  { id: 1, roleName: "Auditor", changedBy: "Super Admin", changeType: "Permission Updated", date: "Mar 8, 2026", added: ["analytics.view", "analytics.export"], removed: ["research.archive"] },
  { id: 2, roleName: "Data Manager", changedBy: "Super Admin", changeType: "Permission Updated", date: "Mar 5, 2026", added: ["research.upload"], removed: [] },
  { id: 3, roleName: "System Moderator", changedBy: "Juan Dela Cruz", changeType: "Permission Updated", date: "Feb 28, 2026", added: ["moderation.flag"], removed: ["research.edit"] },
  { id: 4, roleName: "Agency Administrator", changedBy: "Super Admin", changeType: "Role Modified", date: "Feb 20, 2026", added: ["research.publish", "research.archive"], removed: [] },
  { id: 5, roleName: "Auditor", changedBy: "Maria Santos", changeType: "Permission Updated", date: "Feb 15, 2026", added: ["security.view"], removed: ["user.delete"] },
  { id: 6, roleName: "Data Manager", changedBy: "Super Admin", changeType: "Role Created", date: "Mar 22, 2024", added: ["agency.view", "research.view", "research.upload", "research.edit"], removed: [] },
];

const ROLE_NAMES = [...new Set(INITIAL_ROLES.map((r) => r.name))];
const AGENCY_NAMES = [...new Set(USER_ASSIGNMENTS.map((u) => u.agency))];

/* ── Helpers ── */
type MatrixState = Record<string, boolean>;

function buildMatrixState(perms: Permission[], roles: Role[]): MatrixState {
  const state: MatrixState = {};
  perms.forEach((p) => {
    roles.forEach((r) => {
      state[`${p.id}__${r.id}`] = p.assignedRoles.includes(r.name);
    });
  });
  return state;
}

/* ─── Toast Notification ─── */
function Toast({ message, visible, onHide }: { message: string; visible: boolean; onHide: () => void }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onHide, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[100] animate-rbac-slide-in">
      <div className="bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3.5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{message}</p>
        <button onClick={onHide} className="p-1 rounded hover:bg-gray-100 text-gray-400 ml-2 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Confirmation Dialog ─── */
function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel, danger, children,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel: string; danger?: boolean; children?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] relative z-10 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-red-50" : "bg-[#1E3A8A]/10"}`}>
            {danger ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Info className="w-5 h-5 text-[#1E3A8A]" />}
          </div>
          <h2 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          {children}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-5 py-2.5 text-sm text-white rounded-xl transition-colors shadow-sm ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"}`} style={{ fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Diff Modal (for change history) ─── */
function DiffModal({ open, onClose, entry }: { open: boolean; onClose: () => void; entry: ChangeHistoryEntry | null }) {
  if (!open || !entry) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] relative z-10 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
              <GitCompareArrows className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <div>
              <h2 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>Permission Changes</h2>
              <p className="text-[11px] text-gray-400">{entry.roleName} · {entry.date}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 500 }}>Changed by: <span className="text-gray-700" style={{ fontWeight: 600 }}>{entry.changedBy}</span></div>

          {/* Side-by-side diff table */}
          {(entry.added.length > 0 || entry.removed.length > 0) && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100/80">
                    <th className="text-left px-4 py-2.5 text-[11px] text-gray-500" style={{ fontWeight: 600 }}>Permission</th>
                    <th className="text-center px-4 py-2.5 text-[11px] text-gray-500" style={{ fontWeight: 600 }}>Current</th>
                    <th className="text-center px-4 py-2.5 text-[11px] text-gray-500" style={{ fontWeight: 600 }}>New</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entry.added.map((p) => (
                    <tr key={`diff-add-${p}`} className="bg-green-50/40">
                      <td className="px-4 py-2.5"><code className="text-[11px] text-gray-600">{p}</code></td>
                      <td className="text-center px-4 py-2.5"><XCircle className="w-4 h-4 text-gray-300 mx-auto" /></td>
                      <td className="text-center px-4 py-2.5"><CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                  ))}
                  {entry.removed.map((p) => (
                    <tr key={`diff-rem-${p}`} className="bg-red-50/40">
                      <td className="px-4 py-2.5"><code className="text-[11px] text-gray-600">{p}</code></td>
                      <td className="text-center px-4 py-2.5"><CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center px-4 py-2.5"><XCircle className="w-4 h-4 text-red-400 mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {entry.added.length > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200" style={{ fontWeight: 600 }}>
                +{entry.added.length} added
              </span>
            )}
            {entry.removed.length > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200" style={{ fontWeight: 600 }}>
                −{entry.removed.length} removed
              </span>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-full" style={{ fontWeight: 500 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Role Modal ─── */
function CreateRoleModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  if (!open) return null;
  const togglePerm = (id: string) => { const n = new Set(selectedPerms); n.has(id) ? n.delete(id) : n.add(id); setSelectedPerms(n); };
  const toggleCategory = (cat: string) => { const cp = ALL_PERMISSIONS.filter((p) => p.category === cat); const all = cp.every((p) => selectedPerms.has(p.id)); const n = new Set(selectedPerms); cp.forEach((p) => (all ? n.delete(p.id) : n.add(p.id))); setSelectedPerms(n); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center"><Shield className="w-4 h-4 text-[#1E3A8A]" /></div>
            <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>Create New Role</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-xs text-gray-600 block mb-1.5" style={{ fontWeight: 600 }}>Role Name</label>
            <input type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Content Reviewer" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1.5" style={{ fontWeight: 600 }}>Role Description</label>
            <textarea value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Describe the role's purpose and access level..." rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30 resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-3" style={{ fontWeight: 600 }}>Permission Selection ({selectedPerms.size} selected)</label>
            <div className="space-y-3">
              {PERMISSION_CATEGORIES.map((cat) => {
                const cp = ALL_PERMISSIONS.filter((p) => p.category === cat);
                const allC = cp.every((p) => selectedPerms.has(p.id));
                const someC = cp.some((p) => selectedPerms.has(p.id));
                return (
                  <div key={`modal-cat-${cat}`} className="bg-gray-50 rounded-xl p-3.5">
                    <div className="flex items-center gap-2.5 cursor-pointer mb-2" onClick={() => toggleCategory(cat)}>
                      <div className={`rounded border-2 flex items-center justify-center ${allC ? "bg-[#1E3A8A] border-[#1E3A8A]" : someC ? "border-[#1E3A8A] bg-[#1E3A8A]/20" : "border-gray-300 bg-white"}`} style={{ width: 18, height: 18 }}>
                        {(allC || someC) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs text-gray-700" style={{ fontWeight: 700 }}>{cat}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 ml-7">
                      {cp.map((p) => (
                        <label key={`modal-perm-${p.id}`} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer py-1 hover:text-gray-800">
                          <input type="checkbox" checked={selectedPerms.has(p.id)} onChange={() => togglePerm(p.id)} className="w-3.5 h-3.5 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]/20" />
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { onCreated(); onClose(); }} className="px-5 py-2.5 text-sm text-white bg-[#1E3A8A] rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Create Role</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Assign Role Modal ─── */
function AssignRoleModal({ open, onClose, onAssigned }: { open: boolean; onClose: () => void; onAssigned: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center"><User className="w-4 h-4 text-[#1E3A8A]" /></div>
            <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>Assign Role</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1.5" style={{ fontWeight: 600 }}>User</label>
            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
              <option value="">Select user...</option>
              {USER_ASSIGNMENTS.map((u) => <option key={`au-${u.id}`} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1.5" style={{ fontWeight: 600 }}>Role</label>
            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
              <option value="">Select role...</option>
              {ROLE_NAMES.map((r) => <option key={`ar-${r}`} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1.5" style={{ fontWeight: 600 }}>Agency <span className="text-gray-400">(optional)</span></label>
            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
              <option value="">Select agency...</option>
              {AGENCY_NAMES.map((a) => <option key={`aa-${a}`} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { onAssigned(); onClose(); }} className="px-5 py-2.5 text-sm text-white bg-[#1E3A8A] rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Assign Role</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: "Active" | "Inactive" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`} style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Active" ? "bg-green-500" : "bg-gray-400"}`} />
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════ */
export function RBACManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>("roles");
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const [roles, setRoles] = useState<Role[]>(() => JSON.parse(JSON.stringify(INITIAL_ROLES)));

  // Matrix inline-editing state
  const [matrixState, setMatrixState] = useState<MatrixState>(() => buildMatrixState(ALL_PERMISSIONS, INITIAL_ROLES));
  const [matrixOriginal, setMatrixOriginal] = useState<MatrixState>(() => buildMatrixState(ALL_PERMISSIONS, INITIAL_ROLES));
  const [matrixDirty, setMatrixDirty] = useState(false);

  // Diff preview panel
  const [showDiffPreview, setShowDiffPreview] = useState(false);

  // Bulk action state
  const [bulkRole, setBulkRole] = useState("All");
  const [bulkPermGroup, setBulkPermGroup] = useState("All");
  const [bulkConfirm, setBulkConfirm] = useState<{ open: boolean; action: string; desc: string }>({ open: false, action: "", desc: "" });

  // Confirmation dialogs
  const [deleteRoleDialog, setDeleteRoleDialog] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [removeUserRoleDialog, setRemoveUserRoleDialog] = useState<{ open: boolean; user: UserAssignment | null }>({ open: false, user: null });

  // Change history diff modal
  const [diffModal, setDiffModal] = useState<{ open: boolean; entry: ChangeHistoryEntry | null }>({ open: false, entry: null });

  // Toast
  const [toast, setToast] = useState({ visible: false, message: "" });
  const showToast = useCallback((msg: string) => setToast({ visible: true, message: msg }), []);
  const hideToast = useCallback(() => setToast({ visible: false, message: "" }), []);

  // Search & filters
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAgency, setFilterAgency] = useState("All");
  const [permPage, setPermPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "roles", label: "Roles", icon: Shield },
    { key: "permissions", label: "Permissions", icon: KeyRound },
    { key: "assignments", label: "User Role Assignments", icon: Users },
  ];

  // Check dirty state
  useEffect(() => {
    const dirty = Object.keys(matrixState).some((k) => matrixState[k] !== matrixOriginal[k]);
    setMatrixDirty(dirty);
    if (!dirty) setShowDiffPreview(false);
  }, [matrixState, matrixOriginal]);

  const toggleMatrixCell = (permId: string, roleId: number) => {
    const key = `${permId}__${roleId}`;
    setMatrixState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute diff for preview
  const diffChanges = useMemo(() => {
    const added: { perm: string; role: string }[] = [];
    const removed: { perm: string; role: string }[] = [];
    Object.keys(matrixState).forEach((k) => {
      if (matrixState[k] !== matrixOriginal[k]) {
        const [permId, roleIdStr] = k.split("__");
        const role = roles.find((r) => r.id === Number(roleIdStr));
        if (matrixState[k]) {
          added.push({ perm: permId, role: role?.name || roleIdStr });
        } else {
          removed.push({ perm: permId, role: role?.name || roleIdStr });
        }
      }
    });
    return { added, removed };
  }, [matrixState, matrixOriginal, roles]);

  const changedCount = diffChanges.added.length + diffChanges.removed.length;

  const saveMatrixChanges = () => {
    setMatrixOriginal({ ...matrixState });
    setMatrixDirty(false);
    setShowDiffPreview(false);
    showToast("Role permissions successfully updated.");
  };

  const discardMatrixChanges = () => {
    setMatrixState({ ...matrixOriginal });
    setShowDiffPreview(false);
  };

  // Bulk permission operations
  const applyBulkAction = (action: string) => {
    const targetRoleId = bulkRole === "All" ? null : roles.find((r) => r.name === bulkRole)?.id;
    const targetPerms = bulkPermGroup === "All" ? ALL_PERMISSIONS : ALL_PERMISSIONS.filter((p) => p.category === bulkPermGroup);

    setMatrixState((prev) => {
      const next = { ...prev };
      targetPerms.forEach((p) => {
        const roleIds = targetRoleId ? [targetRoleId] : roles.map((r) => r.id);
        roleIds.forEach((rId) => {
          const key = `${p.id}__${rId}`;
          if (action === "grant") next[key] = true;
          else if (action === "revoke") next[key] = false;
          else if (action === "reset") {
            next[key] = matrixOriginal[key] ?? false;
          }
        });
      });
      return next;
    });
  };

  const handleBulkApply = (action: string) => {
    const roleLabel = bulkRole === "All" ? "all roles" : `"${bulkRole}"`;
    const groupLabel = bulkPermGroup === "All" ? "all permissions" : `all ${bulkPermGroup} permissions`;
    let desc = "";
    if (action === "grant") desc = `You are about to grant ${groupLabel} to ${roleLabel}.`;
    else if (action === "revoke") desc = `You are about to revoke ${groupLabel} from ${roleLabel}.`;
    else desc = `You are about to reset ${groupLabel} for ${roleLabel} to their original state.`;
    setBulkConfirm({ open: true, action, desc });
  };

  // Filtered data
  const filteredPerms = ALL_PERMISSIONS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    const matchRole = filterRole === "All" || p.assignedRoles.includes(filterRole);
    return matchSearch && matchCat && matchRole;
  });
  const permTotalPages = Math.ceil(filteredPerms.length / 10);
  const paginatedPerms = filteredPerms.slice((permPage - 1) * 10, permPage * 10);

  const filteredUsers = USER_ASSIGNMENTS.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || u.role === filterRole;
    const matchAgency = filterAgency === "All" || u.agency === filterAgency;
    return matchSearch && matchRole && matchAgency;
  });
  const userTotalPages = Math.ceil(filteredUsers.length / 10);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * 10, userPage * 10);

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1376px]">
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteRoleDialog.open}
        onClose={() => setDeleteRoleDialog({ open: false, role: null })}
        onConfirm={() => { if (deleteRoleDialog.role) { setRoles((prev) => prev.filter((r) => r.id !== deleteRoleDialog.role!.id)); showToast(`Role "${deleteRoleDialog.role.name}" has been deleted.`); } setDeleteRoleDialog({ open: false, role: null }); }}
        title="Delete Role" message="Are you sure you want to delete this role? This action cannot be undone and may affect users assigned to this role." confirmLabel="Delete Role" danger
      />
      <ConfirmDialog
        open={removeUserRoleDialog.open}
        onClose={() => setRemoveUserRoleDialog({ open: false, user: null })}
        onConfirm={() => { if (removeUserRoleDialog.user) showToast(`Role removed from ${removeUserRoleDialog.user.name}.`); setRemoveUserRoleDialog({ open: false, user: null }); }}
        title="Remove Role" message="Are you sure you want to remove this role from the selected user?" confirmLabel="Remove Role" danger
      />
      <ConfirmDialog
        open={bulkConfirm.open}
        onClose={() => setBulkConfirm({ open: false, action: "", desc: "" })}
        onConfirm={() => { applyBulkAction(bulkConfirm.action); showToast("Bulk permission change applied."); setBulkConfirm({ open: false, action: "", desc: "" }); }}
        title="Confirm Bulk Permission Change" message={bulkConfirm.desc} confirmLabel="Confirm"
      />
      <DiffModal open={diffModal.open} onClose={() => setDiffModal({ open: false, entry: null })} entry={diffModal.entry} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>RBAC Management</h1>
          <p className="text-[#6B7280] text-sm">Define system roles, assign permissions, and manage access control across the RIKMS platform.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {activeTab === "roles" && (
            <button onClick={() => setCreateRoleOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm" style={{ fontWeight: 600 }}>
              <Plus className="w-4 h-4" /> Create New Role
            </button>
          )}
          {activeTab === "assignments" && (
            <button onClick={() => setAssignRoleOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm" style={{ fontWeight: 600 }}>
              <Plus className="w-4 h-4" /> Assign Role
            </button>
          )}
        </div>
      </div>

      {/* Security Reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700 flex-1" style={{ fontWeight: 500 }}>
          All role and permission changes are recorded in the System Activity Logs.{" "}
          <Link to="/admin/activity" className="text-[#1E3A8A] hover:underline" style={{ fontWeight: 600 }}>View Activity Logs</Link>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Roles", value: roles.length, icon: Shield, color: "#1E3A8A", bg: "#DBEAFE" },
          { label: "System Roles", value: roles.filter((r) => r.isSystem).length, icon: Lock, color: "#DC2626", bg: "#FEE2E2" },
          { label: "Total Permissions", value: ALL_PERMISSIONS.length, icon: KeyRound, color: "#D97706", bg: "#FEF3C7" },
          { label: "Users with Roles", value: USER_ASSIGNMENTS.length, icon: Users, color: "#16A34A", bg: "#DCFCE7" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div>
              <div>
                <p className="text-xl text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
                <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 border-b border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={`tab-${tab.key}`} onClick={() => { setActiveTab(tab.key); setSearch(""); setFilterRole("All"); setFilterCategory("All"); setFilterAgency("All"); }}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#1E3A8A] text-[#1E3A8A]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                  style={{ fontWeight: activeTab === tab.key ? 700 : 500 }}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search roles, permissions, or users..." value={search} onChange={(e) => { setSearch(e.target.value); setPermPage(1); setUserPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab !== "roles" && (
              <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPermPage(1); setUserPage(1); }} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                <option value="All">All Roles</option>
                {ROLE_NAMES.map((r) => <option key={`fr-${r}`} value={r}>{r}</option>)}
              </select>
            )}
            {activeTab === "permissions" && (
              <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPermPage(1); }} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                <option value="All">All Categories</option>
                {PERMISSION_CATEGORIES.map((c) => <option key={`fc-${c}`} value={c}>{c}</option>)}
              </select>
            )}
            {activeTab === "assignments" && (
              <select value={filterAgency} onChange={(e) => { setFilterAgency(e.target.value); setUserPage(1); }} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                <option value="All">All Agencies</option>
                {AGENCY_NAMES.map((a) => <option key={`fa-${a}`} value={a}>{a}</option>)}
              </select>
            )}
            {activeTab === "roles" && (
              <button onClick={() => setShowMatrix(!showMatrix)} className={`px-3 py-2.5 text-sm rounded-lg border transition-colors ${showMatrix ? "bg-[#1E3A8A] text-white border-[#1E3A8A]" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`} style={{ fontWeight: 500 }}>
                Permission Matrix
              </button>
            )}
          </div>
        </div>

        {/* ─── Tab 1: Roles (Table View) ─── */}
        {activeTab === "roles" && !showMatrix && (
          <div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Role Name</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Description</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Users</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Permissions</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Created</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRoles.map((role) => (
                    <tr key={`role-${role.id}`} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: role.bg }}><Shield className="w-4 h-4" style={{ color: role.color }} /></div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{role.name}</span>
                            {role.isSystem && (<span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-0.5" style={{ fontWeight: 600 }}><Lock className="w-2.5 h-2.5" /> System</span>)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden xl:table-cell max-w-[260px]"><span className="text-xs text-gray-500 line-clamp-2">{role.description}</span></td>
                      <td className="px-6 py-3.5 text-center"><span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{role.userCount}</span></td>
                      <td className="px-6 py-3.5 text-center"><span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{role.permissionsCount}</span></td>
                      <td className="px-6 py-3.5 hidden lg:table-cell"><span className="text-xs text-gray-500">{role.createdDate}</span></td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="View Role"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="Edit Role"><Edit2 className="w-4 h-4" /></button>
                          {!role.isSystem && (<button onClick={() => setDeleteRoleDialog({ open: true, role })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete Role"><Trash2 className="w-4 h-4" /></button>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredRoles.map((role) => (
                <div key={`mob-role-${role.id}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: role.bg }}><Shield className="w-5 h-5" style={{ color: role.color }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{role.name}</span>
                        {role.isSystem && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200" style={{ fontWeight: 600 }}>System</span>}
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{role.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{role.userCount} users</span>
                        <span className="flex items-center gap-1"><KeyRound className="w-3 h-3" />{role.permissionsCount} perms</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 ml-13">
                    <button onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)} className="text-xs text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>{expandedRole === role.id ? "Hide Permissions" : "View Permissions"}</button>
                    {!role.isSystem && <button onClick={() => setDeleteRoleDialog({ open: true, role })} className="text-xs text-red-500 hover:underline" style={{ fontWeight: 500 }}>Delete</button>}
                  </div>
                  {expandedRole === role.id && (
                    <div className="mt-3 space-y-2">
                      {role.permissionMatrix.map((pm) => (
                        <div key={`mob-pm-${role.id}-${pm.module}`} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-700 mb-2" style={{ fontWeight: 700 }}>{pm.module}</p>
                          <div className="space-y-1.5">
                            {pm.actions.map((act) => (
                              <div key={`mob-act-${role.id}-${pm.module}-${act.name}`} className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">{act.name}</span>
                                {act.allowed ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop inline permission view */}
            {expandedRole !== null && (
              <div className="hidden md:block border-t border-gray-100 bg-gray-50/50">
                {(() => {
                  const role = roles.find((r) => r.id === expandedRole);
                  if (!role) return null;
                  return (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2"><Shield className="w-4 h-4" style={{ color: role.color }} /><h3 className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{role.name} – Permission Matrix</h3></div>
                        <button onClick={() => setExpandedRole(null)} className="text-xs text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                        <table className="w-full">
                          <thead><tr className="bg-gray-50/80"><th className="text-left px-5 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Module</th>{role.permissionMatrix[0]?.actions.map((a) => (<th key={`eh-${a.name}`} className="text-center px-3 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>{a.name}</th>))}</tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {role.permissionMatrix.map((pm) => (
                              <tr key={`ep-${pm.module}`} className="hover:bg-gray-50/30">
                                <td className="px-5 py-3 text-sm text-gray-700" style={{ fontWeight: 500 }}>{pm.module}</td>
                                {pm.actions.map((act) => (<td key={`ea-${pm.module}-${act.name}`} className="text-center px-3 py-3">{act.allowed ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}</td>))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ─── Role Permission Matrix View (Inline Editable) ─── */}
        {activeTab === "roles" && showMatrix && (
          <div>
            {/* Bulk Permission Toolbar */}
            <div className="px-6 py-3.5 border-b border-gray-100 bg-[#1E3A8A]/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#1E3A8A]" />
                <span className="text-xs text-gray-700" style={{ fontWeight: 700 }}>Bulk Permission Operations</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <select value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                  <option value="All">All Roles</option>
                  {roles.map((r) => <option key={`br-${r.id}`} value={r.name}>{r.name}</option>)}
                </select>
                <select value={bulkPermGroup} onChange={(e) => setBulkPermGroup(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer">
                  <option value="All">All Permission Groups</option>
                  {PERMISSION_CATEGORIES.map((c) => <option key={`bg-${c}`} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => handleBulkApply("grant")} className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors" style={{ fontWeight: 500 }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Grant
                  </button>
                  <button onClick={() => handleBulkApply("revoke")} className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors" style={{ fontWeight: 500 }}>
                    <XCircle className="w-3.5 h-3.5" /> Revoke
                  </button>
                  <button onClick={() => handleBulkApply("reset")} className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" style={{ fontWeight: 500 }}>
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Save / Discard bar */}
            <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Click cells to toggle permissions.</span>
                {matrixDirty && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200" style={{ fontWeight: 600 }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {changedCount} unsaved change{changedCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {matrixDirty && (
                  <button onClick={() => setShowDiffPreview(!showDiffPreview)} className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-lg border transition-colors ${showDiffPreview ? "bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]/20" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`} style={{ fontWeight: 500 }}>
                    <GitCompareArrows className="w-3.5 h-3.5" /> {showDiffPreview ? "Hide" : "Preview"} Changes
                  </button>
                )}
                {matrixDirty && (
                  <button onClick={discardMatrixChanges} className="px-3.5 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors" style={{ fontWeight: 500 }}>Discard</button>
                )}
                <button onClick={saveMatrixChanges} disabled={!matrixDirty} className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg transition-colors shadow-sm ${matrixDirty ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`} style={{ fontWeight: 600 }}>
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>

            {/* Diff Preview Panel */}
            {showDiffPreview && matrixDirty && (
              <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <GitCompareArrows className="w-4 h-4 text-[#1E3A8A]" />
                  <h3 className="text-sm text-[#0F172A]" style={{ fontWeight: 700 }}>Permission Changes Preview</h3>
                </div>
                <div className="bg-amber-50/50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4">
                  <p className="text-xs text-amber-700" style={{ fontWeight: 500 }}>
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    Changes to role permissions will affect all users assigned to this role.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* Added */}
                  <div className="bg-green-50/50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700" style={{ fontWeight: 700 }}>Added ({diffChanges.added.length})</span>
                    </div>
                    {diffChanges.added.length === 0 ? (
                      <p className="text-xs text-green-600/60">No permissions added.</p>
                    ) : (
                      <div className="space-y-1">
                        {diffChanges.added.map((d) => (
                          <div key={`da-${d.perm}-${d.role}`} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 border border-green-200/50">
                            <code className="text-[11px] text-gray-600">{d.perm}</code>
                            <span className="text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded" style={{ fontWeight: 600 }}>{d.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Removed */}
                  <div className="bg-red-50/50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-700" style={{ fontWeight: 700 }}>Removed ({diffChanges.removed.length})</span>
                    </div>
                    {diffChanges.removed.length === 0 ? (
                      <p className="text-xs text-red-500/60">No permissions removed.</p>
                    ) : (
                      <div className="space-y-1">
                        {diffChanges.removed.map((d) => (
                          <div key={`dr-${d.perm}-${d.role}`} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 border border-red-200/50">
                            <code className="text-[11px] text-gray-600">{d.perm}</code>
                            <span className="text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded" style={{ fontWeight: 600 }}>{d.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Side-by-side diff table */}
                {(diffChanges.added.length > 0 || diffChanges.removed.length > 0) && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100/80">
                          <th className="text-left px-4 py-2.5 text-[11px] text-gray-500" style={{ fontWeight: 600 }}>Permission</th>
                          <th className="text-left px-4 py-2.5 text-[11px] text-gray-500" style={{ fontWeight: 600 }}>Role</th>
                          <th className="text-center px-4 py-2.5 text-[11px] text-gray-500" style={{ fontWeight: 600 }}>Current</th>
                          <th className="text-center px-4 py-2.5 text-[11px] text-gray-500" style={{ fontWeight: 600 }}>New</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {diffChanges.added.map((d) => (
                          <tr key={`dt-a-${d.perm}-${d.role}`} className="bg-green-50/30">
                            <td className="px-4 py-2"><code className="text-[11px] text-gray-600">{d.perm}</code></td>
                            <td className="px-4 py-2 text-xs text-gray-600" style={{ fontWeight: 500 }}>{d.role}</td>
                            <td className="text-center px-4 py-2"><XCircle className="w-3.5 h-3.5 text-gray-300 mx-auto" /></td>
                            <td className="text-center px-4 py-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" /></td>
                          </tr>
                        ))}
                        {diffChanges.removed.map((d) => (
                          <tr key={`dt-r-${d.perm}-${d.role}`} className="bg-red-50/30">
                            <td className="px-4 py-2"><code className="text-[11px] text-gray-600">{d.perm}</code></td>
                            <td className="px-4 py-2 text-xs text-gray-600" style={{ fontWeight: 500 }}>{d.role}</td>
                            <td className="text-center px-4 py-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" /></td>
                            <td className="text-center px-4 py-2"><XCircle className="w-3.5 h-3.5 text-red-400 mx-auto" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500 sticky left-0 bg-gray-50/80 z-10" style={{ fontWeight: 600, minWidth: 160 }}>Permission</th>
                    {roles.map((r) => (
                      <th key={`mxh-${r.id}`} className="text-center px-4 py-3" style={{ minWidth: 100 }}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: r.bg }}><Shield className="w-3.5 h-3.5" style={{ color: r.color }} /></div>
                          <span className="text-[10px] text-gray-600" style={{ fontWeight: 700 }}>{r.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {PERMISSION_CATEGORIES.flatMap((cat) => [
                    <tr key={`mxcat-${cat}`} className="bg-gray-50/40">
                      <td colSpan={roles.length + 1} className="px-6 py-2 text-[11px] text-gray-500 sticky left-0 bg-gray-50/40" style={{ fontWeight: 700 }}>{cat}</td>
                    </tr>,
                    ...ALL_PERMISSIONS.filter((p) => p.category === cat).map((perm) => (
                      <tr key={`mxr-${perm.id}`} className="hover:bg-blue-50/30">
                        <td className="px-6 py-2.5 text-xs text-gray-600 sticky left-0 bg-white" style={{ fontWeight: 500 }}>
                          <code className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{perm.name}</code>
                        </td>
                        {roles.map((role) => {
                          const cellKey = `${perm.id}__${role.id}`;
                          const isEnabled = matrixState[cellKey] ?? false;
                          const isChanged = matrixState[cellKey] !== matrixOriginal[cellKey];
                          const isHovered = hoverCell === cellKey;
                          return (
                            <td key={`mxc-${perm.id}-${role.id}`}
                              className={`text-center px-4 py-2.5 cursor-pointer transition-colors relative ${isChanged ? "bg-amber-50/60" : ""} hover:bg-blue-50/50`}
                              onClick={() => toggleMatrixCell(perm.id, role.id)}
                              onMouseEnter={() => setHoverCell(cellKey)} onMouseLeave={() => setHoverCell(null)}
                              title="Enable or disable permission for this role">
                              {isEnabled ? <CheckCircle2 className={`w-4 h-4 mx-auto ${isChanged ? "text-amber-500" : "text-green-500"}`} /> : <XCircle className={`w-4 h-4 mx-auto ${isChanged ? "text-amber-300" : "text-gray-200"}`} />}
                              {isChanged && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                              {isHovered && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-800 text-white text-[10px] rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-lg" style={{ fontWeight: 500 }}>
                                  Click to {isEnabled ? "disable" : "enable"} permission
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Tab 2: Permissions ─── */}
        {activeTab === "permissions" && (
          <div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Permission Name</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Category</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Description</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Assigned Roles</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedPerms.map((perm) => (
                    <tr key={`perm-${perm.id}`} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-3.5"><code className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-md" style={{ fontWeight: 600 }}>{perm.name}</code></td>
                      <td className="px-6 py-3.5"><span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg" style={{ fontWeight: 500 }}>{perm.category}</span></td>
                      <td className="px-6 py-3.5 hidden xl:table-cell max-w-[220px]"><span className="text-xs text-gray-500">{perm.description}</span></td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {perm.assignedRoles.slice(0, 2).map((r) => <span key={`pr-${perm.id}-${r}`} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200" style={{ fontWeight: 500 }}>{r}</span>)}
                          {perm.assignedRoles.length > 2 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E3A8A]/5 text-[#1E3A8A] border border-[#1E3A8A]/20" style={{ fontWeight: 600 }}>+{perm.assignedRoles.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedPerms.map((perm) => (
                <div key={`mob-perm-${perm.id}`} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <code className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-md" style={{ fontWeight: 600 }}>{perm.name}</code>
                    <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg shrink-0" style={{ fontWeight: 500 }}>{perm.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{perm.description}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {perm.assignedRoles.map((r) => <span key={`mpr-${perm.id}-${r}`} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200" style={{ fontWeight: 500 }}>{r}</span>)}
                  </div>
                </div>
              ))}
            </div>
            {permTotalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">Showing {(permPage - 1) * 10 + 1}–{Math.min(permPage * 10, filteredPerms.length)} of {filteredPerms.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPermPage(Math.max(1, permPage - 1))} disabled={permPage === 1} className={`p-1.5 rounded-lg ${permPage === 1 ? "text-gray-300" : "hover:bg-gray-100 text-gray-400"}`}><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: permTotalPages }, (_, i) => i + 1).map((p) => <button key={`pp-${p}`} onClick={() => setPermPage(p)} className={`w-8 h-8 rounded-lg text-xs ${p === permPage ? "bg-[#1E3A8A] text-white" : "hover:bg-gray-100 text-gray-500"}`} style={{ fontWeight: p === permPage ? 600 : 400 }}>{p}</button>)}
                  <button onClick={() => setPermPage(Math.min(permTotalPages, permPage + 1))} disabled={permPage === permTotalPages} className={`p-1.5 rounded-lg ${permPage === permTotalPages ? "text-gray-300" : "hover:bg-gray-100 text-gray-400"}`}><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab 3: User Role Assignments ─── */}
        {activeTab === "assignments" && (
          <div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>User Name</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Email</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Role</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Agency</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Status</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Last Login</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedUsers.map((user) => {
                    const roleData = roles.find((r) => r.name === user.role);
                    return (
                      <tr key={`usr-${user.id}`} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500" style={{ fontWeight: 700 }}>{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                            <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 hidden xl:table-cell"><span className="text-xs text-gray-500">{user.email}</span></td>
                        <td className="px-6 py-3.5"><span className="text-xs px-2.5 py-1 rounded-lg border" style={{ fontWeight: 600, color: roleData?.color || "#6B7280", backgroundColor: roleData?.bg || "#F3F4F6", borderColor: `${roleData?.color || "#6B7280"}20` }}>{user.role}</span></td>
                        <td className="px-6 py-3.5 hidden lg:table-cell"><span className="text-xs text-gray-600 flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" />{user.agency}</span></td>
                        <td className="px-6 py-3.5 text-center"><StatusBadge status={user.status} /></td>
                        <td className="px-6 py-3.5 hidden xl:table-cell"><span className="text-xs text-gray-500">{user.lastLogin}</span></td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="Change Role"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setRemoveUserRoleDialog({ open: true, user })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Remove Role"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedUsers.map((user) => {
                const roleData = roles.find((r) => r.name === user.role);
                return (
                  <div key={`mob-usr-${user.id}`} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0" style={{ fontWeight: 700 }}>{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 mb-0.5" style={{ fontWeight: 600 }}>{user.name}</p>
                        <p className="text-xs text-gray-400 mb-2">{user.email}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-lg border" style={{ fontWeight: 600, color: roleData?.color, backgroundColor: roleData?.bg, borderColor: `${roleData?.color}20` }}>{user.role}</span>
                          <StatusBadge status={user.status} />
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{user.agency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {userTotalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">Showing {(userPage - 1) * 10 + 1}–{Math.min(userPage * 10, filteredUsers.length)} of {filteredUsers.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setUserPage(Math.max(1, userPage - 1))} disabled={userPage === 1} className={`p-1.5 rounded-lg ${userPage === 1 ? "text-gray-300" : "hover:bg-gray-100 text-gray-400"}`}><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: userTotalPages }, (_, i) => i + 1).map((p) => <button key={`up-${p}`} onClick={() => setUserPage(p)} className={`w-8 h-8 rounded-lg text-xs ${p === userPage ? "bg-[#1E3A8A] text-white" : "hover:bg-gray-100 text-gray-500"}`} style={{ fontWeight: p === userPage ? 600 : 400 }}>{p}</button>)}
                  <button onClick={() => setUserPage(Math.min(userTotalPages, userPage + 1))} disabled={userPage === userTotalPages} className={`p-1.5 rounded-lg ${userPage === userTotalPages ? "text-gray-300" : "hover:bg-gray-100 text-gray-400"}`}><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Role Change History ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center"><History className="w-4 h-4 text-[#1E3A8A]" /></div>
            <h2 className="text-sm text-[#0F172A]" style={{ fontWeight: 700 }}>Role Change History</h2>
          </div>
          <Link to="/admin/activity" className="text-xs text-[#1E3A8A] hover:underline" style={{ fontWeight: 600 }}>View All Activity</Link>
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Role Name</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Changed By</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Change Type</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Date</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>View Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {CHANGE_HISTORY.map((entry) => {
                const roleData = INITIAL_ROLES.find((r) => r.name === entry.roleName);
                return (
                  <tr key={`ch-${entry.id}`} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: roleData?.bg || "#F3F4F6" }}>
                          <Shield className="w-3.5 h-3.5" style={{ color: roleData?.color || "#6B7280" }} />
                        </div>
                        <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{entry.roleName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5"><span className="text-xs text-gray-600">{entry.changedBy}</span></td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border ${
                        entry.changeType === "Role Created" ? "bg-green-50 text-green-700 border-green-200" :
                        entry.changeType === "Role Modified" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`} style={{ fontWeight: 600 }}>{entry.changeType}</span>
                    </td>
                    <td className="px-6 py-3.5"><span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{entry.date}</span></td>
                    <td className="px-6 py-3.5 text-right">
                      <button onClick={() => setDiffModal({ open: true, entry })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1E3A8A]/5 border border-[#1E3A8A]/15 rounded-lg text-[#1E3A8A] hover:bg-[#1E3A8A]/10 transition-colors" style={{ fontWeight: 500 }}>
                        <GitCompareArrows className="w-3.5 h-3.5" /> View Changes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {CHANGE_HISTORY.map((entry) => {
            const roleData = INITIAL_ROLES.find((r) => r.name === entry.roleName);
            return (
              <div key={`mob-ch-${entry.id}`} className="p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: roleData?.bg || "#F3F4F6" }}>
                    <Shield className="w-3.5 h-3.5" style={{ color: roleData?.color || "#6B7280" }} />
                  </div>
                  <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{entry.roleName}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 mb-2">
                  <span>{entry.changedBy}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${entry.changeType === "Role Created" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`} style={{ fontWeight: 600 }}>{entry.changeType}</span>
                  <span>{entry.date}</span>
                </div>
                <button onClick={() => setDiffModal({ open: true, entry })} className="text-xs text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>View Changes</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Module Redesign Complete Notice ─── */}
      <div className="bg-green-50/60 border border-green-200 rounded-xl px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
          </div>
          <div>
            <h3 className="text-sm text-green-800 mb-1.5" style={{ fontWeight: 700 }}>Module Redesign Complete</h3>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              All scheduled module redesigns have been completed:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {["Security Center", "Archive & Data Recovery", "Platform Settings"].map((mod) => (
                <span key={`done-${mod}`} className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-white border border-green-200 text-green-700" style={{ fontWeight: 500 }}>
                  <CheckCircle2 className="w-3 h-3" /> {mod}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Security monitoring, data recovery workflows, and platform configuration management modules have been updated with improved UI and functionality.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRoleModal open={createRoleOpen} onClose={() => setCreateRoleOpen(false)} onCreated={() => showToast("New role has been created successfully.")} />
      <AssignRoleModal open={assignRoleOpen} onClose={() => setAssignRoleOpen(false)} onAssigned={() => showToast("Role has been assigned successfully.")} />

      <style>{`
        @keyframes rbac-slide-in { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        .animate-rbac-slide-in { animation: rbac-slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
