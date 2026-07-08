import { Link } from "react-router";
import { Home, ArrowLeft, Search } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-[#1E3A8A]" />
        </div>
        <h1 className="text-[#0F172A] mb-2" style={{ fontSize: "2rem", fontWeight: 800 }}>
          404
        </h1>
        <h2 className="text-[#0F172A] mb-3" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          Page Not Found
        </h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved. Please check the URL or navigate back to the homepage.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-xl hover:bg-[#1E3A8A]/90 transition-colors shadow-sm"
            style={{ fontWeight: 600 }}
          >
            <Home className="w-4 h-4" /> Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
