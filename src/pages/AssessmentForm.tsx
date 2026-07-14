import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Assessment, COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI, DAMAGE_MULTIPLIERS, ComponentAssessment } from "../types";
import { MapPin, Camera, Save, AlertCircle, X, CloudUpload, HelpCircle, Printer, Info, CheckCircle, FileText as FileTextIcon, Loader2, Building, Check, ClipboardList, Send, Paintbrush, Plus, Minus } from "lucide-react";
import { cn, getAuditHeaders } from "../lib/utils";
import { addOfflineAssessment, getOfflineAssessments, deleteOfflineAssessment } from "../lib/indexedDbQueue";
import { uploadToDrive } from "../lib/driveService";
import { getAccessToken, googleSignIn, initAuth } from "../lib/firebaseAuth";
import { createDocument } from "../lib/docsService";
import { sendEmail } from "../lib/gmailService";
import { motion, AnimatePresence } from "motion/react";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { User } from "firebase/auth";
import { getRolePermissions } from "../lib/permissions";
import { Sparkles } from "lucide-react";
import BuildingInfoStep from "../components/assessment/BuildingInfoStep";
import SafetyCheckStep from "../components/assessment/SafetyCheckStep";
import DamageAnalysisStep from "../components/assessment/DamageAnalysisStep";
import DocumentGenerationStep from "../components/assessment/DocumentGenerationStep";
import FinalReviewStep from "../components/assessment/FinalReviewStep";

import PhotoAnnotator from "../components/PhotoAnnotator";
import SmartPhotoViewer from "../components/SmartPhotoViewer";


import { useAssessmentForm } from "../hooks/useAssessmentForm";

export default function AssessmentForm() {
  const {
    uploadingPhoto,
    letterConfig,
    setKatalogData,
    handleGetLocation,
    setUser,
    serverConflictData,
    setIdBangunan,
    isDirty,
    setLetterConfig,
    setSchoolName,
    applyLoadedData,
    handleResolveLocalConflict,
    setPreviewTab,
    previewTab,
    draftTime,
    setDinasConfig,
    setComponents,
    setIsGeneratingLetter,
    setAnnotatingPhotoUrl,
    floorCount,
    allComponentsData,
    localConflictItem,
    setAllComponentsData,
    address,
    coordinates,
    navigate,
    annotatingContext,
    getParamLabel,
    setLoadingParams,
    setActiveRole,
    handleGenerateLetter,
    letterReferenceNo,
    setActiveHelpComponent,
    activeRole,
    setLetterReferenceNo,
    loadingParams,
    photos,
    generatedDocLink,
    setServerConflictData,
    user,
    setIsLetterGenerated,
    setUploadingPhoto,
    setAnalyzingAiComp,
    buildingArea,
    setFloorCount,
    setGeneratedDocLink,
    handleSaveAnnotatedPhoto,
    setDynamicValues,
    setAddress,
    setIsDirty,
    setHasDraft,
    isGeneratingLetter,
    handleComponentPhotoUpload,
    setSaveStatus,
    editId,
    katalogData,
    dinasConfig,
    dynamicValues,
    setSafetyChecks,
    setLocalConflictItem,
    setPhotos,
    handleFieldChange,
    lastSaved,
    npsn,
    step,
    isAnnotatorOpen,
    componentWeights,
    setAnnotatingContext,
    setSubmitting,
    formParams,
    setBuildingArea,
    submitting,
    buildingName,
    activeHelpComponent,
    smartPreviewPhoto,
    setBuildingName,
    hasDraft,
    setStep,
    idBangunan,
    handlePhotoUpload,
    setIsAnnotatorOpen,
    setCoordinates,
    setShowHelpModal,
    setLastSaved,
    handleAiAnalysis,
    analyzingAiComp,
    safetyChecks,
    schoolName,
    setDraftTime,
    saveStatus,
    annotatingPhotoUrl,
    setComponentWeights,
    isLetterGenerated,
    setSmartPreviewPhoto,
    showHelpModal,
    searchParams,
    handleSubmit,
    components,
    setNpsn,
    setFormParams,
    restoreDraft,
    discardDraft,
    isPermohonanFlow,
    removePhoto,
    hasCriticalDamage,
    SAFETY_QUESTIONS,
    permissions,
    updateComponentMeta,
    updateComponentDamage,
    removeComponentPhoto,
    calculateFinalResult
  } = useAssessmentForm();

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Page Title & Auto-save Status Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 px-1 print:hidden">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Formulir Penilaian Kerusakan</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Dinas Pekerjaan Umum dan Penataan Ruang</p>
        </div>
        {saveStatus !== "Idle" && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all shadow-sm",
            saveStatus === "Menyimpan..." 
              ? "bg-indigo-50/80 border-indigo-200/50 text-indigo-600 animate-pulse" 
              : "bg-emerald-50/80 border-emerald-200/50 text-emerald-600"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", saveStatus === "Menyimpan..." ? "bg-indigo-500 animate-ping" : "bg-emerald-500")} />
            {saveStatus === "Menyimpan..." ? "Menyimpan draf..." : `Draf Disimpan (${lastSaved ? lastSaved.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""})`}
          </div>
        )}
      </div>

      {/* Restore Draft Banner */}
      <AnimatePresence>
        {hasDraft && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-5 bg-amber-50/80 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm backdrop-blur-md"
          >
            <div className="flex gap-3">
              <div className="p-2 bg-amber-100/80 text-amber-800 rounded-xl shrink-0">
                <ClipboardList className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Draf Progres Ditemukan</h4>
                <p className="text-[11px] text-amber-700/90 font-medium mt-1 leading-relaxed">Sistem menemukan draf laporan yang belum dikirim yang tersimpan otomatis pada {draftTime}. Ingin memulihkan progres Anda?</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={restoreDraft}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                Pulihkan Draf
              </button>
              <button
                onClick={discardDraft}
                className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition-all whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                Abaikan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar Stepper */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 print:hidden bg-white/50 backdrop-blur-lg border border-white/60 p-6 rounded-2xl shadow-md"
      >
        {(() => {
          const currentSteps = isPermohonanFlow 
            ? [
                { num: 1, label: "Data Input", desc: "Informasi Bangunan", icon: ClipboardList },
                { num: 2, label: "Penilaian", desc: "Kerusakan Fisik", icon: Building },
                { num: 3, label: "Submission", desc: "Kirim Surat Permohonan", icon: Send }
              ]
            : [
                { num: 1, label: "Informasi", desc: "Data Bangunan", icon: Building },
                { num: 2, label: "Keselamatan", desc: "Uji Keselamatan", icon: AlertCircle },
                { num: 3, label: "Penilaian", desc: "Kerusakan Fisik", icon: ClipboardList },
                { num: 4, label: "Ringkasan", desc: "Kesimpulan", icon: CheckCircle }
              ];

          const progressPercent = ((step - 1) / (currentSteps.length - 1)) * 100;

          return (
            <div className="relative flex flex-col gap-2">
              <div className="flex items-center justify-between relative">
                {/* Background Connecting Line */}
                <div className="absolute left-[10%] right-[10%] top-6 h-1 bg-slate-200/70 rounded-full -z-10"></div>
                
                {/* Active Colored Progress Line */}
                <motion.div 
                  className="absolute left-[10%] top-6 h-1 bg-gradient-to-r from-pu-blue to-blue-500 rounded-full -z-10 shadow-[0_0_10px_rgba(30,64,175,0.3)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {currentSteps.map((s) => {
                  const IconComponent = s.icon;
                  const isActive = step === s.num;
                  const isCompleted = step > s.num;

                  return (
                    <div key={s.num} className="flex-1 flex flex-col items-center text-center px-1">
                      {/* Step Circle Button */}
                      <motion.div 
                        animate={{ 
                          scale: isActive ? 1.15 : 1,
                          y: isActive ? -2 : 0
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative",
                          isActive 
                            ? "border-pu-blue bg-pu-blue text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-100" 
                            : isCompleted 
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                              : "border-slate-300 bg-white text-slate-400"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : (
                          <IconComponent className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "stroke-[1.8]")} />
                        )}

                        {/* Tiny badge indicating number */}
                        <div className={cn(
                          "absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border",
                          isActive 
                            ? "bg-amber-400 text-slate-900 border-amber-300" 
                            : isCompleted
                              ? "bg-emerald-600 text-white border-emerald-500"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                        )}>
                          {s.num}
                        </div>
                      </motion.div>

                      {/* Step Label and Description */}
                      <div className="mt-3 flex flex-col items-center">
                        <span className={cn(
                          "text-xs font-extrabold tracking-tight transition-all",
                          isActive ? "text-pu-blue font-black" : isCompleted ? "text-emerald-600 font-semibold" : "text-slate-500"
                        )}>
                          {s.label}
                        </span>
                        <span className={cn(
                          "text-[9px] mt-0.5 font-bold uppercase tracking-widest hidden sm:block transition-all",
                          isActive ? "text-slate-600" : isCompleted ? "text-emerald-500" : "text-slate-400"
                        )}>
                          {s.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <BuildingInfoStep
            formParams={formParams}
            dynamicValues={dynamicValues}
            handleFieldChange={handleFieldChange}
            coordinates={coordinates}
            handleGetLocation={handleGetLocation}
            photos={photos}
            setSmartPreviewPhoto={setSmartPreviewPhoto}
            setAnnotatingPhotoUrl={setAnnotatingPhotoUrl}
            setAnnotatingContext={setAnnotatingContext}
            setIsAnnotatorOpen={setIsAnnotatorOpen}
            removePhoto={removePhoto}
            uploadingPhoto={uploadingPhoto}
            handlePhotoUpload={handlePhotoUpload}
            setStep={setStep}
            isPermohonanFlow={isPermohonanFlow}
          />
        )}
                {step === 4 && isPermohonanFlow && (
          <DocumentGenerationStep
            isLetterGenerated={isLetterGenerated}
            isGeneratingLetter={isGeneratingLetter}
            generatedDocLink={generatedDocLink}
            handleGenerateLetter={handleGenerateLetter}
            handleSubmit={handleSubmit}
            submitting={submitting}
            setStep={setStep}
            hasCriticalDamage={hasCriticalDamage}
          />
        )}
                {step === 2 && (
          <SafetyCheckStep
            SAFETY_QUESTIONS={SAFETY_QUESTIONS}
            safetyChecks={safetyChecks}
            setSafetyChecks={setSafetyChecks}
            setIsDirty={setIsDirty}
            setStep={setStep}
            hasCriticalDamage={hasCriticalDamage}
          />
        )}
                {step === 3 && (
          <DamageAnalysisStep
            components={components}
            componentWeights={componentWeights}
            allComponentsData={allComponentsData}
            permissions={permissions}
            analyzingAiComp={analyzingAiComp}
            handleAiAnalysis={handleAiAnalysis}
            setActiveHelpComponent={setActiveHelpComponent}
            setShowHelpModal={setShowHelpModal}
            updateComponentMeta={updateComponentMeta}
            updateComponentDamage={updateComponentDamage}
            setSmartPreviewPhoto={setSmartPreviewPhoto}
            setAnnotatingPhotoUrl={setAnnotatingPhotoUrl}
            setAnnotatingContext={setAnnotatingContext}
            setIsAnnotatorOpen={setIsAnnotatorOpen}
            removeComponentPhoto={removeComponentPhoto}
            handleComponentPhotoUpload={handleComponentPhotoUpload}
            setStep={setStep}
            isPermohonanFlow={isPermohonanFlow}
            DAMAGE_MULTIPLIERS={DAMAGE_MULTIPLIERS}
            setComponents={setComponents}
          />
        )}
      {step === 4 && !isPermohonanFlow && (
        <FinalReviewStep
          calculateFinalResult={calculateFinalResult}
          schoolName={schoolName}
          buildingName={buildingName}
          getParamLabel={getParamLabel}
          npsn={npsn}
          floorCount={floorCount}
          buildingArea={buildingArea}
          hasCriticalDamage={hasCriticalDamage}
          setStep={setStep}
          handleSubmit={handleSubmit}
          submitting={submitting}
          components={components}
          componentWeights={componentWeights}
          DAMAGE_MULTIPLIERS={DAMAGE_MULTIPLIERS}
          allComponentsData={allComponentsData}
          safetyChecks={safetyChecks}
        />
      )}
      </AnimatePresence>

      {/* Visual Guide Modal */}
      <AnimatePresence>
        {showHelpModal && (() => {
          // Find records in katalogData for the current component
          const relevantKatalogs = katalogData.filter(
            k => k.namaKomponen?.toLowerCase() === activeHelpComponent?.toLowerCase()
          );

          // Get Ringan, Sedang, Berat guides
          const guideRingan = relevantKatalogs.find(k => k.namaKlasifikasi === "Ringan");
          const guideSedang = relevantKatalogs.find(k => k.namaKlasifikasi === "Sedang");
          const guideBerat = relevantKatalogs.find(k => k.namaKlasifikasi === "Berat");

          // Default Fallback values
          const fallbackGuides: Record<string, Record<"Ringan" | "Sedang" | "Berat", { desc: string; img: string }>> = {
            "Pondasi": {
              "Ringan": { desc: "Retak rambut halus pada beton sloof/pondasi, tidak ada penurunan struktur.", img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600" },
              "Sedang": { desc: "Retak meluas 1-2mm pada sloof, penurunan atau amblas lokal < 2cm.", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600" },
              "Berat": { desc: "Pondasi patah/hancur, penurunan > 2cm menyebabkan struktur miring signifikan.", img: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=600" }
            },
            "Kolom": {
              "Ringan": { desc: "Retak halus < 1mm pada permukaan plesteran kolom, selimut beton utuh.", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600" },
              "Sedang": { desc: "Retak 1-2mm, selimut beton kolom pecah sebagian, besi tulangan belum berkarat/bengkok.", img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600" },
              "Berat": { desc: "Beton kolom hancur total, besi tulangan utama menekuk (buckling), risiko runtuh tinggi.", img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600" }
            },
            "Balok": {
              "Ringan": { desc: "Retak halus di area momen/tarik, bentang balok lurus sempurna.", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600" },
              "Sedang": { desc: "Retak geser miring 1-2mm, selimut beton retak lebar, lendutan kecil terlihat.", img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600" },
              "Berat": { desc: "Balok retak tembus melintasi penampang, besi putus/terbuka, lendutan ekstrem berbahaya.", img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600" }
            }
          };

          const getGuide = (level: "Ringan" | "Sedang" | "Berat") => {
            const match = level === "Ringan" ? guideRingan : level === "Sedang" ? guideSedang : guideBerat;
            if (match) {
              return { desc: match.deskripsiPupr, img: match.urlFotoContoh };
            }
            // fallback
            const compFallback = fallbackGuides[activeHelpComponent];
            if (compFallback && compFallback[level]) {
              return compFallback[level];
            }
            return {
              desc: `Kerusakan ${level.toLowerCase()} pada komponen ${activeHelpComponent}.`,
              img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600"
            };
          };

          const rData = getGuide("Ringan");
          const sData = getGuide("Sedang");
          const bData = getGuide("Berat");

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowHelpModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Kamus Visual Kerusakan: {activeHelpComponent}</h3>
                  <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Ringan Card */}
                    <div className="border border-green-200 rounded-xl overflow-hidden flex flex-col md:flex-row">
                      <div className="md:w-1/2 bg-green-50 p-5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-green-200">
                        <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Rusak Ringan</span>
                        <p className="text-xs text-green-600 mt-2 font-medium leading-relaxed">{rData.desc}</p>
                      </div>
                      <div className="md:w-1/2 p-4 bg-white flex items-center justify-center">
                        {rData.img ? (
                          <img src={rData.img} alt="Contoh Rusak Ringan" referrerPolicy="no-referrer" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="text-slate-400 text-xs py-10">Belum ada gambar panduan</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Sedang Card */}
                    <div className="border border-yellow-200 rounded-xl overflow-hidden flex flex-col md:flex-row">
                      <div className="md:w-1/2 bg-yellow-50 p-5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-yellow-200">
                        <span className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Rusak Sedang</span>
                        <p className="text-xs text-yellow-600 mt-2 font-medium leading-relaxed">{sData.desc}</p>
                      </div>
                      <div className="md:w-1/2 p-4 bg-white flex items-center justify-center">
                        {sData.img ? (
                          <img src={sData.img} alt="Contoh Rusak Sedang" referrerPolicy="no-referrer" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="text-slate-400 text-xs py-10">Belum ada gambar panduan</div>
                        )}
                      </div>
                    </div>

                    {/* Berat Card */}
                    <div className="border border-orange-200 rounded-xl overflow-hidden flex flex-col md:flex-row">
                      <div className="md:w-1/2 bg-orange-50 p-5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-orange-200">
                        <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">Rusak Berat</span>
                        <p className="text-xs text-orange-600 mt-2 font-medium leading-relaxed">{bData.desc}</p>
                      </div>
                      <div className="md:w-1/2 p-4 bg-white flex items-center justify-center">
                        {bData.img ? (
                          <img src={bData.img} alt="Contoh Rusak Berat" referrerPolicy="no-referrer" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="text-slate-400 text-xs py-10">Belum ada gambar panduan</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowHelpModal(false)} className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">
                    Tutup Panduan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Photo Annotation Modal */}
      <PhotoAnnotator
        isOpen={isAnnotatorOpen}
        photoUrl={annotatingPhotoUrl}
        onSave={handleSaveAnnotatedPhoto}
        onClose={() => {
          setIsAnnotatorOpen(false);
          setAnnotatingPhotoUrl("");
          setAnnotatingContext(null);
        }}
      />

      {/* Form Load Version Conflict Resolution Modal */}
      {localConflictItem && serverConflictData && (
        <div id="form-conflict-resolution-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div id="form-conflict-modal-card" className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div id="form-conflict-modal-header" className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Konflik Data Deteksi Awal</h2>
                <p className="text-xs text-amber-50 opacity-90">Terdapat perubahan lokal yang belum tersinkronisasi untuk penilaian ini.</p>
              </div>
            </div>

            {/* Content body */}
            <div id="form-conflict-modal-body" className="p-6 space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sistem mendeteksi bahwa penilaian untuk <strong className="text-slate-800 dark:text-slate-200">"{serverConflictData.schoolName}"</strong> memiliki versi perubahan lokal (offline) yang berbeda dari database server. Harap pilih versi data mana yang ingin Anda muat ke dalam formulir:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Local Version Card */}
                <div id="form-local-version-card" className="border border-amber-300 dark:border-amber-950 bg-amber-500/5 dark:bg-amber-500/2 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-extrabold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider">Draf Offline Lokal</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Sekolah:</span> {localConflictItem.schoolName || localConflictItem.payload?.schoolName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Bangunan:</span> {localConflictItem.payload?.buildingName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Tingkat Kerusakan:</span>{" "}
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {localConflictItem.payload?.finalResult?.totalDamagePercentage?.toFixed(2)}% ({localConflictItem.payload?.finalResult?.category})
                        </span>
                      </div>
                      <div>
                        <span className="font-medium font-mono text-[10px]">Waktu Simpan:</span>{" "}
                        {localConflictItem.timestamp ? new Date(localConflictItem.timestamp).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>
                  </div>
                  <button
                    id="btn-form-use-local"
                    onClick={() => handleResolveLocalConflict(true)}
                    className="mt-6 w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Gunakan Draf Lokal
                  </button>
                </div>

                {/* Server Version Card */}
                <div id="form-server-version-card" className="border border-blue-300 dark:border-blue-950 bg-blue-500/5 dark:bg-blue-500/2 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-extrabold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider">Data Server Utama</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Sekolah:</span> {serverConflictData.schoolName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Bangunan:</span> {serverConflictData.buildingName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Tingkat Kerusakan:</span>{" "}
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {serverConflictData.finalResult?.totalDamagePercentage?.toFixed(2)}% ({serverConflictData.finalResult?.category})
                        </span>
                      </div>
                      <div>
                        <span className="font-medium font-mono text-[10px]">Waktu Simpan:</span>{" "}
                        {serverConflictData.date ? new Date(serverConflictData.date).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>
                  </div>
                  <button
                    id="btn-form-use-server"
                    onClick={() => handleResolveLocalConflict(false)}
                    className="mt-6 w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Gunakan Data Server
                  </button>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div id="form-conflict-modal-footer" className="bg-slate-50 dark:bg-slate-950/40 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                id="btn-form-cancel-conflict"
                onClick={() => navigate("/assessments")}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Kembali ke Daftar Penilaian
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {smartPreviewPhoto && (
        <SmartPhotoViewer 
          photoUrl={smartPreviewPhoto.url} 
          fileName={smartPreviewPhoto.componentName || "Dokumentasi Bangunan"}
          onClose={() => setSmartPreviewPhoto(null)}
        />
      )}
    </div>
  );
}
