import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, FileText, X } from "lucide-react";

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant?: "confirm" | "prompt" | "info";
  inputLabel?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
}

export default function ActionDialog({
  isOpen,
  onClose,
  title,
  description,
  variant = "confirm",
  inputLabel,
  inputValue,
  onInputChange,
  onConfirm,
  confirmLabel = variant === "prompt" ? "Simpan" : "Lanjutkan",
  cancelLabel = "Batal",
  confirmDisabled = false,
}: ActionDialogProps) {
  if (!isOpen) return null;

  const icon = variant === "info" ? CheckCircle2 : AlertTriangle;
  const Icon = icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-blue-50 p-2 text-blue-600">
                {variant === "info" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4">
            {variant === "prompt" && (
              <div className="space-y-2">
                {inputLabel && <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{inputLabel}</label>}
                <input
                  value={inputValue ?? ""}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                  placeholder="Masukkan nilai"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
