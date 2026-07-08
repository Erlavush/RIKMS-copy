import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Building2,
  ChevronRight,
  Upload,
  Trash2,
  Globe,
  Mail,
  MapPin,
  Save,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

/* ──────────── Initial Data ──────────── */

const INITIAL = {
  name: "Department of Science and Technology Region XI",
  shortName: "DOST XI",
  description:
    "The Department of Science and Technology Region XI promotes science, technology, and innovation to support regional development and research initiatives in the Davao Region.",
  website: "https://region11.dost.gov.ph",
  email: "info@dostxi.gov.ph",
  address: "DOST XI Regional Office, Km. 7, J.P. Laurel Ave., Lanang, Davao City, Philippines",
};

const STATS = {
  total: 142,
  published: 118,
  draft: 24,
};

/* ──────────── Validation helpers ──────────── */

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidUrl(v: string) {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

/* ──────────── Component ──────────── */

export function AgencyProfileAdmin() {
  const [name, setName] = useState(INITIAL.name);
  const [shortName, setShortName] = useState(INITIAL.shortName);
  const [description, setDescription] = useState(INITIAL.description);
  const [website, setWebsite] = useState(INITIAL.website);
  const [email, setEmail] = useState(INITIAL.email);
  const [address, setAddress] = useState(INITIAL.address);
  const [hasLogo, setHasLogo] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => { if (!dirty) setDirty(true); };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Agency name is required.";
    if (!shortName.trim()) e.shortName = "Short name is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (!website.trim()) e.website = "Website is required.";
    else if (!isValidUrl(website)) e.website = "Enter a valid URL (e.g. https://example.gov.ph).";
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!address.trim()) e.address = "Office address is required.";
    return e;
  }, [name, shortName, description, website, email, address]);

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSave = () => {
    setTouched({ name: true, shortName: true, description: true, website: true, email: true, address: true });
    if (Object.keys(errors).length > 0) return;
    setDirty(false);
    showToast("Agency profile updated successfully.");
  };

  const handleCancel = () => {
    setName(INITIAL.name);
    setShortName(INITIAL.shortName);
    setDescription(INITIAL.description);
    setWebsite(INITIAL.website);
    setEmail(INITIAL.email);
    setAddress(INITIAL.address);
    setHasLogo(true);
    setTouched({});
    setDirty(false);
  };

  const fieldError = (field: string) => touched[field] && errors[field] ? errors[field] : null;

  const inputCls = (field: string) =>
    `w-full px-4 py-2.5 bg-[#F9FAFB] border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
      fieldError(field)
        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
        : "border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
    }`;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {savedToast && (
        <div className="fixed top-20 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-[fadeIn_0.2s_ease]" style={{ fontWeight: 500 }}>
          <CheckCircle2 className="w-4 h-4" />
          {savedToast}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link to="/agency/dashboard" className="hover:text-[#1E3A8A] transition-colors">Agency</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>Agency Profile</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Agency Profile
        </h1>
        <p className="text-[#6B7280] text-sm">
          Manage your agency's information displayed in the RIKMS research portal.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT — Agency Information Form (70%) */}
        <div className="flex-1 lg:w-[70%] space-y-6">
          {/* Agency Logo */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <h3 className="text-[#1E3A8A] mb-4 pb-2 border-b border-gray-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              Agency Logo
            </h3>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Preview */}
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-200 bg-[#F9FAFB] flex items-center justify-center shrink-0 overflow-hidden">
                {hasLogo ? (
                  <div className="w-full h-full bg-[#1E3A8A]/10 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-[#1E3A8A]" />
                  </div>
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => { setHasLogo(true); markDirty(); }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload New Logo
                  </button>
                  {hasLogo && (
                    <button
                      onClick={() => { setHasLogo(false); markDirty(); }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Logo
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>Accepted formats: <span className="text-gray-500" style={{ fontWeight: 500 }}>PNG, SVG, JPG</span></p>
                  <p>Recommended size: <span className="text-gray-500" style={{ fontWeight: 500 }}>512 × 512 px</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Agency Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <h3 className="text-[#1E3A8A] mb-5 pb-2 border-b border-gray-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              Agency Information
            </h3>
            <div className="space-y-5">
              {/* Agency Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Agency Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); markDirty(); }}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  className={inputCls("name")}
                  placeholder="e.g. Department of Science and Technology Region XI"
                />
                {fieldError("name") && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldError("name")}
                  </p>
                )}
              </div>

              {/* Short Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Agency Short Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => { setShortName(e.target.value); markDirty(); }}
                  onBlur={() => setTouched((t) => ({ ...t, shortName: true }))}
                  className={inputCls("shortName")}
                  placeholder="e.g. DOST XI"
                />
                {fieldError("shortName") && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldError("shortName")}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Agency Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                  rows={4}
                  className={`${inputCls("description")} resize-none`}
                  placeholder="Describe your agency's mission and role..."
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldError("description") ? (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3" /> {fieldError("description")}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">{description.length} characters</span>
                </div>
              </div>

              {/* Website & Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Agency Website <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => { setWebsite(e.target.value); markDirty(); }}
                      onBlur={() => setTouched((t) => ({ ...t, website: true }))}
                      className={`${inputCls("website")} pl-10`}
                      placeholder="https://region11.dost.gov.ph"
                    />
                  </div>
                  {fieldError("website") && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="w-3 h-3" /> {fieldError("website")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Agency Contact Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); markDirty(); }}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      className={`${inputCls("email")} pl-10`}
                      placeholder="info@dostxi.gov.ph"
                    />
                  </div>
                  {fieldError("email") && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="w-3 h-3" /> {fieldError("email")}
                    </p>
                  )}
                </div>
              </div>

              {/* Office Address */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Agency Office Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); markDirty(); }}
                    onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                    className={`${inputCls("address")} pl-10`}
                    placeholder="DOST XI Regional Office, Davao City, Philippines"
                  />
                </div>
                {fieldError("address") && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldError("address")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg transition-colors ${
                  dirty
                    ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                style={{ fontWeight: 500 }}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
              {dirty && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Preview & Stats (30%) */}
        <div className="lg:w-[30%] space-y-5">
          {/* Live Agency Profile Preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Profile Preview</h3>
              <p className="text-xs text-gray-400 mt-0.5">How your agency appears on the public portal.</p>
            </div>
            <div className="p-5">
              {/* Preview Card */}
              <div className="rounded-xl border border-gray-200 bg-[#F9FAFB] overflow-hidden">
                {/* Banner */}
                <div className="h-16 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]" />
                {/* Content */}
                <div className="px-4 pb-5 -mt-6">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-xl border-2 border-white bg-white shadow-sm flex items-center justify-center mb-3">
                    {hasLogo ? (
                      <Building2 className="w-7 h-7 text-[#1E3A8A]" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <p className="text-gray-800 mb-0.5 truncate" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    {name || "Agency Name"}
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded text-[10px] mb-2" style={{ fontWeight: 600 }}>
                    {shortName || "ABBR"}
                  </span>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-3" style={{ lineHeight: 1.5 }}>
                    {description || "No description provided."}
                  </p>
                  {website && isValidUrl(website) && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[#1E3A8A] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Agency Research Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Research Summary</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#1E3A8A]/5 rounded-lg">
                <div className="w-9 h-9 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 text-[#1E3A8A]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#1E3A8A]">Total Research Publications</p>
                  <p className="text-lg text-[#1E3A8A]" style={{ fontWeight: 700 }}>{STATS.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-600">Published Research</p>
                  <p className="text-lg text-green-700" style={{ fontWeight: 700 }}>{STATS.published}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-600">Draft Research</p>
                  <p className="text-lg text-amber-700" style={{ fontWeight: 700 }}>{STATS.draft}</p>
                </div>
              </div>

              <Link
                to="/agency/research"
                className="mt-1 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/20 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <FileText className="w-4 h-4" />
                View Research Repository
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Quick Links</h3>
            </div>
            <div className="p-5 space-y-2">
              <Link
                to="/agency/settings"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1E3A8A] transition-colors"
                style={{ fontWeight: 500 }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Agency Settings
              </Link>
              <Link
                to="/agency/analytics"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1E3A8A] transition-colors"
                style={{ fontWeight: 500 }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Research Analytics
              </Link>
              <a
                href={isValidUrl(website) ? website : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1E3A8A] transition-colors"
                style={{ fontWeight: 500 }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Public Profile
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
