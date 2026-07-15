import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { MapPin, Paintbrush, X, CloudUpload, Camera, AlertCircle, CheckCircle, Plus } from "lucide-react";

interface BuildingParam {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea';
  placeholder: string;
  required: boolean;
  enabled: boolean;
}

interface BuildingInfoStepProps {
  formParams: BuildingParam[];
  dynamicValues: Record<string, any>;
  handleFieldChange: (id: string, value: any) => void;
  coordinates: { lat: number; lng: number } | null;
  handleGetLocation: () => void;
  photos: string[];
  setSmartPreviewPhoto: (photo: { url: string, componentName: string } | null) => void;
  setAnnotatingPhotoUrl: (url: string) => void;
  setAnnotatingContext: (ctx: any) => void;
  setIsAnnotatorOpen: (open: boolean) => void;
  removePhoto: (idx: number) => void;
  uploadingPhoto: boolean;
  handlePhotoUpload: (e: any, targetIdx?: number) => void;
  setStep: (step: number) => void;
  isPermohonanFlow: boolean;
}

export default function BuildingInfoStep({
  formParams,
  dynamicValues,
  handleFieldChange,
  coordinates,
  handleGetLocation,
  photos,
  setSmartPreviewPhoto,
  setAnnotatingPhotoUrl,
  setAnnotatingContext,
  setIsAnnotatorOpen,
  removePhoto,
  uploadingPhoto,
  handlePhotoUpload,
  setStep,
  isPermohonanFlow
}: BuildingInfoStepProps) {
  const missing: { label: string }[] = [];
  formParams.forEach(param => {
    const val = dynamicValues[param.id];
    if (param.required) {
      if (param.type === 'number') {
        if (val === undefined || val === "" || Number(val) <= 0) {
          missing.push({ label: param.label });
        }
      } else {
        if (!val || !val.toString().trim()) {
          missing.push({ label: param.label });
        }
      }
    }
  });
  if (!coordinates) {
    missing.push({ label: "Koordinat GPS" });
  }
  if (photos.length < 4) {
    missing.push({ label: "4 Sisi Foto Bangunan (Depan, Belakang, Kanan, Kiri)" });
  }

  const hasMissing = missing.length > 0;

  return (
    <motion.div 
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
    >
      <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
        <h3 className="text-sm font-bold text-slate-800">INFORMASI UMUM BANGUNAN</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formParams.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-slate-500 font-medium animate-pulse">
              Memuat parameter formulir dinamis...
            </div>
          ) : (
            formParams.map((param) => {
              const val = dynamicValues[param.id] !== undefined ? dynamicValues[param.id] : "";
              const isRequired = param.required;

              return (
                <div key={param.id} className={cn(param.type === "textarea" ? "md:col-span-2" : "")}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    {param.label} {isRequired && <span className="text-rose-500">*</span>}
                    {param.id === "floorCount" && (
                      <span className="text-[9px] bg-blue-100 text-pu-blue px-2 py-0.5 rounded-full ml-2">
                        Form {val === 1 ? 'A' : val === 2 ? 'B' : 'C'} Otomatis
                      </span>
                    )}
                  </label>
                  {param.type === "textarea" ? (
                    <textarea
                      value={val}
                      onChange={(e) => handleFieldChange(param.id, e.target.value)}
                      placeholder={param.placeholder}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200/50 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-sm p-3 text-slate-800 font-medium bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors focus:bg-white"
                    />
                  ) : (
                    <input
                      type={param.type === "number" ? "number" : "text"}
                      min={param.id === "floorCount" ? "1" : undefined}
                      value={val}
                      onChange={(e) => handleFieldChange(param.id, param.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                      placeholder={param.placeholder}
                      className="w-full rounded-xl border border-slate-200/50 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-sm p-3 text-slate-800 font-medium bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors focus:bg-white"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4 pt-6 mt-6 border-t border-white/30">
          <h3 className="text-sm font-bold text-slate-800">LOKASI & DOKUMENTASI</h3>
          
          <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between border border-white/50 shadow-inner">
          <div className="mb-4 md:mb-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Koordinat GPS</p>
            <p className="text-sm font-mono font-medium text-slate-700 mt-1">
              {coordinates ? `LAT ${coordinates.lat.toFixed(6)}, LONG ${coordinates.lng.toFixed(6)}` : "Lokasi belum diambil"}
            </p>
          </div>
          <button type="button" onClick={handleGetLocation} className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-md text-pu-blue bg-blue-100 hover:bg-blue-200 transition-colors">
            <MapPin className="mr-2 h-4 w-4" /> Ambil Lokasi
          </button>
        </div>
        
        {/* GAMBAR DENAH BANGUNAN */}
        <div className="mt-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Gambar Denah Bangunan</label>
          <div className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
            {dynamicValues?.floorPlanImage ? (
              <>
                <img src={dynamicValues.floorPlanImage} alt="Denah Bangunan" className="w-full h-auto max-h-[400px] object-contain cursor-pointer bg-white" onClick={() => setSmartPreviewPhoto({ url: dynamicValues.floorPlanImage, componentName: 'Denah Bangunan' })} />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleFieldChange("floorPlanImage", null)} 
                    className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition-all hover:scale-110 shadow cursor-pointer"
                    title="Hapus"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <label className={cn("flex-1 flex flex-col items-center justify-center text-slate-500 w-full h-full p-6 hover:bg-white/40 hover:text-slate-800 hover:border-pu-blue transition-all cursor-pointer bg-white/20 backdrop-blur-sm", uploadingPhoto && "opacity-50 cursor-not-allowed")}>
                <Camera className="h-6 w-6 mb-2 opacity-50" />
                <span className="text-xs font-semibold">Unggah Denah Bangunan</span>
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  disabled={uploadingPhoto}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleFieldChange("floorPlanImage", reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Foto Kondisi Bangunan (Wajib 4 Sisi)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 4 Required Slots */}
            {['Depan', 'Belakang', 'Samping Kanan', 'Samping Kiri'].map((label, idx) => {
              const photo = photos[idx];
              return (
                <div key={`req-${idx}`} className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-square shadow-sm flex flex-col">
                  <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-md">Tampak {label}</div>
                  {photo ? (
                    <>
                      <img src={photo} alt={`Foto ${label}`} className="w-full h-full object-cover cursor-pointer" onClick={() => setSmartPreviewPhoto({ url: photo, componentName: `Tampak ${label}` })} />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setAnnotatingPhotoUrl(photo);
                            setAnnotatingContext({ type: "main", photoIdx: idx });
                            setIsAnnotatorOpen(true);
                          }}
                          className="bg-pu-yellow hover:bg-yellow-400 text-slate-950 p-2 rounded-xl transition-all hover:scale-110 shadow cursor-pointer"
                          title="Coret / Anotasi"
                        >
                          <Paintbrush className="h-4 w-4 stroke-[2.5]" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removePhoto(idx)} 
                          className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition-all hover:scale-110 shadow cursor-pointer"
                          title="Hapus"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className={cn("flex-1 flex flex-col items-center justify-center text-slate-500 hover:bg-white/40 hover:text-slate-800 hover:border-pu-blue transition-all cursor-pointer bg-white/20 backdrop-blur-sm", uploadingPhoto && "opacity-50 cursor-not-allowed")}>
                      {uploadingPhoto ? (
                        <CloudUpload className="h-6 w-6 mb-1.5 animate-bounce text-pu-blue" />
                      ) : (
                        <Camera className="h-6 w-6 mb-1.5 opacity-50" />
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-center px-1">{uploadingPhoto ? "Mengunggah..." : `Unggah`}</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, idx)} disabled={uploadingPhoto} />
                    </label>
                  )}
                </div>
              );
            })}

            {/* Extra Photos */}
            {photos.slice(4).map((photo, j) => {
              const idx = j + 4;
              return (
                <div key={`extra-${idx}`} className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-square shadow-sm flex flex-col">
                  <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-md">Tambahan {j+1}</div>
                  <img src={photo} alt={`Foto Tambahan ${j+1}`} className="w-full h-full object-cover cursor-pointer" onClick={() => setSmartPreviewPhoto({ url: photo, componentName: 'Informasi Umum' })} />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setAnnotatingPhotoUrl(photo);
                        setAnnotatingContext({ type: "main", photoIdx: idx });
                        setIsAnnotatorOpen(true);
                      }}
                      className="bg-pu-yellow hover:bg-yellow-400 text-slate-950 p-2 rounded-xl transition-all hover:scale-110 shadow cursor-pointer"
                      title="Coret / Anotasi"
                    >
                      <Paintbrush className="h-4 w-4 stroke-[2.5]" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => removePhoto(idx)} 
                      className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition-all hover:scale-110 shadow cursor-pointer"
                      title="Hapus"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            <label className={cn("border-2 border-dashed border-slate-300/50 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-white/40 hover:text-slate-800 hover:border-pu-blue transition-all cursor-pointer aspect-square shadow-inner bg-white/20 backdrop-blur-sm", uploadingPhoto && "opacity-50 cursor-not-allowed")}>
              {uploadingPhoto ? (
                <>
                  <CloudUpload className="h-8 w-8 mb-2 animate-bounce text-pu-blue" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Mengunggah...</span>
                </>
              ) : (
                <>
                  <Plus className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2 opacity-70">Foto Lainnya</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e)} disabled={uploadingPhoto} />
            </label>
          </div>
        </div>
      </div>
      </div>
      
      {/* Validation Notice & Proceed Button */}
      <div className="p-6 border-t border-white/30 bg-white/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1">
          {hasMissing ? (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50/80 backdrop-blur-sm border border-rose-150 px-4 py-2.5 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold uppercase tracking-wide">Data Belum Lengkap:</span>
                <p className="mt-0.5 text-slate-600 font-medium leading-relaxed">
                  Lengkapi {missing.map(m => m.label).join(", ")} terlebih dahulu sebelum melanjutkan.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/80 backdrop-blur-sm border border-emerald-150 px-4 py-2.5 rounded-xl text-xs font-semibold">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Seluruh data formulir wajib telah terisi dengan benar. Siap dikirim!</span>
            </div>
          )}
        </div>
        <div className="flex justify-end flex-shrink-0">
          <button 
            onClick={() => {
              if (!hasMissing) {
                setStep(2);
              }
            }} 
            disabled={hasMissing}
            className={cn(
              "inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl shadow-md transition-all",
              hasMissing 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/30" 
                : "text-pu-blue bg-pu-yellow hover:bg-yellow-400 hover:scale-105 active:scale-95"
            )}
          >
            {isPermohonanFlow ? "Lanjut ke Penilaian" : "Lanjut ke Uji Keselamatan"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
