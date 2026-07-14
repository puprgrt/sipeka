import React from 'react';
import { motion } from 'motion/react';
import { Printer, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PONDASI_OPTIONS, LISTRIK_OPTIONS, AIR_BERSIH_OPTIONS } from './DamageAnalysisStep';
interface FinalReviewStepProps {
  calculateFinalResult: () => { category: string; totalDamagePercentage: number; [key: string]: any };
  schoolName: string;
  buildingName: string;
  getParamLabel: (id: string, defaultLabel: string) => string;
  npsn: string;
  floorCount: number;
  buildingArea: string | number;
  hasCriticalDamage: boolean;
  setStep: (step: number) => void;
  handleSubmit: () => void;
  submitting: boolean;
  components: any[];
  componentWeights: Record<string, number>;
  DAMAGE_MULTIPLIERS: Record<string, number>;
  allComponentsData: any[];
  safetyChecks: Record<string, boolean>;
}

export default function FinalReviewStep({
  calculateFinalResult,
  schoolName,
  buildingName,
  getParamLabel,
  npsn,
  floorCount,
  buildingArea,
  hasCriticalDamage,
  setStep,
  handleSubmit,
  submitting,
  components,
  componentWeights,
  DAMAGE_MULTIPLIERS,
  allComponentsData,
  safetyChecks
}: FinalReviewStepProps) {
  const result = calculateFinalResult();
  
  return (
<motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
          >
             <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
              <h3 className="text-sm font-bold text-slate-800">RINGKASAN PENILAIAN</h3>
            </div>
            
            <div className="p-12 flex flex-col items-center relative">
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">{schoolName}</h2>
                <p className="text-slate-600 font-medium text-lg">{buildingName}</p>
                
                <div className="mt-4 inline-flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span className="bg-slate-100 px-3 py-1 rounded-full">{getParamLabel("npsn", "NPSN")}: {npsn || '-'}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full">Lantai: {floorCount}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full">Luas: {buildingArea} m²</span>
                </div>
              </div>

              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className={cn(
                  "w-56 h-56 rounded-full flex flex-col items-center justify-center border-[16px] mb-8 shadow-inner backdrop-blur-md",
                  result.category === 'Ringan' ? 'border-green-400/30 bg-green-50/50 text-garut-green' :
                  result.category === 'Sedang' ? 'border-yellow-400/30 bg-yellow-50/50 text-yellow-700' :
                  'border-orange-400/30 bg-orange-50/50 text-garut-orange'
                )}>
                  <span className="text-6xl font-extrabold font-mono tracking-tighter drop-shadow-sm">{result.totalDamagePercentage.toFixed(1)}<span className="text-3xl">%</span></span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "px-8 py-3 rounded-full uppercase text-sm font-bold tracking-widest shadow-md",
                    result.category === 'Ringan' ? 'bg-garut-green text-white' :
                    result.category === 'Sedang' ? 'bg-pu-yellow text-pu-blue' :
                    'bg-garut-orange text-white'
                  )}>
                  Rusak {result.category}
                </motion.div>
              </div>

              {/* Rincian Komponen - Matriks PUPR */}
              <div className="w-full mt-10 mb-6 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm overflow-hidden">
                <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tahap 2 - Hitung Volume Kerusakan Komponen</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-center border-collapse">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="border border-slate-300 p-2 align-middle w-8" rowSpan={2}>NO</th>
                        <th className="border border-slate-300 p-2 align-middle w-24" rowSpan={2}>SISTEM</th>
                        <th className="border border-slate-300 p-2 align-middle text-left w-48" rowSpan={2}>KOMPONEN</th>
                        <th className="border border-slate-300 p-2 align-middle w-16" rowSpan={2}>SATUAN</th>
                        <th className="border border-slate-300 p-2 align-middle w-20" rowSpan={2}>VOLUME SELURUH KOMPONEN</th>
                        <th className="border border-slate-300 p-2" colSpan={8}>TAHAP 2 - HITUNG VOLUME KERUSAKAN KOMPONEN BERDASARKAN KLASIFIKASI KERUSAKAN</th>
                        <th className="border border-slate-300 p-2 align-middle w-40" rowSpan={2}>TAHAP 1 - PENGAMATAN VISUAL ADA TIDAKNYA KERUSAKAN DAN INDIKASI DAMPAK KERUSAKAN</th>
                        <th className="border border-slate-300 p-2" colSpan={8}>PERHITUNGAN TINGKAT KERUSAKAN KOMPONEN</th>
                        <th className="border border-slate-300 p-2 align-middle w-20" rowSpan={2}>BOBOT KOMPONEN</th>
                        <th className="border border-slate-300 p-2 align-middle w-24" rowSpan={2}>TINGKAT KERUSAKAN KOMPONEN THD MASSA BANGUNAN</th>
                      </tr>
                      <tr className="bg-slate-50 text-[9px]">
                        <th className="border border-slate-300 p-1 w-12">Tdk Rusak<br/>1</th>
                        <th className="border border-slate-300 p-1 w-12">Sangat Ringan<br/>2</th>
                        <th className="border border-slate-300 p-1 w-12">Ringan<br/>3</th>
                        <th className="border border-slate-300 p-1 w-12">Sedang<br/>4</th>
                        <th className="border border-slate-300 p-1 w-12">Berat<br/>5</th>
                        <th className="border border-slate-300 p-1 w-12">Sangat Berat<br/>6</th>
                        <th className="border border-slate-300 p-1 w-12">Komponen Tdk Sesuai<br/>7</th>
                        <th className="border border-slate-300 p-1 w-24">Keterangan<br/>8</th>
                        {/* Perhitungan Header */}
                        <th className="border border-slate-300 p-1">1<br/>0.00</th>
                        <th className="border border-slate-300 p-1">2<br/>0.20</th>
                        <th className="border border-slate-300 p-1">3<br/>0.35</th>
                        <th className="border border-slate-300 p-1">4<br/>0.50</th>
                        <th className="border border-slate-300 p-1">5<br/>0.70</th>
                        <th className="border border-slate-300 p-1">6<br/>0.85</th>
                        <th className="border border-slate-300 p-1">7<br/>1.00</th>
                        <th className="border border-slate-300 p-1 font-bold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {Array.from(new Set((allComponentsData || []).map(c => c.kategoriKomponen || 'Struktur'))).map((sistem, sIdx) => {
                        const sistemComps = Object.keys(componentWeights)
                          .filter(name => (componentWeights[name] || 0) > 0)
                          .map(name => allComponentsData?.find(c => c.namaKomponen === name) || { namaKomponen: name, kategoriKomponen: 'Lainnya', satuan: '%' })
                          .filter(c => c.kategoriKomponen === sistem);
                          
                        if (sistemComps.length === 0) return null;
                        
                        return sistemComps.map((cData, cIdx) => {
                          const weight = componentWeights[cData.namaKomponen] || 0;
                          const comp = components.find(c => c.name === cData.namaKomponen);
                          
                          // Get percentages for calculation
                          const pTdkRusak = comp?.damageDetails.find(d => d.level === "Tidak Rusak")?.percentage || 0;
                          const pSgtRingan = comp?.damageDetails.find(d => d.level === "Rusak Sangat Ringan")?.percentage || 0;
                          const pRingan = comp?.damageDetails.find(d => d.level === "Rusak Ringan")?.percentage || 0;
                          const pSedang = comp?.damageDetails.find(d => d.level === "Rusak Sedang")?.percentage || 0;
                          const pBerat = comp?.damageDetails.find(d => d.level === "Rusak Berat")?.percentage || 0;
                          const pSgtBerat = comp?.damageDetails.find(d => d.level === "Rusak Sangat Berat")?.percentage || 0;
                          const pTdkSesuai = comp?.damageDetails.find(d => d.level === "Komponen Tidak Sesuai")?.percentage || 0;

                          // Get volumes for display
                          const vTdkRusak = comp?.damageDetails.find(d => d.level === "Tidak Rusak")?.volume || 0;
                          const vSgtRingan = comp?.damageDetails.find(d => d.level === "Rusak Sangat Ringan")?.volume || 0;
                          const vRingan = comp?.damageDetails.find(d => d.level === "Rusak Ringan")?.volume || 0;
                          const vSedang = comp?.damageDetails.find(d => d.level === "Rusak Sedang")?.volume || 0;
                          const vBerat = comp?.damageDetails.find(d => d.level === "Rusak Berat")?.volume || 0;
                          const vSgtBerat = comp?.damageDetails.find(d => d.level === "Rusak Sangat Berat")?.volume || 0;
                          const vTdkSesuai = comp?.damageDetails.find(d => d.level === "Komponen Tidak Sesuai")?.volume || 0;
                          
                          const unit = comp?.unit || cData.satuan;
                          const renderV = (v: number) => v > 0 ? v.toFixed(unit === '%' || unit === 'Estimasi' ? 0 : 2) + (unit === '%' ? '%' : '') : '';
                          
                          const isMultipleChoice = unit === 'Estimasi';
                          let selectedLabel = "";
                          if (isMultipleChoice) {
                            const activeLevel = comp?.damageDetails.find(d => d.percentage > 0)?.level;
                            if (comp?.name === "Pondasi & Sloof") selectedLabel = PONDASI_OPTIONS.find(o => o.level === activeLevel)?.label || activeLevel || "";
                            else if (comp?.name === "Instalasi Listrik") selectedLabel = LISTRIK_OPTIONS.find(o => o.level === activeLevel)?.label || activeLevel || "";
                            else if (comp?.name === "Instalasi Air Bersih") selectedLabel = AIR_BERSIH_OPTIONS.find(o => o.level === activeLevel)?.label || activeLevel || "";
                          }
                          
                          // Damage level calculations (Volume Fraction * Multiplier)
                          const c1 = (pTdkRusak / 100) * (DAMAGE_MULTIPLIERS["Tidak Rusak"] || 0);
                          const c2 = (pSgtRingan / 100) * (DAMAGE_MULTIPLIERS["Rusak Sangat Ringan"] || 0.20);
                          const c3 = (pRingan / 100) * (DAMAGE_MULTIPLIERS["Rusak Ringan"] || 0.35);
                          const c4 = (pSedang / 100) * (DAMAGE_MULTIPLIERS["Rusak Sedang"] || 0.50);
                          const c5 = (pBerat / 100) * (DAMAGE_MULTIPLIERS["Rusak Berat"] || 0.70);
                          const c6 = (pSgtBerat / 100) * (DAMAGE_MULTIPLIERS["Rusak Sangat Berat"] || 0.85);
                          const c7 = (pTdkSesuai / 100) * (DAMAGE_MULTIPLIERS["Komponen Tidak Sesuai"] || 1.00);
                          
                          const totalCompDamage = Math.min(1.0, c1 + c2 + c3 + c4 + c5 + c6 + c7);
                          const damageTerhadapBangunan = weight * totalCompDamage;
                          
                          const renderC = (c: number) => c > 0 ? c.toFixed(2) : '0,00';
                          const renderPerhitungan = (c: number, p: number) => {
                            if (isMultipleChoice) {
                              return p > 0 ? "1" : "0,00";
                            }
                            return renderC(c);
                          };
                          
                          const getTahap1Label = (compName: string) => {
                            if (compName === "Pondasi & Sloof") return safetyChecks['pondasi'] === true ? "Ada kerusakan" : safetyChecks['pondasi'] === false ? "Tidak ada kerusakan" : "";
                            if (compName === "Kolom") return safetyChecks['kolom'] === true ? "Ada kerusakan" : safetyChecks['kolom'] === false ? "Tidak ada kerusakan" : "";
                            if (compName === "Balok") return safetyChecks['balok'] === true ? "Ada kerusakan" : safetyChecks['balok'] === false ? "Tidak ada kerusakan" : "";
                            if (compName === "Atap") return safetyChecks['atap'] === true ? "Ada kerusakan" : safetyChecks['atap'] === false ? "Tidak ada kerusakan" : "";
                            if (compName === "Dinding / Partisi") return safetyChecks['dinding'] === true ? "Ada kerusakan" : safetyChecks['dinding'] === false ? "Tidak ada kerusakan" : "";
                            return "";
                          };
                          
                          return (
                            <tr key={cData.namaKomponen} className="hover:bg-slate-50 transition-colors">
                              {cIdx === 0 && <td className="border border-slate-200 p-2 font-bold bg-slate-50" rowSpan={sistemComps.length}>{sIdx + 1}</td>}
                              {cIdx === 0 && <td className="border border-slate-200 p-2 font-bold uppercase text-left bg-slate-50" rowSpan={sistemComps.length}>{sistem}</td>}
                              <td className="border border-slate-200 p-2 text-left">{cData.namaKomponen}</td>
                              <td className="border border-slate-200 p-1 text-slate-500">{unit}</td>
                              <td className="border border-slate-200 p-1 font-medium bg-amber-50/30">{comp?.totalVolume ? comp.totalVolume.toFixed(unit === '%' || unit === 'Estimasi' ? 0 : 2) : (unit === '%' ? '100' : '0')}</td>
                              
                              {/* Volumes */}
                              {isMultipleChoice ? (
                                <td colSpan={7} className="border border-slate-200 p-2 bg-amber-50/50 text-xs text-left italic">
                                  {selectedLabel}
                                </td>
                              ) : (
                                <>
                                  <td className="border border-slate-200 p-1 bg-amber-50/50">{renderV(vTdkRusak)}</td>
                                  <td className="border border-slate-200 p-1 bg-amber-50/50">{renderV(vSgtRingan)}</td>
                                  <td className="border border-slate-200 p-1 bg-amber-50/50">{renderV(vRingan)}</td>
                                  <td className="border border-slate-200 p-1 bg-amber-50/50">{renderV(vSedang)}</td>
                                  <td className="border border-slate-200 p-1 bg-amber-50/50">{renderV(vBerat)}</td>
                                  <td className="border border-slate-200 p-1 bg-amber-50/50">{renderV(vSgtBerat)}</td>
                                  <td className="border border-slate-200 p-1 bg-amber-50/50">{renderV(vTdkSesuai)}</td>
                                </>
                              )}
                              <td className="border border-slate-200 p-1 text-[8px] text-slate-400"></td>
                              
                              <td className="border border-slate-200 p-1 text-left px-2 bg-slate-50/50">{getTahap1Label(cData.namaKomponen)}</td>
                              
                              {/* Calculations */}
                              <td className="border border-slate-200 p-1 bg-slate-100/50 text-center font-semibold">{renderPerhitungan(c1, pTdkRusak)}</td>
                              <td className="border border-slate-200 p-1 bg-slate-100/50 text-center font-semibold">{renderPerhitungan(c2, pSgtRingan)}</td>
                              <td className="border border-slate-200 p-1 bg-slate-100/50 text-center font-semibold">{renderPerhitungan(c3, pRingan)}</td>
                              <td className="border border-slate-200 p-1 bg-slate-100/50 text-center font-semibold">{renderPerhitungan(c4, pSedang)}</td>
                              <td className="border border-slate-200 p-1 bg-slate-100/50 text-center font-semibold">{renderPerhitungan(c5, pBerat)}</td>
                              <td className="border border-slate-200 p-1 bg-slate-100/50 text-center font-semibold">{renderPerhitungan(c6, pSgtBerat)}</td>
                              <td className="border border-slate-200 p-1 bg-slate-100/50 text-center font-semibold">{renderPerhitungan(c7, pTdkSesuai)}</td>
                              <td className="border border-slate-200 p-1 font-bold bg-slate-100">{(totalCompDamage * 100).toFixed(0)}%</td>
                              
                              <td className="border border-slate-200 p-1 font-medium bg-slate-200/50">{weight.toFixed(2)}%</td>
                              <td className="border border-slate-200 p-1 font-bold bg-slate-200/50">{damageTerhadapBangunan.toFixed(2)}%</td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                    <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-400">
                      <tr>
                        <td colSpan={24} className="border border-slate-300 p-3 text-right uppercase tracking-wider">TOTAL NILAI KERUSAKAN MASSA BANGUNAN / RUANGAN =</td>
                        <td className="border border-slate-300 p-3 text-center text-pu-blue text-sm">{result.totalDamagePercentage.toFixed(2)}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center w-full p-6 border-t border-white/30 bg-white/20 backdrop-blur-sm print:hidden mt-auto">
                <button onClick={() => setStep(hasCriticalDamage ? 2 : 3)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm hover:bg-white/80 transition-all hover:scale-105 active:scale-95">
                  Ubah Penilaian
                </button>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="inline-flex items-center px-4 py-3 text-sm font-bold rounded-xl shadow-md text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                    <Printer className="mr-2 h-5 w-5" />
                    Cetak PDF
                  </button>
                  <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center px-8 py-3 text-sm font-bold rounded-xl shadow-md text-white bg-garut-green hover:bg-green-600 disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
                    <Save className="mr-2 h-5 w-5" />
                    {submitting ? "Menyimpan..." : "Simpan Laporan"}
                  </button>
                </div>
              </div>
            </motion.div>
  );
}
