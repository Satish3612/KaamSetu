"use client";

import { useEffect, useRef } from "react";

type ProfessionalActionModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  tone?: "warning" | "positive";
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ProfessionalActionModal({
  open,
  title,
  message,
  confirmLabel,
  loading,
  tone = "warning",
  onCancel,
  onConfirm,
}: ProfessionalActionModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="professional-modal-title" aria-describedby="professional-modal-message" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${tone === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`} aria-hidden="true">
          {tone === "positive" ? "✓" : "!"}
        </div>
        <h2 id="professional-modal-title" className="mt-5 text-2xl font-extrabold text-slate-900">{title}</h2>
        <p id="professional-modal-message" className="mt-3 leading-7 text-slate-600">{message}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelButtonRef} type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`rounded-xl px-5 py-3 font-bold text-white disabled:opacity-60 ${tone === "positive" ? "bg-blue-700 hover:bg-blue-800" : "bg-slate-900 hover:bg-slate-800"}`}>
            {loading ? "Updating..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
