import React, { useState } from 'react';
import { MessageSquare, Plus, X, Send, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SupportTicketPanelProps {
  tickets: any[];
  setTickets: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SupportTicketPanel({ tickets, setTickets }: SupportTicketPanelProps) {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("Kerusakan Struktur");
  const [newTicketText, setNewTicketText] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [currentChatReplyText, setCurrentChatReplyText] = useState("");

  const handleSendMessage = (text: string) => {
    if (!selectedTicket || !text.trim()) return;

    const userMsg = {
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const updatedMsgs = [...t.messages, userMsg];
        return { ...t, status: "Menunggu Balasan", messages: updatedMsgs };
      }
      return t;
    });
    setTickets(updatedTickets);

    const activeTkt = updatedTickets.find(t => t.id === selectedTicket.id);
    setSelectedTicket(activeTkt);

    setCurrentChatReplyText("operator-typing");
    
    setTimeout(() => {
      const lowercaseText = text.toLowerCase();
      let replyText = "Pesan Anda telah kami terima di pusat pendampingan masyarakat PUPR Garut. Tim verifikator kami sedang meninjau detail usulan administrasi SMAN 1 Garut dan akan memberikan feedback resmi segera.";

      if (lowercaseText.includes("retak") || lowercaseText.includes("dinding") || lowercaseText.includes("tembok")) {
        replyText = "Terima kasih atas laporan detailnya. Untuk retak pada dinding non-struktural (lebar < 2mm), umumnya dikategorikan kerusakan ringan dan bisa ditambal dengan mortar instan. Namun, jika retak menembus bata atau terjadi pada balok/kolom, silakan sertakan foto detail di berkas usulan.";
      } else if (lowercaseText.includes("rab") || lowercaseText.includes("dana") || lowercaseText.includes("biaya") || lowercaseText.includes("anggaran")) {
        replyText = "Mengenai rincian Rencana Anggaran Biaya (RAB), sistem kami menyediakan estimasi otomatis kasar di 'Ikhtisar Analisis' berdasarkan volume kerusakan yang diinput. Tim verifikator dinas akan memvalidasi volume tersebut saat survei lapangan untuk menyusun RAB definitif.";
      } else if (lowercaseText.includes("sptjm") || lowercaseText.includes("materai") || lowercaseText.includes("tanda tangan")) {
        replyText = "Untuk SPTJM (Surat Pertanggungjawaban Mutlak), sesuai regulasi Permen PUPR, wajib ditandatangani oleh Kepala Instansi/Sekolah di atas materai Rp10.000 basah dan dibubuhi stempel instansi resmi sebelum diunggah ke sistem.";
      }

      const operatorMsg = {
        sender: "operator",
        text: replyText,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };

      const finalTickets = updatedTickets.map(t => {
        if (t.id === selectedTicket.id) {
          return { ...t, status: "Dijawab", messages: [...t.messages, operatorMsg] };
        }
        return t;
      });

      setTickets(finalTickets);
      const finalActiveTkt = finalTickets.find(t => t.id === selectedTicket.id);
      setSelectedTicket(finalActiveTkt);
      setCurrentChatReplyText("");
    }, 1500);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketText.trim()) return;

    const newTkt = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newTicketSubject,
      category: newTicketCategory,
      date: new Date().toISOString().split("T")[0],
      status: "Menunggu Balasan",
      messages: [
        {
          sender: "user",
          text: newTicketText,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }
      ]
    };

    setTickets(prev => [newTkt, ...prev]);
    setSelectedTicket(newTkt);
    setNewTicketSubject("");
    setNewTicketText("");
    setIsCreatingTicket(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Tickets List, col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex flex-col h-[550px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Daftar Konsultasi Aktif
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingTicket(true)}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Baru</span>
              </button>
            </div>

            {/* Ticket List Body */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 hide-scrollbar">
              {tickets.map(tkt => {
                const isSelected = selectedTicket && selectedTicket.id === tkt.id;
                const lastMsg = tkt.messages[tkt.messages.length - 1];
                return (
                  <div
                    key={tkt.id}
                    onClick={() => setSelectedTicket(tkt)}
                    className={cn(
                      "p-3.5 rounded-xl border cursor-pointer transition-all text-left",
                      isSelected
                        ? "bg-indigo-50/40 border-indigo-200 shadow-sm"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-black text-slate-400 font-mono tracking-wide">{tkt.id}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0",
                        tkt.status === "Dijawab" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      )}>
                        {tkt.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">{tkt.subject}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{tkt.category} • {tkt.date}</p>
                    {lastMsg && (
                      <p className="text-[10px] text-slate-500 mt-2 truncate bg-slate-50 p-1.5 rounded-md italic">
                        "{lastMsg.text}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Chat Screen, col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex flex-col h-[550px]">
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-600 font-mono">{selectedTicket.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-xs">{selectedTicket.subject}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedTicket.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const closed = tickets.map(t => t.id === selectedTicket.id ? { ...t, status: "Selesai" } : t);
                      setTickets(closed);
                      setSelectedTicket(closed.find(t => t.id === selectedTicket.id));
                    }}
                    className="px-2 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-wider transition-all"
                  >
                    Selesaikan Tiket
                  </button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3.5 px-1 hide-scrollbar">
                  {selectedTicket.messages.map((msg: any, mIdx: number) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div
                        key={mIdx}
                        className={cn(
                          "flex flex-col max-w-[80%] rounded-2xl p-3.5 text-xs shadow-sm",
                          isUser
                            ? "bg-indigo-600 text-white ml-auto rounded-tr-none"
                            : "bg-slate-100 text-slate-800 mr-auto rounded-tl-none border border-slate-200/50"
                        )}
                      >
                        <span className={cn("text-[8px] font-bold block mb-1 opacity-60 uppercase tracking-wider font-mono", isUser ? "text-indigo-100 text-right" : "text-slate-500")}>
                          {isUser ? "Anda (Pengelola)" : "PUPR Garut - Operator"}
                        </span>
                        <p className="leading-relaxed whitespace-pre-line font-medium">{msg.text}</p>
                        <span className={cn("text-[8px] block mt-1.5 opacity-40 font-mono", isUser ? "text-right" : "text-left")}>
                          {msg.time}
                        </span>
                      </div>
                    );
                  })}

                  {/* Typing Loader Indicator */}
                  {currentChatReplyText === "operator-typing" && (
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200/50 rounded-2xl rounded-tl-none p-3.5 text-xs max-w-sm mr-auto shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      <span className="font-semibold italic">Petugas sedang mengetik tanggapan...</span>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const inp = e.currentTarget.elements.namedItem("message") as HTMLInputElement;
                    if (inp && inp.value.trim()) {
                      handleSendMessage(inp.value);
                      inp.value = "";
                    }
                  }}
                  className="border-t border-slate-100 pt-3 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    name="message"
                    autoComplete="off"
                    placeholder="Ketik pertanyaan teknis atau keluhan berkas Anda di sini..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                    disabled={currentChatReplyText === "operator-typing"}
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all flex items-center justify-center shadow-md active:scale-95 shrink-0"
                    disabled={currentChatReplyText === "operator-typing"}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Utas Konsultasi Kosong</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Silakan pilih salah satu tiket konsultasi di sebelah kiri untuk melihat pesan, atau klik tombol <strong>"Baru"</strong> untuk mengajukan topik konsultasi teknis baru.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: New Ticket Form */}
      <AnimatePresence>
        {isCreatingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingTicket(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-hidden text-slate-700 border border-slate-100 z-10"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Ajukan Konsultasi Teknis Baru</h3>
                <button onClick={() => setIsCreatingTicket(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Kategori Konsultasi:</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-slate-800"
                  >
                    <option value="Kerusakan Struktur">Kerusakan Struktur (Kolom, Balok, Pondasi)</option>
                    <option value="Kerusakan Arsitektur">Kerusakan Arsitektur (Kusen, Plafon, Atap, Lantai)</option>
                    <option value="Kerusakan Utilitas">Kerusakan Utilitas (Sanitasi, Kelistrikan, Air Bersih)</option>
                    <option value="Administrasi & Berkas">Administrasi & Berkas (Surat Permohonan, SPTJM, SK)</option>
                    <option value="Sistem & Akun">Pertanyaan Teknis Aplikasi / Akun</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Topik / Subjek Pertanyaan:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Keretakan plat atap dak cor beton bocor..."
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Uraian / Pesan Pertanyaan Lengkap:</label>
                  <textarea
                    placeholder="Jelaskan secara rinci detail temuan kerusakan fisik, keluhan berkas, lokasi kelas, atau pertanyaan yang ingin dikonsultasikan kepada operator dinas PUPR..."
                    value={newTicketText}
                    onChange={(e) => setNewTicketText(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTicket(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
                  >
                    Kirim Pertanyaan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
