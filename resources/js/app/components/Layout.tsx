import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BootstrapProvider } from "./BootstrapProvider";
import { PlatformAnnouncement } from "./PlatformAnnouncement";

export function Layout() {
    return (
        <BootstrapProvider>
            <div
                className="min-h-screen flex flex-col bg-[#F9FAFB]"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                <a
                    href="#main-content"
                    className="sr-only z-[100] rounded-lg bg-white px-4 py-2 text-[#1E3A8A] shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
                >
                    Skip to content
                </a>
                <Navbar />
                <PlatformAnnouncement />
                <main id="main-content" className="flex-1">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </BootstrapProvider>
    );
}
