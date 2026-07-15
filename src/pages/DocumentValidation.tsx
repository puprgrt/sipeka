import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Building, User, Calendar, FileCheck } from "lucide-react";

export function DocumentValidation() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We can use the existing assessment log/detail endpoint or create a specific one
    // We'll use the existing /api/assessments/:id endpoint
    fetch(`/api/assessments/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Document not found");
        return res.json();
      })
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Dokumen tidak ditemukan atau ID tidak valid.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Memverifikasi keaslian dokumen...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8 border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Dokumen Tidak Valid</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const tte = data.tteSignatures ? (typeof data.tteSignatures === 'string' ? JSON.parse(data.tteSignatures) : data.tteSignatures) : {};
  const tteArray = Object.entries(tte).map(([role, tteData]: any) => ({ role, ...tteData }));

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white/10">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 relative z-10">Dokumen Valid</h1>
            <p className="text-blue-100 relative z-10">Dokumen ini diterbitkan secara resmi oleh Dinas PUPR Kab. Garut</p>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-2">Informasi Bangunan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-blue-500"><Building className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Nama Instansi/Sekolah</p>
                      <p className="font-semibold text-slate-700 text-sm">{data.schoolName}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-blue-500"><Building className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Nama Bangunan</p>
                      <p className="font-semibold text-slate-700 text-sm">{data.buildingName}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-blue-500"><Calendar className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Tgl. Pengajuan</p>
                      <p className="font-semibold text-slate-700 text-sm">{new Date(data.date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-2">Riwayat Tanda Tangan Elektronik</h3>
                {tteArray.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Belum ada TTE terdaftar pada dokumen ini.</p>
                ) : (
                  <div className="space-y-4">
                    {tteArray.map((sig: any, index: number) => (
                      <div key={index} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
                          <img src={sig.qrCodeUrl} alt="QR" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{sig.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">
                              {sig.role.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(sig.timestamp).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
          <div className="bg-slate-50 p-6 text-center border-t border-slate-200">
            <p className="text-xs text-slate-500">Sistem Informasi Penilaian Kerusakan Bangunan (SIPEKA)<br/>Dinas PUPR Kabupaten Garut</p>
          </div>
        </div>
      </div>
    </div>
  );
}
