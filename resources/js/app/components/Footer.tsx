import { BookOpen, Mail } from "lucide-react";
import { Link } from "react-router";
import { useBootstrap } from "../hooks/useBootstrap";

export function Footer() {
    const { data } = useBootstrap();
    const siteName = data?.platform?.siteName ?? "RIKMS";
    const supportEmail = data?.platform?.supportEmail;
    return (
        <footer className="bg-[#1E3A8A] text-white">
            <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
                <div className="grid gap-8 sm:grid-cols-3">
                    <div>
                        <div className="mb-4 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                                <BookOpen className="h-5 w-5" />
                            </span>
                            <span className="text-lg font-bold">{siteName}</span>
                        </div>
                        <p className="max-w-sm text-sm leading-relaxed text-blue-200">
                            A regional repository for reviewed research and institutional knowledge in the
                            Davao Region.
                        </p>
                    </div>
                    <nav aria-label="Research links">
                        <h2 className="mb-4 font-semibold">Research</h2>
                        <ul className="space-y-2 text-sm text-blue-200">
                            <li>
                                <Link to="/browse" className="hover:text-white">
                                    Browse research
                                </Link>
                            </li>
                            <li>
                                <Link to="/agencies" className="hover:text-white">
                                    Participating agencies
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-white">
                                    About RIKMS
                                </Link>
                            </li>
                        </ul>
                    </nav>
                    <nav aria-label="Support and account links">
                        <h2 className="mb-4 font-semibold">Support and access</h2>
                        <ul className="space-y-2 text-sm text-blue-200">
                            <li className="flex flex-wrap gap-x-3 gap-y-2">
                                <Link to="/help" className="hover:text-white">
                                    Help
                                </Link>
                                <Link to="/contact" className="hover:text-white">
                                    Contact
                                </Link>
                                <Link to="/privacy" className="hover:text-white">
                                    Privacy
                                </Link>
                                <Link to="/terms" className="hover:text-white">
                                    Terms
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-white">
                                    Agency portal
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/login" className="hover:text-white">
                                    System administration
                                </Link>
                            </li>
                            {supportEmail && (
                                <li>
                                    <a
                                        href={`mailto:${supportEmail}`}
                                        className="inline-flex items-center gap-1 hover:text-white"
                                    >
                                        <Mail className="h-3 w-3" />
                                        {supportEmail}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </nav>
                </div>
                <div className="mt-10 border-t border-white/20 pt-6 text-center text-sm text-blue-200">
                    &copy; {new Date().getFullYear()} {siteName}. Research access is governed by each
                    contributing agency.
                </div>
            </div>
        </footer>
    );
}
