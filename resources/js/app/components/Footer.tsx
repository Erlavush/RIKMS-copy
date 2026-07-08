import { BookOpen } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-[#1E3A8A] text-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* RIKMS Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>RIKMS</span>
            </div>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Help</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Research Column */}
          <div>
            <h4 className="text-white mb-4" style={{ fontSize: "1rem", fontWeight: 600 }}>Research</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link to="/browse" className="hover:text-white transition-colors">Browse Research</Link></li>
              <li><Link to="/agencies" className="hover:text-white transition-colors">Agencies</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white mb-4" style={{ fontSize: "1rem", fontWeight: 600 }}>Legal</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20 text-center text-sm text-blue-200">
          &copy; {new Date().getFullYear()} Regionwide Integrated Knowledge Management System (RIKMS)
        </div>
      </div>
    </footer>
  );
}