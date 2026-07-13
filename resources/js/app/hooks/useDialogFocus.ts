import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useDialogFocus<
    TDialog extends HTMLElement = HTMLDivElement,
    TInitial extends HTMLElement = HTMLElement,
>(open: boolean, onClose: () => void) {
    const dialogRef = useRef<TDialog>(null);
    const initialFocusRef = useRef<TInitial>(null);
    const closeRef = useRef(onClose);

    useEffect(() => {
        closeRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeRef.current();
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = Array.from(
                dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
            ).filter((element) => element.getClientRects().length > 0);
            if (!focusable.length) {
                event.preventDefault();
                dialogRef.current?.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        const frame = window.requestAnimationFrame(() => {
            initialFocusRef.current?.focus();
            if (!initialFocusRef.current) {
                dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
            }
        });

        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, [open]);

    return [dialogRef, initialFocusRef] as const;
}
