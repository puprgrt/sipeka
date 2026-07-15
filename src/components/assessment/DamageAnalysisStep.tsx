import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tooltip } from 'react-tooltip';
import { Info, Plus, Minus, Paintbrush, X, Camera, HelpCircle, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DamageAnalysisStepProps {
  components: any[];
  componentWeights: Record<string, number>;
  allComponentsData: any[];
  permissions: any;
  analyzingAiComp: number | null;
  handleAiAnalysis: (e: any, compIndex: number, compName: string) => void;
  setActiveHelpComponent: (name: string) => void;
  setShowHelpModal: (show: boolean) => void;
  updateComponentMeta: (compIndex: number, field: string, value: any) => void;
  updateComponentDamage: (compIndex: number, level: string, percentage: number, volume: number, volumeInputs: string[]) => void;
  setSmartPreviewPhoto: (photo: { url: string, componentName: string } | null) => void;
  setAnnotatingPhotoUrl: (url: string) => void;
  setAnnotatingContext: (ctx: any) => void;
  setIsAnnotatorOpen: (open: boolean) => void;
  removeComponentPhoto: (compIndex: number, level: string, idx: number) => void;
  handleComponentPhotoUpload: (e: any, compIndex: number, level: string) => void;
  setStep: (step: number) => void;
  isPermohonanFlow: boolean;
  DAMAGE_MULTIPLIERS: Record<string, number>;
  setComponents: React.Dispatch<React.SetStateAction<any[]>>;
}

import { PONDASI_OPTIONS, LISTRIK_OPTIONS, AIR_BERSIH_OPTIONS } from './assessmentConstants';

export default function DamageAnalysisStep({
  components,
  componentWeights,
  allComponentsData,
  permissions,
  analyzingAiComp,
  handleAiAnalysis,
  setActiveHelpComponent,
  setShowHelpModal,
  updateComponentMeta,
  updateComponentDamage,
  setSmartPreviewPhoto,
  setAnnotatingPhotoUrl,
  setAnnotatingContext,
  setIsAnnotatorOpen,
  removeComponentPhoto,
  handleComponentPhotoUpload,
  setStep,
  isPermohonanFlow,
  DAMAGE_MULTIPLIERS,
  setComponents
}: DamageAnalysisStepProps) {
  const isTahap2Complete = components.every(comp => {
    if (comp.safetyImpact) return true;
    if (!comp.damageDetails || comp.damageDetails.length === 0) return false;
    
    // minimal 1 kriteria kerusakan
    if (comp.damageDetails.length === 0) return false;
    
    // kriteria yang diisi wajib melampirkan dokumentasi
    const missingPhotos = comp.damageDetails.some(d => !d.photos || d.photos.length === 0);
    if (missingPhotos) return false;
    
    return true;
  });

  return (
<motion.div 
            key="step-penilaian"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
          >
            <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
              <h3 className="text-sm font-bold text-slate-800">TAHAP 2: PENILAIAN KOMPONEN BANGUNAN</h3>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Evaluasi detail tingkat kerusakan berdasarkan panduan</p>
            </div>
            
            <div className="p-6 space-y-6">
              {components.map((comp, compIndex) => {
                const weight = componentWeights[comp.name] || 0;

                const currentDetails = comp.damageDetails || [];
                const getPercentage = (lvl: string) => currentDetails.find(d => d.level === lvl)?.percentage || 0;
                const compConfig = allComponentsData.find(c => c.namaKomponen === comp.name);

                return (
                <div key={comp.name} className="border border-white/50 bg-white/30 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm relative">
                  <div className="bg-white/40 px-4 py-3 border-b border-white/30 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-bold text-slate-800 text-sm uppercase">{comp.name}</span>
                      {compConfig?.tooltipText && (
                        <>
                          <Info 
                            className="w-4 h-4 text-blue-500 ml-2 cursor-pointer hover:text-blue-700 transition-colors" 
                            data-tooltip-id={`tooltip-${comp.name.replace(/[^a-zA-Z0-9]/g, '_')}`} 
                          />
                          <Tooltip 
                            id={`tooltip-${comp.name.replace(/[^a-zA-Z0-9]/g, '_')}`} 
                            place="top"
                            className="z-50 max-w-xs shadow-xl"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#334155', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                          >
                            <div className="p-1">
                              <p className="text-xs font-medium">{compConfig.tooltipText}</p>
                              {compConfig.tooltipImage && (
                                <img src={compConfig.tooltipImage} alt="Panduan" className="mt-2 w-full h-auto rounded border border-slate-200" />
                              )}
                            </div>
                          </Tooltip>
                        </>
                      )}
                      <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">Bobot: {componentWeights[comp.name] || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/10 space-y-4">

                    {/* Tahap 2 */}
                    <AnimatePresence>
                    {!comp.safetyImpact && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tahap 2: Volume Kerusakan ({compConfig?.satuan || "%"})</p>
                          <div className="flex items-center gap-2">
                            {permissions?.aiEngine && (
                              <label className="cursor-pointer">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleAiAnalysis(e, compIndex, comp.name)}
                                />
                                <div className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  {analyzingAiComp === compIndex ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                      Analisis AI...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                      Analisis AI
                                    </>
                                  )}
                                </div>
                              </label>
                            )}
                            <button 
                              onClick={() => { setActiveHelpComponent(comp.name); setShowHelpModal(true); }}
                              className="flex items-center text-xs font-bold text-pu-blue hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              <HelpCircle className="w-3.5 h-3.5 mr-1" />
                              Panduan Visual
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-4 mb-3 p-3 bg-white/60 rounded-xl border border-slate-200">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Volume Total Komponen (Otomatis)</label>
                            <div className="mt-1 block w-full rounded-lg border border-slate-200/50 bg-slate-100 p-2 text-xs text-slate-500 cursor-not-allowed">
                              {comp.totalVolume || 0}
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Satuan (Otomatis/Manual)</label>
                            <select
                              value={comp.unit || compConfig?.satuan || "m2"}
                              onChange={(e) => updateComponentMeta(compIndex, 'unit', e.target.value)}
                              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-xs"
                            >
                              <option value="m">m (Meter Panjang)</option>
                              <option value="m2">m² (Meter Persegi)</option>
                              <option value="m3">m³ (Meter Kubik)</option>
                              <option value="bh">Buah / Unit</option>
                              <option value="titik">Titik</option>
                              <option value="ls">Lumpsum</option>
                              <option value="%">% (Persen)</option>
                            </select>
                          </div>
                        </div>
                        {["Pondasi & Sloof", "Instalasi Listrik", "Instalasi Air Bersih"].includes(comp.name) ? (
                          <div className="flex flex-col gap-2 bg-white/40 p-4 rounded-xl border border-slate-200/50">
                            <div className="space-y-2">
                              {(comp.name === "Instalasi Listrik" ? LISTRIK_OPTIONS : comp.name === "Instalasi Air Bersih" ? AIR_BERSIH_OPTIONS : PONDASI_OPTIONS).map(opt => {
                                const isSelected = getPercentage(opt.level) > 0;
                                return (
                                  <label key={opt.level} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                      type="radio"
                                      name={`mc-${comp.name}`}
                                      checked={isSelected}
                                      onChange={() => {
                                        setComponents(prev => {
                                          const newComps = [...prev];
                                          const currentComp = { ...newComps[compIndex] };
                                          // Retain all existing photos mapped by level
                                          const existingPhotos = currentComp.damageDetails.reduce((acc, d) => {
                                            acc[d.level] = d.photos || [];
                                            return acc;
                                          }, {} as Record<string, string[]>);
                                          
                                          currentComp.damageDetails = [{
                                            level: opt.level,
                                            percentage: 100,
                                            volume: 1,
                                            volumeInputs: ["1"],
                                            photos: existingPhotos[opt.level] || []
                                          }];
                                          
                                          currentComp.totalVolume = 1;
                                          currentComp.unit = 'Estimasi';
                                          newComps[compIndex] = currentComp;
                                          return newComps;
                                        });
                                      }}
                                      className="mt-0.5"
                                    />
                                    <div className="flex flex-col flex-1 gap-2">
                                      <span className="text-xs text-slate-700">{opt.label}</span>
                                      
                                      {/* Only show photo upload for the selected option */}
                                      {isSelected && (
                                        <div className="mt-2 pt-2 border-t border-blue-200/50 flex flex-col gap-2">
                                          {(currentDetails.find(d => d.level === opt.level)?.photos || []).length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {(currentDetails.find(d => d.level === opt.level)?.photos || []).map((p: string, idx: number) => (
                                                <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 bg-slate-50 group cursor-pointer hover:shadow-sm transition-all" onClick={() => setSmartPreviewPhoto({ url: p, componentName: comp.name })}>
                                                  <img src={p} alt="Foto" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1">
                                                    <button 
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAnnotatingPhotoUrl(p);
                                                        setAnnotatingContext({
                                                          type: "component",
                                                          index: compIndex,
                                                          level: opt.level,
                                                          photoIdx: idx
                                                        });
                                                        setIsAnnotatorOpen(true);
                                                      }}
                                                      className="bg-pu-yellow text-slate-950 p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                                                      title="Coret / Anotasi"
                                                    >
                                                      <Paintbrush className="w-3 h-3 stroke-[2.5]" />
                                                    </button>
                                                    <button 
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeComponentPhoto(compIndex, opt.level, idx);
                                                      }}
                                                      className="bg-rose-500 text-white p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                                                      title="Hapus"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          <label className="cursor-pointer max-w-[120px]">
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              multiple
                                              className="hidden" 
                                              onChange={(e) => handleComponentPhotoUpload(e, compIndex, opt.level)}
                                            />
                                            <div className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-50 text-pu-blue rounded border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm w-full">
                                              <Camera className="h-3 w-3" />
                                              <span className="text-[9px] font-bold">Upload Foto</span>
                                            </div>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {Object.keys(DAMAGE_MULTIPLIERS).filter(k => k !== "Tidak Rusak").map((level) => {
                              const details = currentDetails.find(d => d.level === level);
                              const photos = details?.photos || [];
  
                              return (
                              <div key={level} className="flex flex-col bg-white/40 p-2.5 rounded-xl border border-slate-200/50">
                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 truncate" title={level}>{level}</label>
                                
                                <div className="relative mb-1.5 flex-1">
                                  <label className="text-[9px] font-bold text-slate-500 flex justify-between">
                                    Vol. Rusak
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const currentInputs = details?.volumeInputs || (details?.volume ? [String(details.volume)] : [""]);
                                        const newArr = [...currentInputs, ""];
                                        updateComponentDamage(compIndex, level, details?.percentage || 0, details?.volume || 0, newArr);
                                      }}
                                      className="text-[9px] font-bold text-blue-600 hover:underline flex items-center"
                                    >
                                      <Plus className="w-2.5 h-2.5 mr-0.5" /> Tambah
                                    </button>
                                  </label>
                                  <div className="flex flex-col gap-1 mt-1">
                                    {(details?.volumeInputs || (details?.volume ? [String(details.volume)] : [""])).map((vInput, vIdx, vArr) => (
                                      <div key={vIdx} className="flex gap-1 items-center">
                                        <input 
                                          type="number" 
                                          min="0"
                                          value={vInput}
                                          onChange={(e) => {
                                            const newArr = [...vArr];
                                            newArr[vIdx] = e.target.value;
                                            const totalDamagedVol = newArr.reduce((sum, val) => sum + (Number(val) || 0), 0);
                                            const totalVol = comp.totalVolume || 100;
                                            const pct = totalVol > 0 ? Math.min(100, Math.round(((totalDamagedVol / totalVol) * 100) * 100) / 100) : 0;
                                            updateComponentDamage(compIndex, level, pct, totalDamagedVol, newArr);
                                          }}
                                          placeholder="0"
                                          className="block w-full rounded border border-slate-200/50 focus:border-pu-blue p-1.5 font-mono text-xs" 
                                        />
                                        {vIdx > 0 ? (
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const newArr = vArr.filter((_, i) => i !== vIdx);
                                              const totalDamagedVol = newArr.reduce((sum, val) => sum + (Number(val) || 0), 0);
                                              const totalVol = comp.totalVolume || 100;
                                              const pct = totalVol > 0 ? Math.min(100, Math.round(((totalDamagedVol / totalVol) * 100) * 100) / 100) : 0;
                                              updateComponentDamage(compIndex, level, pct, totalDamagedVol, newArr);
                                            }}
                                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                        ) : (
                                          <span className="text-[9px] text-slate-400 font-bold truncate max-w-[24px]">{comp.unit || compConfig?.satuan || "m2"}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="relative mb-2 mt-1">
                                  <label className="text-[9px] font-bold text-slate-500">% Kerusakan (Otomatis)</label>
                                  <div className="relative mt-1">
                                    <div className="block w-full rounded border border-slate-200/50 bg-slate-100 p-1.5 font-mono text-xs text-slate-500 cursor-not-allowed">
                                      {getPercentage(level) || 0}
                                    </div>
                                    <span className="absolute right-2 top-1.5 text-slate-400 text-[10px] font-bold">%</span>
                                  </div>
                                </div>
  
                                {/* Multi-Photo Upload per Level */}
                                <div className="flex flex-col gap-2">
                                  {photos.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {photos.map((p: string, idx: number) => (
                                        <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 bg-slate-50 group cursor-pointer hover:shadow-sm transition-all" onClick={() => setSmartPreviewPhoto({ url: p, componentName: comp.name })}>
                                          <img src={p} alt="Foto" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1">
                                            <button 
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setAnnotatingPhotoUrl(p);
                                                setAnnotatingContext({
                                                  type: "component",
                                                  index: compIndex,
                                                  level,
                                                  photoIdx: idx
                                                });
                                                setIsAnnotatorOpen(true);
                                              }}
                                              className="bg-pu-yellow text-slate-950 p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                                              title="Coret / Anotasi"
                                            >
                                              <Paintbrush className="w-3 h-3 stroke-[2.5]" />
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeComponentPhoto(compIndex, level, idx);
                                              }}
                                              className="bg-rose-500 text-white p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                                              title="Hapus"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <label className="cursor-pointer">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      multiple
                                      className="hidden" 
                                      onChange={(e) => handleComponentPhotoUpload(e, compIndex, level)}
                                    />
                                    <div className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-50 text-pu-blue rounded border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm w-full">
                                      <Camera className="h-3 w-3" />
                                      <span className="text-[9px] font-bold">Foto</span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )})}
                          </div>
                        )}
                      </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Tahap 3: Panduan Menghitung Volume */}
                    <motion.div 
                      className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Panduan Menghitung Volume</p>
                          <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{compConfig?.tooltipText || "Tidak ada panduan khusus untuk komponen ini."}</p>
                          {compConfig?.tooltipImage && (
                            <img src={compConfig.tooltipImage} alt="Panduan visual" className="mt-3 w-full max-w-sm rounded-lg border border-blue-200/50 shadow-sm object-cover" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20 backdrop-blur-sm flex-wrap gap-4">
            <div className="flex-1">
              {!isTahap2Complete && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50/80 backdrop-blur-sm border border-rose-150 px-4 py-2.5 rounded-xl text-xs font-semibold max-w-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Setiap komponen wajib diisi minimal 1 kriteria kerusakan beserta foto dokumentasinya.</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setStep(2)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm hover:bg-white/80 transition-all hover:scale-105 active:scale-95">
                Kembali
              </button>
              <button 
                onClick={() => setStep(4)} 
                disabled={!isTahap2Complete}
                className={cn(
                  "inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all",
                  isTahap2Complete
                    ? "text-pu-blue bg-pu-yellow hover:bg-yellow-400 hover:scale-105 active:scale-95"
                    : "text-slate-400 bg-slate-200 cursor-not-allowed"
                )}
              >
                {isPermohonanFlow ? "Lanjut ke Surat Permohonan" : "Lihat Ringkasan"}
              </button>
            </div>
          </div>
        </motion.div>
  );
}
