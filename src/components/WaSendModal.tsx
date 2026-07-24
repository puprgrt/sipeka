import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, File, UploadCloud, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";

interface WaSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: any; // Type according to your assessment data
}

export default function WaSendModal({ isOpen, onClose, assessment }: WaSendModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  // Document options
  const [docSource, setDocSource] = useState<"none" | "system" | "upload">("none");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Pre-fill when modal opens
  useEffect(() => {
    if (isOpen && assessment) {
      // Find phone number from user or assessment
      const phone = assessment.user?.kontakWhatsapp || "";
      setPhoneNumber(phone);
      
      // Basic template
      const template = `Halo Bapak/Ibu ${assessment.user?.namaLengkap || "Pemohon"},\n\nTerkait permohonan penilaian bangunan pada sekolah/instansi ${assessment.bangunan?.namaSekolahInstansi || "-"}, kami sampaikan bahwa permohonan Anda saat ini berstatus: *${assessment.statusTerakhir?.replace(/_/g, ' ') || "-"}*.\n\nDemikian informasi yang dapat kami sampaikan. Terima kasih.`;
      setMessage(template);

      // Reset doc source
      if (assessment.urlDokumenHasilPdf) {
        setDocSource("system");
      } else {
        setDocSource("none");
      }
      setSelectedFile(null);
    }
  }, [isOpen, assessment]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      alert("Nomor WhatsApp tujuan tidak boleh kosong.");
      return;
    }
    if (!message.trim() && docSource === "none") {
      alert("Pesan atau dokumen harus diisi.");
      return;
    }

    setSending(true);
    
    try {
      let fileUrl;
      let fileBase64;
      let fileName;
      let mimetype;

      if (docSource === "system" && assessment?.urlDokumenHasilPdf) {
        fileUrl = assessment.urlDokumenHasilPdf;
        fileName = `Hasil_Penilaian_${assessment.bangunan?.namaSekolahInstansi || "SIPEKA"}.pdf`;
        mimetype = "application/pdf";
      } else if (docSource === "upload" && selectedFile) {
        fileBase64 = await toBase64(selectedFile);
        fileName = selectedFile.name;
        mimetype = selectedFile.type || "application/octet-stream";
      }

      const res = await apiFetch("/api/wa/send", {
        method: "POST",
        body: JSON.stringify({
          jid: phoneNumber,
          text: message,
          fileUrl,
          fileBase64,
          fileName,
          mimetype
        })
      });

      if (res.ok) {
        alert("Pesan berhasil dikirim via WhatsApp!");
        onClose();
      } else {
        const err = await res.json();
        alert(`Gagal mengirim pesan: ${err.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending WA message:", error);
      alert("Terjadi kesalahan saat mencoba mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              Kirim Pesan WhatsApp
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
            
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor WhatsApp Tujuan
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 6281234567890"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Gunakan format kode negara (contoh: 628... tanpa spasi/plus).</p>
            </div>

            {/* Document Options */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Lampiran Dokumen
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="docSource" 
                    checked={docSource === "none"} 
                    onChange={() => setDocSource("none")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Tanpa Lampiran (Hanya Teks)</span>
                </label>
                
                {assessment?.urlDokumenHasilPdf && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="docSource" 
                      checked={docSource === "system"} 
                      onChange={() => setDocSource("system")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <File className="w-4 h-4 text-red-500" />
                      Gunakan PDF Hasil Penilaian Sistem
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="docSource" 
                    checked={docSource === "upload"} 
                    onChange={() => setDocSource("upload")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <UploadCloud className="w-4 h-4 text-blue-500" />
                    Unggah Dokumen Manual
                  </span>
                </label>
              </div>

              {/* Upload Input */}
              {docSource === "upload" && (
                <div className="mt-3">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 dark:text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-emerald-50 file:text-emerald-700
                      hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
                  />
                </div>
              )}
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex justify-between">
                <span>Pesan</span>
                <span className="text-xs font-normal text-slate-500 italic">Dapat diedit (Hybrid Template)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white resize-y"
              ></textarea>
              <div className="flex items-start gap-2 mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>
                  Sistem otomatis mengisi nomor HP dan template pesan berdasarkan data permohonan. Anda dapat menyesuaikannya sebelum mengirim.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSend}
              disabled={sending || (!phoneNumber.trim())}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Pesan
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
