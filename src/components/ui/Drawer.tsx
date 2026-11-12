"use client";

import { useEffect, useRef } from "react";

/**
 * A2: native <dialog> gives focus trapping, Esc to close, inert background and
 * focus restoration. We add backdrop-click close and scroll lock.
 */
export function Drawer({
  open,
  onClose,
  side,
  label,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  side: "left" | "right" | "top";
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`drawer drawer-${side} ${className}`}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
