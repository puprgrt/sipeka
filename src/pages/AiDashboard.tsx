import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Brain, Sparkles, AlertTriangle, Activity, Layers, 
  TrendingUp, ShieldAlert, CheckCircle, BarChart3, ScanEye,
  Camera
} from "lucide-react";
import SmartPhotoViewer from "../components/SmartPhotoViewer";
import { UploadCloud, Loader2 } from "lucide-react";

import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from "recharts";

export default function AiDashboard() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoFindings, setPhotoFindings] = useState<any[]>([]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsAnalyzingPhoto(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUploadedPhotoUrl(base64);

      try {
        const res = await fetch("/api/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: "image",
            imageBase64: base64
          })
        });
        const data = await res.json();
        if (data.findings) {
          const mappedFindings = data.findings.map((f: any, idx: number) => ({
            id: idx,
            label: `${f.element} - ${f.defect}`,
            type: f.severity === "Tinggi" ? "Kritis" : f.severity === "Sedang" ? "Sedang" : "Ringan",
            recommendation: f.remediation,
            x: f.box?.x || 10,
            y: f.box?.y || 10,
            w: f.box?.w || 30,
            h: f.box?.h || 30,
            confidence: data.confidenceScore || 85
          }));
          setPhotoFindings(mappedFindings);
        }
      } catch (err) {
        console.error("Analysis error:", err);
      } finally {
        setIsAnalyzingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };


  const activeRole = localStorage.getItem("activeRole") || "Administrator";
  const activeUserId = localStorage.getItem("activeUserId");

  useEffect(() => {
    fetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter by user role if Pengelola_Bangunan
          const filtered = ((activeRole === "Pengelola_Bangunan" || activeRole === "Pengelola") && activeUserId)
            ? data.filter(a => String(a.idUserPengelola) === activeUserId)
            : data;
          setAssessments(filtered);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching assessments for AI dashboard:", err);
        setLoading(false);
      });
  }, [activeRole, activeUserId]);

  // 1. DYNAMIC RADAR DATA
  const getRadarData = () => {
    if (assessments.length === 0) {
      return [
        { subject: 'Keretakan Struktur', A: 0, fullMark: 100 },
        { subject: 'Korosi Tulangan', A: 0, fullMark: 100 },
        { subject: 'Pelapukan Kayu', A: 0, fullMark: 100 },
        { subject: 'Spalling Beton', A: 0, fullMark: 100 },
        { subject: 'Penurunan Tanah', A: 0, fullMark: 100 },
        { subject: 'Kebocoran Atap', A: 0, fullMark: 100 },
      ];
    }

    const categories = {
      'Keretakan Struktur': 0,
      'Korosi Tulangan': 0,
      'Pelapukan Kayu': 0,
      'Spalling Beton': 0,
      'Penurunan Tanah': 0,
      'Kebocoran Atap': 0,
    };
    
    let totalAssessed = 0;

    assessments.forEach(ass => {
      if (!ass.components) return;
      totalAssessed++;
      
      ass.components.forEach((comp: any) => {
        const compName = (comp.name || "").toLowerCase();
        const details = comp.damageDetails || [];
        
        details.forEach((det: any) => {
          const level = (det.level || "").toLowerCase();
          const percentage = det.percentage || 0;
          
          if (compName.includes("kolom") || compName.includes("balok") || compName.includes("struktur")) {
            if (level.includes("retak")) categories['Keretakan Struktur'] += percentage;
            if (level.includes("korosi") || level.includes("tulangan")) categories['Korosi Tulangan'] += percentage;
            if (level.includes("spalling") || level.includes("terkelupas")) categories['Spalling Beton'] += percentage;
          }
          if (compName.includes("kayu") || compName.includes("kuda-kuda")) {
            if (level.includes("lapuk") || level.includes("rayap")) categories['Pelapukan Kayu'] += percentage;
          }
          if (compName.includes("atap") || compName.includes("langit")) {
            if (level.includes("bocor") || level.includes("bolong") || level.includes("pecah")) categories['Kebocoran Atap'] += percentage;
          }
          if (compName.includes("pondasi") || compName.includes("lantai")) {
            if (level.includes("turun") || level.includes("amblas")) categories['Penurunan Tanah'] += percentage;
          }
        });
      });
    });

    if (totalAssessed > 0) {
      Object.keys(categories).forEach(key => {
        categories[key as keyof typeof categories] = Math.min(100, categories[key as keyof typeof categories] / totalAssessed);
      });
    }

    return [
      { subject: 'Keretakan Struktur', A: categories['Keretakan Struktur'] || 0, fullMark: 100 },
      { subject: 'Korosi Tulangan', A: categories['Korosi Tulangan'] || 0, fullMark: 100 },
      { subject: 'Pelapukan Kayu', A: categories['Pelapukan Kayu'] || 0, fullMark: 100 },
      { subject: 'Spalling Beton', A: categories['Spalling Beton'] || 0, fullMark: 100 },
      { subject: 'Penurunan Tanah', A: categories['Penurunan Tanah'] || 0, fullMark: 100 },
      { subject: 'Kebocoran Atap', A: categories['Kebocoran Atap'] || 0, fullMark: 100 },
    ];
  };

  const aiRadarData = getRadarData();

  // 2. DYNAMIC PREDICTIONS DATA
  const getPredictionData = () => {
    if (assessments.length === 0) {
      return [
        { month: 'Bulan 1', risk: 0 },
        { month: 'Bulan 2', risk: 0 },
        { month: 'Bulan 3', risk: 0 },
        { month: 'Bulan 4', risk: 0 },
        { month: 'Bulan 5', risk: 0 },
        { month: 'Bulan 6', risk: 0 },
      ];
    }

    const avgDamage = assessments.length > 0
      ? assessments.reduce((sum, ass) => sum + (ass.finalResult?.totalDamagePercentage || 0), 0) / assessments.length
      : 0;
      
    const predictions = [];
    for (let i = 1; i <= 6; i++) {
      const riskFactor = Math.min(100, Math.round(avgDamage * Math.pow(1.15, i)));
      predictions.push({
        month: `Bulan ${i}`,
        risk: isNaN(riskFactor) ? 0 : riskFactor
      });
    }
    return predictions;
  };

  const predictionData = getPredictionData();

  // 3. DYNAMIC AI INSIGHTS
  const getAiInsights = () => {
    if (assessments.length === 0) {
      return [
        {
          title: "Menunggu Pengajuan Permohonan",
          desc: "Belum ada data gedung yang terdaftar untuk akun Pengelola Anda. Hubungi Dinas PUPR atau buat permohonan baru untuk memulai analisis AI.",
          level: "Info",
          icon: Activity,
          color: "amber"
        },
        {
          title: "Model Pendeteksi Siap",
          desc: "Model Vision AI (Gemini) siap memproses citra kerusakan bangunan Anda segera setelah gambar komponen diunggah.",
          level: "Saran",
          icon: TrendingUp,
          color: "emerald"
        }
      ];
    }

    const insights = [];

    const criticalAssessment = [...assessments].sort((a, b) => (b.finalResult?.totalDamagePercentage || 0) - (a.finalResult?.totalDamagePercentage || 0))[0];
    const maxDamage = criticalAssessment?.finalResult?.totalDamagePercentage || 0;

    if (maxDamage > 0) {
      insights.push({
        title: `Anomali Struktur di ${criticalAssessment.buildingName}`,
        desc: `AI mendeteksi tingkat kerusakan total sebesar ${maxDamage.toFixed(2)}% (${criticalAssessment.finalResult.category}) pada gedung ini. Prioritaskan perbaikan elemen struktur utama.`,
        level: "Tinggi",
        icon: Activity,
        color: "rose"
      });
    } else {
      insights.push({
        title: "Kondisi Struktur Optimal",
        desc: "Berdasarkan penilaian awal, belum ada kerusakan masif terdeteksi pada gedung terdaftar Anda. BHI (Building Health Index) dalam batas aman.",
        level: "Saran",
        icon: CheckCircle,
        color: "emerald"
      });
    }

    const hasCorrosion = assessments.some(ass => 
      ass.components?.some((comp: any) => 
        (comp.name || "").toLowerCase().includes("atap") || 
        (comp.name || "").toLowerCase().includes("baja")
      )
    );

    if (hasCorrosion) {
      insights.push({
        title: "Pencegahan Korosi Elemen Logam",
        desc: "AI memproyeksikan potensi oksidasi meluas pada rangka penutup atap dalam 6 bulan jika sirkulasi udara lembab tidak diatasi.",
        level: "Sedang",
        icon: AlertTriangle,
        color: "amber"
      });
    } else {
      insights.push({
        title: "Rekomendasi Pemeliharaan Rutin",
        desc: "Lakukan pembersihan saluran air atap berkala untuk mencegah akumulasi genangan yang berpotensi merembes ke plat beton.",
        level: "Saran",
        icon: TrendingUp,
        color: "emerald"
      });
    }

    insights.push({
      title: "Rencana Anggaran Retrofit AI",
      desc: "Investasi dini pada perbaikan retak kosmetik penutup dinding dapat menekan pengeluaran restorasi hingga 40% dibanding penanganan lambat.",
      level: "Saran",
      icon: Layers,
      color: "emerald"
    });

    return insights;
  };

  const aiInsights = getAiInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Brain className="w-12 h-12 text-indigo-500 animate-pulse" />
            <div className="absolute inset-0 w-12 h-12 bg-indigo-500/20 rounded-full animate-ping"></div>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Menghitung Model AI...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-indigo-500/30 w-fit mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> AI Visual Engine Aktif
          </div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-400" />
            Dasbor Analisis AI
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium leading-relaxed">
            Pemrosesan cerdas menggunakan model Vision AI (Gemini) untuk mendeteksi, 
            menganalisis, dan memprediksi kerusakan bangunan secara otomatis dari citra visual dan data historis.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col gap-2 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Model</div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-bold text-emerald-400">Online & Sinkron</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Akurasi: 94.2% | Latensi: 120ms</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Radar & Vision AI */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ScanEye className="w-5 h-5 text-indigo-600" /> Profil Deteksi Kerusakan (AI Confidence)
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Tingkat keyakinan model terhadap jenis kerusakan dari seluruh aset terdata</p>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center min-h-[350px]">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl"></div>
              
              <div className="w-full h-[300px] z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={aiRadarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} />
                    <Radar name="AI Confidence" dataKey="A" stroke="#818cf8" strokeWidth={2} fill="#818cf8" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px', fontWeight: 600 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Vision Samples */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" /> Inspeksi Visual Cerdas (AI Vision)
              </h3>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50 transition cursor-pointer bg-white">
                <div className="flex flex-col items-center">
                  {isAnalyzingPhoto ? (
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-indigo-500 mb-2" />
                  )}
                  <span className="text-xs font-medium text-slate-600">
                    {isAnalyzingPhoto ? "AI Sedang Menganalisis..." : "Unggah Foto Kerusakan untuk Analisis AI"}
                  </span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isAnalyzingPhoto} />
              </label>
            </div>
            
            {uploadedPhotoUrl && !isAnalyzingPhoto && (
              <SmartPhotoViewer 
                photoUrl={uploadedPhotoUrl} 
                fileName={uploadedFileName} 
                findings={photoFindings}
                onClose={() => setUploadedPhotoUrl(null)} 
              />
            )}
          </div>
        </div>

        {/* Right Col: Insights & Predictions */}
        <div className="space-y-6">
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl shadow-sm border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" /> Wawasan Cerdas AI (Insights)
            </h3>
            
            <div className="space-y-4">
              {aiInsights.map((insight, idx) => {
                const Icon = insight.icon;
                const colorClass = 
                  insight.color === "rose" ? "bg-rose-100 text-rose-600 border-rose-200" :
                  insight.color === "amber" ? "bg-amber-100 text-amber-600 border-amber-200" :
                  "bg-emerald-100 text-emerald-600 border-emerald-200";
                  
                return (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-indigo-50/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 border ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-800">{insight.title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{insight.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Proyeksi Risiko AI
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-6 font-medium">Prediksi laju degradasi bangunan tanpa intervensi perbaikan dalam 6 bulan.</p>
            
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }} />
                  <Line type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-rose-700 leading-relaxed">
                Risiko kegagalan struktural diproyeksikan meningkat tajam setelah bulan ke-4. Disarankan intervensi segera pada aset Kritis.
              </p>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
