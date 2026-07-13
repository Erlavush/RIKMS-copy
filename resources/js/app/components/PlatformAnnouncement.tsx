import { Megaphone } from "lucide-react";
import { useBootstrap } from "../hooks/useBootstrap";

export function PlatformAnnouncement() {
    const { data } = useBootstrap();
    if (!data?.platform?.announcement) return null;
    return (
        <aside
            className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900"
            aria-label="Platform announcement"
        >
            <p className="mx-auto flex max-w-[1200px] items-center justify-center gap-2">
                <Megaphone className="h-4 w-4 shrink-0" />
                {data.platform.announcement}
            </p>
        </aside>
    );
}
