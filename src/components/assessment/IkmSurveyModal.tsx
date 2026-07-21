import { apiFetch } from "../../lib/api";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, MessageSquare, CheckCircle2, Loader2, ClipboardCheck, Send } from "lucide-react";
import { cn } from "../../lib/utils";

// Removed hardcoded IKM_UNSUR
interface IkmQuestion {
  id: number;
  key: string;
  label: string;
  description: string;
  isActive: boolean;
  orderIndex: number;
}

const SKALA_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Tidak Baik", color: "text-red-600", bg: "bg-red-50 border-red-200 ring-red-400" },
  2: { label: "Kurang Baik", color: "text-amber-600", bg: "bg-amber-50 border-amber-200 ring-amber-400" },
  3: { label: "Baik", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 ring-blue-400" },
  4: { label: "Sangat Baik", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 ring-emerald-400" },
};

interface IkmSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  assessmentName: string;
  onSubmitSuccess: () => void;
}

export default function IkmSurveyModal({
  isOpen,
  onClose,
  assessmentId,
  assessmentName,
  onSubmitSuccess,
}: IkmSurveyModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [testimoni, setTestimoni] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [questions, setQuestions] = useState<IkmQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      apiFetch("/api/settings/ikm-questions")
        .then(res => res.json())
        .then(data => {
          setQuestions(data.filter((q: IkmQuestion) => q.isActive));
          setLoadingQuestions(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingQuestions(false);
        });
    }
  }, [isOpen]);

  const allFilled = questions.length > 0 && questions.every((u) => scores[u.key] >= 1 && scores[u.key] <= 4) && testimoni.trim().length > 0;

  const totalScore = questions.reduce((sum, u) => sum + (scores[u.key] || 0), 0);
  const nilaiIkm = totalScore > 0 ? ((totalScore / (questions.length * 4)) * 100) : 0;

  const getIkmCategory = (val: number) => {
    if (val >= 88.31) return { label: "Sangat Baik", color: "text-emerald-700", grade: "A" };
    if (val >= 76.61) return { label: "Baik", color: "text-blue-700", grade: "B" };
    if (val >= 65.00) return { label: "Kurang Baik", color: "text-amber-700", grade: "C" };
    return { label: "Tidak Baik", color: "text-red-700", grade: "D" };
  };

  const handleSubmit = async () => {
    if (!allFilled || submitting) return;
    setSubmitting(true);

    try {
      const userId = localStorage.getItem("activeUserId");
      const res = await apiFetch(`/api/assessments/${assessmentId}/ikm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          answers: scores,
          testimoni: testimoni.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onSubmitSuccess();
          onClose();
        }, 1500);
      } else {
        const err = await res.json();
        if (res.status === 409) {
          // Already submitted
          onSubmitSuccess();
          onClose();
        } else {
          alert(`Gagal mengirim survei: ${err.error || "Kesalahan server"}`);
        }
      }
    } catch (error) {
      console.error("Submit IKM error", error);
      alert("Gagal mengirim survei. Periksa koneksi internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200/60 flex flex-col overflow-hidden"
        >
          {/* Success overlay */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-800">Terima Kasih!</h3>
                <p className="text-sm text-slate-500 text-center max-w-xs">
                  Survei kepuasan Anda telah berhasil disimpan. Dokumen PDF akan segera diunduh.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="bg-gradient-to-br from-pu-blue via-blue-600 to-indigo-700 px-6 py-5 text-white relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-wide">Survei Kepuasan Pelayanan Publik</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-0.5">
                      Indeks Kepuasan Masyarakat (IKM) — Permenpan No. 14/2017
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/15 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-white/90 border border-white/10">
                <span className="font-bold">Penilaian untuk:</span> {assessmentName}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Wajib diisi:</strong> Anda perlu mengisi seluruh 9 unsur penilaian pelayanan dan testimoni sebelum dapat mengunduh dokumen hasil penilaian.
              </p>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {loadingQuestions ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-pu-blue" />
                </div>
              ) : (
                questions.map((unsur, idx) => (
                  <motion.div
                    key={unsur.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{unsur.label}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{unsur.description}</p>
                      </div>
                      {scores[unsur.key] && (
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          SKALA_LABELS[scores[unsur.key]].bg,
                          SKALA_LABELS[scores[unsur.key]].color
                        )}>
                          {SKALA_LABELS[scores[unsur.key]].label}
                        </span>
                      )}
                    </div>

                    {/* Radio buttons - Skala 1-4 */}
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((val) => {
                        const isSelected = scores[unsur.key] === val;
                        const style = SKALA_LABELS[val];
                        return (
                          <button
                            key={val}
                            onClick={() => setScores((prev) => ({ ...prev, [unsur.key]: val }))}
                            className={cn(
                              "relative flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer",
                              "hover:scale-[1.03] active:scale-[0.97]",
                              isSelected
                                ? `${style.bg} ring-2 ${style.bg.split(' ').find(c => c.startsWith('ring-'))} shadow-sm`
                                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                            )}
                          >
                            <span className={cn(
                              "text-lg font-black",
                              isSelected ? style.color : "text-slate-400"
                            )}>
                              {val}
                            </span>
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider leading-tight",
                              isSelected ? style.color : "text-slate-400"
                            )}>
                              {style.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Testimoni */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold text-slate-800">Testimoni & Masukan</h4>
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Wajib</span>
              </div>
              <textarea
                value={testimoni}
                onChange={(e) => setTestimoni(e.target.value)}
                placeholder="Tuliskan pengalaman, kesan, dan saran Anda terhadap pelayanan penilaian kerusakan bangunan yang telah diberikan..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pu-blue focus:border-transparent resize-none transition-all"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[9px] text-slate-400 font-mono">{testimoni.length} karakter</span>
                {testimoni.trim().length > 0 && (
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Terisi
                  </span>
                )}
              </div>
            </motion.div>

            {/* Live IKM Calculation Preview */}
            {totalScore > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-indigo-200/50 rounded-xl p-4 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nilai IKM Sementara</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-2xl font-black text-slate-800">{nilaiIkm.toFixed(2)}</span>
                      <span className={cn(
                        "text-xs font-bold mb-1 px-2 py-0.5 rounded-full border",
                        getIkmCategory(nilaiIkm).color,
                        nilaiIkm >= 88.31 ? "bg-emerald-50 border-emerald-200" :
                        nilaiIkm >= 76.61 ? "bg-blue-50 border-blue-200" :
                        nilaiIkm >= 65 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
                      )}>
                        {getIkmCategory(nilaiIkm).grade} — {getIkmCategory(nilaiIkm).label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-mono">{questions.filter(u => scores[u.key]).length}/{questions.length} unsur terisi</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer / Submit */}
          <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="text-[10px] text-slate-500">
              {allFilled ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Semua unsur telah terisi lengkap
                </span>
              ) : (
                <span>
                  Lengkapi {questions.length - questions.filter(u => scores[u.key]).length} unsur{!testimoni.trim() ? " & testimoni" : ""} lagi
                </span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!allFilled || submitting}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all",
                allFilled && !submitting
                  ? "text-white bg-pu-blue hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Survei & Unduh PDF
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
