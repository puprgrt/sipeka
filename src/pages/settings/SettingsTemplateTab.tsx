import { useState, useEffect } from "react";
import { Edit2, Loader2, Save, X, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

interface SettingsTemplateTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsTemplateTab({ onToast }: SettingsTemplateTabProps) {
  const [docTemplates, setDocTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateContent, setEditingTemplateContent] = useState("");
  const [editingTemplateDriveLink, setEditingTemplateDriveLink] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => { fetchDocTemplates(); }, []);

  const fetchDocTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/document-templates");
      const data = await res.json();
      setDocTemplates(data);
    } catch (error) {
      console.error("Gagal mengambil template dokumen", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveTemplate = async (templateId: string, kontenHtml: string, driveLink: string) => {
    setSavingTemplate(true);
    try {
      const res = await fetch(`/api/document-templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontenHtml, driveLink })
      });
      const updated = await res.json();
      setDocTemplates(prev => prev.map(t => t.id === templateId ? { ...t, ...updated } : t));
      setEditingTemplateId(null);
      setEditingTemplateContent("");
      setEditingTemplateDriveLink("");
      onToast(`Template "${updated.nama}" berhasil disimpan!`);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = async (templateId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin mereset template ini ke versi default? Perubahan Anda akan hilang.")) return;
    try {
      const res = await fetch(`/api/document-templates/${templateId}/reset`, { method: "POST" });
      const updated = await res.json();
      setDocTemplates(prev => prev.map(t => t.id === templateId ? { ...t, ...updated } : t));
      if (editingTemplateId === templateId) {
        setEditingTemplateContent(updated.kontenHtml);
        setEditingTemplateDriveLink(updated.driveLink || "");
      }
      onToast(`Template "${updated.nama}" berhasil direset ke default!`);
    } catch (error) {
      console.error(error);
      alert("Gagal mereset template");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pusat Template Dokumen</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Kelola template HTML untuk fitur Export PDF di aplikasi
          </p>
        </div>
      </div>

      {loadingTemplates ? (
        <div className="py-12 text-center text-slate-500 font-medium">Memuat template dokumen...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {docTemplates.map(template => (
            <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{template.nama}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{template.deskripsi}</p>
                </div>
                <div className="flex gap-2">
                  {editingTemplateId === template.id ? (
                    <>
                      <button onClick={() => setEditingTemplateId(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Batal</button>
                      <button onClick={() => handleSaveTemplate(template.id, editingTemplateContent, editingTemplateDriveLink)} disabled={savingTemplate} className="px-3 py-1.5 bg-pu-blue text-white rounded-lg text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 disabled:opacity-50">
                        {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan HTML
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingTemplateId(template.id); setEditingTemplateContent(template.kontenHtml); setEditingTemplateDriveLink(template.driveLink || ""); }} className="px-3 py-1.5 border border-pu-blue text-pu-blue rounded-lg text-xs font-bold hover:bg-blue-50 flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Edit Template
                    </button>
                  )}
                </div>
              </div>

              {editingTemplateId === template.id ? (
                <div className="p-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link Google Drive (Opsional)</label>
                    <input type="text" value={editingTemplateDriveLink} onChange={e => setEditingTemplateDriveLink(e.target.value)} placeholder="Tautan ke format Word/Excel asli..." className="w-full text-xs p-2 rounded-lg border border-slate-200 font-mono focus:border-pu-blue focus:ring-pu-blue" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HTML Editor</label>
                      <button onClick={() => handleResetTemplate(template.id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 underline">Reset ke Default Sistem</button>
                    </div>
                    <textarea value={editingTemplateContent} onChange={e => setEditingTemplateContent(e.target.value)} rows={20} className="w-full text-xs font-mono p-4 rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:border-pu-blue focus:ring-pu-blue" />
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Hati-hati saat mengedit struktur tabel dan class name. Pastikan tag HTML ditutup dengan benar.</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {template.driveLink ? (
                    <a href={template.driveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-pu-blue hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                      <ExternalLink className="w-4 h-4" /> Buka Folder Drive Template
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Belum ada link drive disematkan. Format dokumen dicetak menggunakan template HTML di bawah.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
