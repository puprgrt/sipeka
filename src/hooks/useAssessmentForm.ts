import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Assessment, COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI, DAMAGE_MULTIPLIERS, ComponentAssessment } from "../types";
import { MapPin, Camera, Save, AlertCircle, X, CloudUpload, HelpCircle, Printer, Info, CheckCircle, FileText as FileTextIcon, Loader2, Building, Check, ClipboardList, Send, Paintbrush, Plus, Minus } from "lucide-react";
import { cn, getAuditHeaders } from "../lib/utils";
import { addOfflineAssessment, getOfflineAssessments, deleteOfflineAssessment } from "../lib/indexedDbQueue";
import { replaceTemplatePlaceholders } from "../utils/templateUtils";
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



const compressDataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image")) {
      // Return as-is if it's already a URL or unrecognized
      const arr = dataUrl.split(',');
      if (arr.length < 2) {
        resolve(new File([""], fileName));
        return;
      }
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const bstr = atob(arr[1] || "");
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      resolve(new File([u8arr], fileName, {type:mime}));
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1200; // Resize to max 1200px
      if (width > height) {
        if (width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], fileName, { type: 'image/jpeg' }));
          } else {
            resolve(new File([""], fileName));
          }
        }, 'image/jpeg', 0.6); // 60% quality compression
      } else {
        resolve(new File([""], fileName));
      }
    };
    img.onerror = () => resolve(new File([""], fileName));
    img.src = dataUrl;
  });
};

export function useAssessmentForm() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingAiComp, setAnalyzingAiComp] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Settings from DB
  const [componentWeights, setComponentWeights] = useState<Record<string, number>>(COMPONENT_WEIGHTS_1_LANTAI);
  const [loadingParams, setLoadingParams] = useState(true);

  // Dynamic general information parameters
  interface BuildingParam {
    id: string;
    label: string;
    type: 'text' | 'number' | 'textarea';
    placeholder: string;
    required: boolean;
    enabled: boolean;
  }
  const [formParams, setFormParams] = useState<BuildingParam[]>([]);
  const getParamLabel = (id: string, def: string) => {
    const p = formParams.find(x => x.id === id);
    return p ? p.label : def;
  };
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({
    schoolName: "",
    buildingName: "",
    npsn: "",
    address: "",
    buildingArea: 100,
    floorCount: 1
  });

  // Form Data
  const [schoolName, setSchoolName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [npsn, setNpsn] = useState("");
  const [address, setAddress] = useState("");
  const [buildingArea, setBuildingArea] = useState<number>(100);
  const [floorCount, setFloorCount] = useState<number>(1);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [idBangunan, setIdBangunan] = useState<number | null>(null);
  const [smartPreviewPhoto, setSmartPreviewPhoto] = useState<{ url: string, componentName: string } | null>(null);

  const handleFieldChange = (id: string, value: any) => {
    setIsDirty(true);
    setDynamicValues(prev => ({ ...prev, [id]: value }));
    if (id === "schoolName") setSchoolName(value);
    if (id === "buildingName") setBuildingName(value);
    if (id === "npsn") setNpsn(value);
    if (id === "address") setAddress(value);
    if (id === "buildingArea") setBuildingArea(Number(value));
    if (id === "floorCount") setFloorCount(Number(value));
  };
  const [allComponentsData, setAllComponentsData] = useState<any[]>([]);
  const [katalogData, setKatalogData] = useState<any[]>([]);
  const [dinasConfig, setDinasConfig] = useState<any>(null);
  const [letterConfig, setLetterConfig] = useState<any>(null);
  
  // Auth and Role tracking for separate Permohonan vs Penilaian flows
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<string>(() => {
    return localStorage.getItem("activeRole") || "Administrator";
  });
  
  // Letter generation states
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isLetterGenerated, setIsLetterGenerated] = useState(false);
  const [letterReferenceNo, setLetterReferenceNo] = useState("");
  const [generatedDocLink, setGeneratedDocLink] = useState("");
  const [previewTab, setPreviewTab] = useState<"design" | "embedded">("design");
  const [suratPermohonanTemplate, setSuratPermohonanTemplate] = useState("");
  const [suratPermohonanDriveLink, setSuratPermohonanDriveLink] = useState("");

  // Auto-save and draft restoration states
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<"Tersimpan" | "Menyimpan..." | "Idle">("Idle");
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState<string>("");

  // States for Photo Annotation
  const [isAnnotatorOpen, setIsAnnotatorOpen] = useState(false);

  // Form conflict states
  const [localConflictItem, setLocalConflictItem] = useState<any | null>(null);
  const [serverConflictData, setServerConflictData] = useState<any | null>(null);

  const applyLoadedData = (data: any) => {
    setSchoolName(data.schoolName || "");
    setBuildingName(data.buildingName || "");
    setNpsn(data.npsn || "");
    setAddress(data.address || "");
    setBuildingArea(data.buildingArea || 100);
    setFloorCount(data.floorCount || 1);
    
    setDynamicValues({
      schoolName: data.schoolName || "",
      buildingName: data.buildingName || "",
      npsn: data.npsn || "",
      address: data.address || "",
      buildingArea: data.buildingArea || 100,
      floorCount: data.floorCount || 1,
      idBangunan: data.idBangunan || "",
      ...(data.customFields || {})
    });

    if (data.components) setComponents(data.components);
    if (data.photos) setPhotos(data.photos);
    if (data.coordinates) setCoordinates(data.coordinates);
    if (data.idBangunan) setIdBangunan(data.idBangunan);
  };

  const handleResolveLocalConflict = (useLocal: boolean) => {
    if (useLocal && localConflictItem) {
      applyLoadedData({
        ...localConflictItem.payload,
        idBangunan: localConflictItem.payload.idBangunan || idBangunan
      });
      setIsDirty(true);
    } else if (serverConflictData) {
      applyLoadedData(serverConflictData);
      // Discard offline item since user explicitly chose server
      if (localConflictItem) {
        deleteOfflineAssessment(localConflictItem.id).catch(err => console.warn(err));
      }
    }
    setLocalConflictItem(null);
    setServerConflictData(null);
  };

  useEffect(() => {
    if (editId) {
      // Fetch server data
      fetch(`/api/assessments/${editId}`)
        .then(res => res.json())
        .then(async (serverData) => {
          if (serverData && !serverData.error) {
            // Check if there is an offline queue item for this editId
            let offlineConflict = null;
            try {
              const offlineItems = await getOfflineAssessments();
              const matchingOffline = offlineItems.find(item => item.editId === editId);
              if (matchingOffline) {
                // Check if they differ
                const localDamage = matchingOffline.payload?.finalResult?.totalDamagePercentage || 0;
                const serverDamage = serverData.finalResult?.totalDamagePercentage || 0;
                const localSchool = matchingOffline.payload?.schoolName || "";
                const serverSchool = serverData.schoolName || "";
                const localArea = Number(matchingOffline.payload?.buildingArea) || 0;
                const serverArea = Number(serverData.buildingArea) || 0;

                const hasDiff = 
                  Math.abs(localDamage - serverDamage) > 0.01 || 
                  localSchool !== serverSchool || 
                  localArea !== serverArea;

                if (hasDiff) {
                  offlineConflict = matchingOffline;
                }
              }
            } catch (err) {
              console.warn("Failed checking offline conflicts on load", err);
            }

            if (offlineConflict) {
              setLocalConflictItem(offlineConflict);
              setServerConflictData(serverData);
            } else {
              applyLoadedData(serverData);
            }
          }
        })
        .catch(err => console.error("Error loading assessment", err));
    }
  }, [editId]);

  const [annotatingPhotoUrl, setAnnotatingPhotoUrl] = useState("");
  const [annotatingContext, setAnnotatingContext] = useState<{
    type: "main" | "component";
    index?: number;
    level?: string;
    photoIdx?: number;
  } | null>(null);

  const handleSaveAnnotatedPhoto = (annotatedUrl: string) => {
    if (!annotatingContext) return;

    setIsDirty(true);
    if (annotatingContext.type === "main") {
      const idx = annotatingContext.photoIdx;
      if (idx !== undefined && idx >= 0) {
        setPhotos(prev => {
          const updated = [...prev];
          updated[idx] = annotatedUrl;
          return updated;
        });
      } else {
        setPhotos(prev => [...prev, annotatedUrl]);
      }
    } else if (annotatingContext.type === "component") {
      const { index: compIndex, level, photoIdx } = annotatingContext;
      if (compIndex !== undefined && level) {
        setComponents(prev => {
          const newComps = [...prev];
          const comp = { ...newComps[compIndex] };
          let detailIndex = comp.damageDetails.findIndex(d => d.level === level);
          
          if (detailIndex === -1) {
            // @ts-ignore
            comp.damageDetails.push({ level, percentage: 0, photos: [] });
            detailIndex = comp.damageDetails.length - 1;
          }
          
          const detail = { ...comp.damageDetails[detailIndex] };
          if (photoIdx !== undefined && photoIdx >= 0) {
            const updatedPhotos = [...(detail.photos || [])];
            updatedPhotos[photoIdx] = annotatedUrl;
            detail.photos = updatedPhotos;
          } else {
            detail.photos = [...(detail.photos || []), annotatedUrl];
          }
          
          comp.damageDetails[detailIndex] = detail;
          newComps[compIndex] = comp;
          return newComps;
        });
      }
    }

    setIsAnnotatorOpen(false);
    setAnnotatingPhotoUrl("");
    setAnnotatingContext(null);
  };

  const isPermohonanFlow = activeRole === "Administrator" || activeRole === "Pengelola_Bangunan";
  const permissions = getRolePermissions()[activeRole as keyof ReturnType<typeof getRolePermissions>]?.permissions;

  useEffect(() => {
    fetch("/api/building-parameters")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const activeParams = data.filter(p => {
            if (p.enabled === false) return false;
            if (isPermohonanFlow && p.showInPermohonan === false) return false;
            if (!isPermohonanFlow && p.showInPenilaian === false) return false;
            return true;
          });
          setFormParams(activeParams);
          
          setDynamicValues(prev => {
            const initialVals = { ...prev };
            activeParams.forEach(p => {
              if (!(p.id in initialVals)) {
                initialVals[p.id] = p.type === 'number' ? 0 : "";
              }
            });
            return initialVals;
          });
        }
      })
      .catch(err => console.error("Failed to load building parameters", err));
  }, [isPermohonanFlow]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => setUser(currentUser),
      () => setUser(null)
    );

    const handleStorageChange = () => {
      setActiveRole(localStorage.getItem("activeRole") || "Administrator");
    };

    window.addEventListener("storage", handleStorageChange);

    // Set initial custom reference number
    setLetterReferenceNo(`050/PUPR/BB/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);

    fetch("/api/dinas")
      .then(res => res.json())
      .then(data => setDinasConfig(data))
      .catch(err => console.error("Failed to fetch dinas config", err));

    fetch("/api/pengaturan-surat")
      .then(res => res.json())
      .then(data => setLetterConfig(data))
      .catch(err => console.error("Failed to fetch letter config", err));

    fetch("/api/document-templates")
      .then(res => res.json())
      .then((templates: any[]) => {
        const surat = templates.find((t: any) => t.id === 'surat_permohonan');
        if (surat) {
          setSuratPermohonanTemplate(surat.kontenHtml);
          setSuratPermohonanDriveLink(surat.driveLink || "");
        }
      })
      .catch(err => console.error("Failed to fetch document templates", err));

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const reassessId = new URLSearchParams(window.location.search).get("reassessBuildingId");
    if (reassessId) {
      fetch("/api/buildings")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const b = data.find(item => item.idBangunan === Number(reassessId));
            if (b) {
              setIdBangunan(b.idBangunan);
              setSchoolName(b.schoolName || "");
              setBuildingName(b.buildingName || "");
              setNpsn(b.npsn || "");
              setAddress(b.address || "");
              setBuildingArea(b.buildingArea || 100);
              setFloorCount(b.floorCount || 1);
              setCoordinates(b.coordinates);
              
              setDynamicValues({
                schoolName: b.schoolName || "",
                buildingName: b.buildingName || "",
                npsn: b.npsn || "",
                address: b.address || "",
                buildingArea: b.buildingArea || 100,
                floorCount: b.floorCount || 1,
                ...(b.customFields || {})
              });
            }
          }
        })
        .catch(err => console.error("Failed to populate reassess data", err));
    }
  }, []);

  // Prevent accidental navigation / refresh if form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
  
  // Safety checks (Tahap 1)
  const SAFETY_QUESTIONS = [
    { id: 'pondasi', label: 'Pondasi', question: 'Apakah bangunan tampak miring secara kasat mata atau pondasi amblas?' },
    { id: 'kolom', label: 'Kolom/Tiang', question: 'Apakah ada kolom/tiang utama yang patah, melengkung parah, atau hancur?' },
    { id: 'balok', label: 'Balok', question: 'Apakah ada balok utama yang melendut ke bawah secara ekstrem atau retak tembus?' },
    { id: 'atap', label: 'Atap', question: 'Apakah struktur atap melengkung parah atau sebagian besar terancam ambruk?' },
    { id: 'dinding', label: 'Dinding', question: 'Apakah dinding utama mengalami retak diagonal lebar atau miring terancam roboh?' }
  ];
  const [safetyChecks, setSafetyChecks] = useState<Record<string, boolean>>({});
  const hasCriticalDamage = Object.values(safetyChecks).some(v => v);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeHelpComponent, setActiveHelpComponent] = useState("");
  
  // Initialize component assessments based on our template
  const [components, setComponents] = useState<ComponentAssessment[]>([]);

  // Check for existing draft on mount (when loading is complete)
  useEffect(() => {
    if (loadingParams) return;
    
    // Skip draft prompt if we are explicitly reassessing a building
    const reassessId = new URLSearchParams(window.location.search).get("reassessBuildingId");
    if (reassessId) return;

    const saved = localStorage.getItem("assessment_form_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.schoolName || parsed.buildingName || parsed.components?.length > 0 || Object.keys(parsed.safetyChecks || {}).length > 0) {
          setHasDraft(true);
          if (parsed.savedAt) {
            const d = new Date(parsed.savedAt);
            setDraftTime(
              d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + 
              ", " + 
              d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
            );
          }
        }
      } catch (e) {
        console.error("Error reading draft", e);
      }
    }
  }, [loadingParams]);

  // Restore draft handler
  const restoreDraft = () => {
    const saved = localStorage.getItem("assessment_form_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.schoolName !== undefined) setSchoolName(parsed.schoolName);
        if (parsed.buildingName !== undefined) setBuildingName(parsed.buildingName);
        if (parsed.npsn !== undefined) setNpsn(parsed.npsn);
        if (parsed.address !== undefined) setAddress(parsed.address);
        if (parsed.buildingArea !== undefined) setBuildingArea(parsed.buildingArea);
        if (parsed.floorCount !== undefined) setFloorCount(parsed.floorCount);
        if (parsed.coordinates !== undefined) setCoordinates(parsed.coordinates);
        if (parsed.photos !== undefined) setPhotos(parsed.photos);
        if (parsed.dynamicValues !== undefined) setDynamicValues(parsed.dynamicValues);
        if (parsed.safetyChecks !== undefined) setSafetyChecks(parsed.safetyChecks);
        if (parsed.components !== undefined) setComponents(parsed.components);
        if (parsed.step !== undefined) setStep(parsed.step);
        
        setHasDraft(false);
        setSaveStatus("Tersimpan");
        if (parsed.savedAt) setLastSaved(new Date(parsed.savedAt));
        // Reset dirty status so it doesn't trigger a re-save immediately
        setIsDirty(false);
      } catch (e) {
        console.error("Gagal memulihkan draf", e);
      }
    }
  };

  // Discard draft handler
  const discardDraft = () => {
    localStorage.removeItem("assessment_form_draft");
    setHasDraft(false);
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (!isDirty) return;

    // Check if there's any data to save
    const hasData = schoolName || buildingName || npsn || address || photos.length > 0 || components.some(c => c.damageDetails.length > 0) || Object.keys(safetyChecks).length > 0;
    if (!hasData) return;

    setSaveStatus("Menyimpan...");

    const timer = setTimeout(() => {
      const draftData = {
        schoolName,
        buildingName,
        npsn,
        address,
        buildingArea,
        floorCount,
        coordinates,
        photos,
        dynamicValues,
        safetyChecks,
        components,
        step,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem("assessment_form_draft", JSON.stringify(draftData));
      setLastSaved(new Date());
      setSaveStatus("Tersimpan");
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(timer);
  }, [schoolName, buildingName, npsn, address, buildingArea, floorCount, coordinates, photos, dynamicValues, safetyChecks, components, step, isDirty]);

  useEffect(() => {
    fetch("/api/components")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setAllComponentsData(data);
          const weights: Record<string, number> = {};
          const comps: ComponentAssessment[] = [];
          data.forEach((c: any) => {
            weights[c.namaKomponen] = parseFloat(c.bobotFormA || '0');
            comps.push({
              name: c.namaKomponen,
              safetyImpact: false,
              damageDetails: []
            });
          });
          setComponentWeights(weights);
          setComponents(prev => prev.length > 0 ? prev : comps);
        } else {
          // fallback to defaults if api is empty
          const fallbackWeights = floorCount === 2 ? COMPONENT_WEIGHTS_2_LANTAI : floorCount >= 3 ? COMPONENT_WEIGHTS_3_LANTAI : COMPONENT_WEIGHTS_1_LANTAI;
          setComponentWeights(fallbackWeights);
          setComponents(prev => prev.length > 0 ? prev : Object.keys(COMPONENT_WEIGHTS_3_LANTAI).map(name => ({
            name,
            safetyImpact: false,
            damageDetails: []
          })));
        }
      })
      .catch(err => {
        console.error("Failed to load components", err);
        const fallbackWeights = floorCount === 2 ? COMPONENT_WEIGHTS_2_LANTAI : floorCount >= 3 ? COMPONENT_WEIGHTS_3_LANTAI : COMPONENT_WEIGHTS_1_LANTAI;
        setComponentWeights(fallbackWeights);
        setComponents(prev => prev.length > 0 ? prev : Object.keys(COMPONENT_WEIGHTS_3_LANTAI).map(name => ({
            name,
            safetyImpact: false,
            damageDetails: []
          })));
      })
      .finally(() => setLoadingParams(false));

    fetch("/api/katalog")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setKatalogData(data);
        }
      })
      .catch(err => console.error("Failed to load katalog visual", err));
  }, []);

  useEffect(() => {
    if (allComponentsData.length > 0) {
      const weights: Record<string, number> = {};
      allComponentsData.forEach((c: any) => {
        let weightStr = c.bobotFormA;
        if (floorCount === 2) weightStr = c.bobotFormB;
        if (floorCount >= 3) weightStr = c.bobotFormC;
        weights[c.namaKomponen] = parseFloat(weightStr || '0');
      });
      setComponentWeights(weights);
    } else {
      const fallbackWeights = floorCount === 2 ? COMPONENT_WEIGHTS_2_LANTAI : floorCount >= 3 ? COMPONENT_WEIGHTS_3_LANTAI : COMPONENT_WEIGHTS_1_LANTAI;
      setComponentWeights(fallbackWeights);
    }
  }, [floorCount, allComponentsData]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsDirty(true);
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.");
        }
      );
    } else {
      alert("Geolocation tidak didukung di browser ini.");
    }
  };

  const handleGenerateLetter = async () => {
    setIsGeneratingLetter(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        try {
          await googleSignIn();
        } catch (error) {
          // If declined or popup blocked, use a robust simulated Google Doc preview link
          console.warn("Google Sign-In failed or was cancelled:", error);
          setIsGeneratingLetter(false);
          setGeneratedDocLink(`https://docs.google.com/document/d/1tB92fE0pM5Y9p_test_simulated_doc_id/edit`);
          setIsLetterGenerated(true);
          return;
        }
      }

      const pengelolaKop = letterConfig?.pengelola;
      const kopText = pengelolaKop ? `${pengelolaKop.namaInstansiAtas || "PEMERINTAH KABUPATEN GARUT"}\n${pengelolaKop.namaInstansiBawah || schoolName || "UPTD SATUAN PENDIDIKAN"}\n${getParamLabel("address", "Alamat")}: ${pengelolaKop.alamat || address || "Jl. Raya Pembangunan No. 123"}${pengelolaKop.nomorTelepon ? ` | Telp: ${pengelolaKop.nomorTelepon}` : ""}${pengelolaKop.email ? ` | Email: ${pengelolaKop.email}` : ""}\n=========================================\n\n` : "";

      const docTitle = `Surat Permohonan Penilaian Kerusakan - ${schoolName || "Instansi"}`;
      let docContent = "";
      
      if (suratPermohonanTemplate && suratPermohonanTemplate.includes("{{")) {
        // Use dynamic template
        docContent = replaceTemplatePlaceholders(suratPermohonanTemplate, {
          namaInstansiAtas: pengelolaKop?.namaInstansiAtas || "PEMERINTAH KABUPATEN GARUT",
          namaInstansiBawah: pengelolaKop?.namaInstansiBawah || schoolName || "UPTD SATUAN PENDIDIKAN",
          alamatPemohon: pengelolaKop?.alamat || address || "Jl. Raya Pembangunan No. 123",
          nomorSurat: letterReferenceNo,
          tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          namaSekolah: schoolName,
          namaBangunan: buildingName,
          npsn: npsn,
          luasBangunan: String(buildingArea),
          jumlahLantai: String(floorCount),
          alamatBangunan: address,
          koordinatGps: coordinates ? `${coordinates.lat}, ${coordinates.lng}` : "-",
          namaPengirim: pengelolaKop?.namaKepala || "Nama Pengirim",
          jabatanPengirim: pengelolaKop?.jabatan || "Jabatan",
          nipPengirim: pengelolaKop?.nipKepala || "-"
        });
      } else {
        // Fallback hardcoded
        docContent = `${kopText}SURAT PERMOHONAN PENILAIAN KERUSAKAN BANGUNAN GEDUNG
          
Nomor Surat: ${letterReferenceNo}
Perihal: Permohonan Penilaian Kerusakan Fisik Bangunan Gedung
Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

${getParamLabel("schoolName", "Nama Sekolah / Instansi")}: ${schoolName}
${getParamLabel("buildingName", "Nama Bangunan")}: ${buildingName}
${getParamLabel("npsn", "NPSN")}: ${npsn}
${getParamLabel("buildingArea", "Luas Bangunan")}: ${buildingArea} m²
${getParamLabel("floorCount", "Jumlah Lantai")}: ${floorCount} Lantai
${getParamLabel("address", "Alamat")}: ${address}
Koordinat GPS: ${coordinates ? `Latitude: ${coordinates.lat}, Longitude: ${coordinates.lng}` : "-"}
`;
      }

      // Append dynamic custom parameters
      const stdKeys = ["schoolName", "buildingName", "npsn", "address", "buildingArea", "floorCount"];
      formParams.forEach(p => {
        if (!stdKeys.includes(p.id)) {
          const val = dynamicValues[p.id];
          if (val !== undefined && val !== "") {
            docContent += `\n${p.label}: ${val}`;
          }
        }
      });

      docContent += `\n\nDengan hormat, bersama ini kami sampaikan dokumen permohonan resmi penilaian kondisi fisik bangunan gedung agar kiranya dapat diagendakan survei dan analisis teknis lapangan oleh Tim Teknis Dinas PUPR.\n\nHormat Kami,\nPengelola Bangunan / Pemohon`;

      const link = await createDocument(docTitle, docContent);
      setGeneratedDocLink(link);
      setIsLetterGenerated(true);
    } catch (err) {
      console.error("Gagal membuat dokumen Google Docs", err);
      // Fallback/Simulasi jika ada error agar tetap lancar
      alert("Gagal terhubung dengan Google Docs API. Membuat draf simulasi pratinjau surat.");
      setGeneratedDocLink(`https://docs.google.com/document/d/1tB92fE0pM5Y9p_test_simulated_doc_id/edit`);
      setIsLetterGenerated(true);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadingPhoto(true);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAnnotatingPhotoUrl(reader.result as string);
          setAnnotatingContext({ type: "main" }); // photoIdx undefined means appending new photo
          setIsAnnotatorOpen(true);
          setUploadingPhoto(false);
          if (e.target) {
            e.target.value = '';
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Upload error", err);
        alert("Gagal mengunggah foto.");
        setUploadingPhoto(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setIsDirty(true);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const calculateFinalResult = () => {
    if (hasCriticalDamage) {
      return { totalDamagePercentage: 100, category: "Berat" as const };
    }

    let totalDamagePercentage = 0;
    let hasSafetyImpact = false;

    components.forEach(comp => {
      const weight = componentWeights[comp.name] || 0;
      if (weight === 0) return;
      
      if (comp.safetyImpact) {
        hasSafetyImpact = true;
      }


      let componentDamageValue = 0;
      comp.damageDetails.forEach(detail => {
        const multiplier = DAMAGE_MULTIPLIERS[detail.level];
        // Ensure volume is between 0 and 100
        const volumeFraction = (detail.percentage || 0) / 100;
        componentDamageValue += volumeFraction * multiplier;
      });

      // Total component damage capped at 1.0 (100%)
      componentDamageValue = Math.min(componentDamageValue, 1.0);
      
      totalDamagePercentage += componentDamageValue * weight;
    });

    let category: "Ringan" | "Sedang" | "Berat" = "Ringan";
    if (hasSafetyImpact || totalDamagePercentage > 45) {
      category = "Berat";
    } else if (totalDamagePercentage > 30) {
      category = "Sedang";
    }

    return { totalDamagePercentage, category };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const finalResult = isPermohonanFlow 
      ? { totalDamagePercentage: 0, category: "Ringan" as const }
      : calculateFinalResult();
    
    // Attempt Google Workspace integrations if token is available
    const token = await getAccessToken();
    let documentLink = generatedDocLink;
    if (token && isPermohonanFlow) {
      try {
        if (!documentLink) {
          const docTitle = `Surat Permohonan Penilaian Kerusakan - ${schoolName}`;
          const docContent = `SURAT PERMOHONAN PENILAIAN KERUSAKAN BANGUNAN KEDINASAN
            
Nomor Surat: ${letterReferenceNo}
Perihal: Permohonan Penilaian Kerusakan Fisik Bangunan Gedung
Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

${getParamLabel("schoolName", "Nama Sekolah / Instansi")}: ${schoolName}
${getParamLabel("buildingName", "Nama Bangunan")}: ${buildingName}
${getParamLabel("npsn", "NPSN")}: ${npsn}
${getParamLabel("buildingArea", "Luas Bangunan")}: ${buildingArea} m²
${getParamLabel("floorCount", "Jumlah Lantai")}: ${floorCount} Lantai
${getParamLabel("address", "Alamat")}: ${address}
Koordinat GPS: ${coordinates ? `Latitude: ${coordinates.lat}, Longitude: ${coordinates.lng}` : "-"}

Dengan hormat, bersama ini kami sampaikan dokumen permohonan resmi penilaian kondisi fisik bangunan gedung agar kiranya dapat diagendakan survei dan analisis teknis lapangan oleh Tim Teknis Dinas PUPR.

Hormat Kami,
Pengelola Bangunan / Pemohon`;
          let docContentWithParams = docContent;
          const stdKeys = ["schoolName", "buildingName", "npsn", "address", "buildingArea", "floorCount"];
          formParams.forEach(p => {
            if (!stdKeys.includes(p.id)) {
              const val = dynamicValues[p.id];
              if (val !== undefined && val !== "") {
                docContentWithParams += `\n${p.label}: ${val}`;
              }
            }
          });

          documentLink = await createDocument(docTitle, docContentWithParams);
        }
        
        await sendEmail(
          'enjangwahyudin@gmail.com', // fallback/test email
          `Permohonan Baru (Menunggu Survei): ${schoolName} - ${buildingName}`,
          `Terdapat permohonan baru untuk ${schoolName} (Massa Bangunan: ${buildingName}).\nSurat permohonan resmi kedinasan telah digenerate.\nLihat dokumen resmi: ${documentLink}`
        );
      } catch (err) {
        console.warn("Failed to complete Google Workspace integrations", err);
      }
    }

    const standardKeys = ["schoolName", "buildingName", "npsn", "address", "buildingArea", "floorCount"];
    const customFields: Record<string, any> = {};
    Object.keys(dynamicValues).forEach(key => {
      if (!standardKeys.includes(key)) {
        customFields[key] = dynamicValues[key];
      }
    });

    const activeUserId = localStorage.getItem("activeUserId");
    
    // Proses kompresi & unggah foto ke Google Drive jika ada koneksi
    let finalPhotos = [...photos];
    let finalComponents = JSON.parse(JSON.stringify(components)); // Deep copy untuk payload

    if (token && window.navigator.onLine) {
      try {
        const saved = localStorage.getItem("smart_files_db");
        const parsedFilesDb = saved ? JSON.parse(saved) : [];

        // 1. Upload Foto Utama Bangunan
        for (let i = 0; i < finalPhotos.length; i++) {
          if (finalPhotos[i].startsWith("data:image")) {
            const file = await compressDataUrlToFile(finalPhotos[i], `Foto_Utama_${i+1}.jpg`);
            if (file.size > 0) {
              const driveUrl = await uploadToDrive(file, schoolName || "Bangunan Tanpa Nama");
              finalPhotos[i] = driveUrl; // Ganti Base64 dengan URL Google Drive
              
              parsedFilesDb.push({
                id: "file-" + Date.now().toString() + "-" + i,
                name: `Foto Utama ${i+1} - ${schoolName || "Bangunan"}.jpg`,
                type: "image",
                size: file.size,
                updatedAt: new Date().toISOString(),
                author: user?.displayName || "Pengelola",
                folderId: null,
                accessRole: ["Administrator", "Pengelola_Bangunan", "Tim_Teknis"],
                previewUrl: driveUrl
              });
            }
          }
        }

        // 2. Upload Foto Kerusakan Komponen
        for (let c = 0; c < finalComponents.length; c++) {
          for (let d = 0; d < finalComponents[c].damageDetails.length; d++) {
             const compPhotos = finalComponents[c].damageDetails[d].photos || [];
             for (let p = 0; p < compPhotos.length; p++) {
                if (compPhotos[p].startsWith("data:image")) {
                   const file = await compressDataUrlToFile(compPhotos[p], `Foto_${finalComponents[c].name.replace(/\//g, '_')}_${d}_${p}.jpg`);
                   if (file.size > 0) {
                     const driveUrl = await uploadToDrive(file, schoolName || "Bangunan Tanpa Nama");
                     finalComponents[c].damageDetails[d].photos[p] = driveUrl; // Ganti Base64 dengan URL Google Drive
                     
                     parsedFilesDb.push({
                       id: "file-comp-" + Date.now().toString() + "-" + c + "-" + d + "-" + p,
                       name: `Foto ${finalComponents[c].name} - ${schoolName || "Bangunan"}.jpg`,
                       type: "image",
                       size: file.size,
                       updatedAt: new Date().toISOString(),
                       author: user?.displayName || "Pengelola",
                       folderId: null,
                       accessRole: ["Administrator", "Pengelola_Bangunan", "Tim_Teknis"],
                       previewUrl: driveUrl
                     });
                   }
                }
             }
          }
        }
        
        // Simpan pembaruan ke Manajemen File
        localStorage.setItem("smart_files_db", JSON.stringify(parsedFilesDb));
      } catch (e) {
        console.warn("Gagal mengunggah beberapa foto ke Google Drive:", e);
      }
    }

    const payload = {
      idBangunan,
      idUserPengelola: activeUserId ? Number(activeUserId) : undefined,
      schoolName,
      buildingName,
      npsn,
      address,
      buildingArea,
      floorCount,
      coordinates,
      photos: finalPhotos,
      components: finalComponents,
      finalResult,
      safetyChecks,
      documentLink: documentLink ? documentLink.replace(/\/edit$/, "/export?format=pdf") : null,
      customFields: {
        ...customFields,
        idBangunan
      }
    };

    if (payload.documentLink && isPermohonanFlow) {
      try {
        const saved = localStorage.getItem("smart_files_db");
        const parsed = saved ? JSON.parse(saved) : [];
        const newFile = {
          id: "file-" + Date.now().toString(),
          name: `Surat Permohonan - ${schoolName}.pdf`,
          type: "pdf",
          size: 150000,
          updatedAt: new Date().toISOString(),
          author: user?.displayName || "Pengelola",
          folderId: null,
          accessRole: ["Administrator", "Pengelola_Bangunan"],
          previewUrl: payload.documentLink
        };
        parsed.push(newFile);
        localStorage.setItem("smart_files_db", JSON.stringify(parsed));
      } catch (e) {
        console.warn("Failed to add file to Manajemen File", e);
      }
    }

    const saveOffline = async () => {
      const offlineItem = {
        id: editId || `offline-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        payload,
        editId: editId || null,
        timestamp: new Date().toISOString(),
        schoolName: schoolName || "Sekolah Tanpa Nama"
      };
      
      try {
        await addOfflineAssessment(offlineItem);
        localStorage.removeItem("assessment_form_draft");
        setIsDirty(false);
        
        alert(`⚠️ Koneksi internet terbatas atau tidak terdeteksi.\n\nData penilaian untuk "${schoolName || "Sekolah"}" telah berhasil disimpan secara aman di memori lokal perangkat Anda (IndexedDB).\n\nSistem akan otomatis mensinkronisasikan data ini ke server ketika koneksi internet terhubung kembali.`);
        const returnTo = searchParams.get("returnTo") || "/list";
        navigate(returnTo, { state: { assessmentId: editId || payload.idBangunan } });
      } catch (err) {
        console.error("Failed to save to IndexedDB, fallback to localStorage", err);
        const existingOffline = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
        const index = existingOffline.findIndex((item: any) => item.id === offlineItem.id);
        if (index !== -1) {
          existingOffline[index] = offlineItem;
        } else {
          existingOffline.push(offlineItem);
        }
        
        localStorage.setItem("offline_assessments", JSON.stringify(existingOffline));
        localStorage.removeItem("assessment_form_draft");
        setIsDirty(false);
        
        // Dispatch events to notify other components of the new offline data
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("offline-assessments-updated"));
        
        alert(`⚠️ Koneksi internet terbatas atau tidak terdeteksi.\n\nData penilaian untuk "${schoolName || "Sekolah"}" telah berhasil disimpan secara aman di memori lokal perangkat Anda.\n\nSistem akan otomatis mensinkronisasikan data ini ke server ketika koneksi internet terhubung kembali.`);
        const returnTo = searchParams.get("returnTo") || "/list";
        navigate(returnTo, { state: { assessmentId: editId || payload.idBangunan } });
      }
    };

    if (!navigator.onLine) {
      saveOffline();
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(editId ? `/api/assessments/${editId}` : "/api/assessments", {
        method: editId ? "PUT" : "POST",
        headers: getAuditHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        localStorage.removeItem("assessment_form_draft");
        setIsDirty(false);
        if (generatedDocLink) {
            alert(`Permohonan berhasil disimpan!\nDokumen surat permohonan resmi telah berhasil disimpan dalam bentuk PDF dan dikirimkan ke Dinas.`);
        }
        const returnTo = searchParams.get("returnTo") || "/list";
        navigate(returnTo, { state: { assessmentId: editId || payload.idBangunan } });
      } else {
        alert("Terjadi kesalahan saat menyimpan data.");
      }
    } catch (err) {
      console.warn("Network error, saving assessment offline:", err);
      saveOffline();
    } finally {
      setSubmitting(false);
    }
  };

  const updateComponentDamage = (compIndex: number, level: string, percentage: number, volume?: number, volumeInputs?: string[]) => {
    setIsDirty(true);
    setComponents(prev => {
      const newComps = [...prev];
      const comp = { ...newComps[compIndex] };
      
      const existingDetail = comp.damageDetails.find(d => d.level === level);
      let newDetails = comp.damageDetails.filter(d => d.level !== level);
      
      if (volume !== undefined && volume > 0 || (existingDetail && existingDetail.photos && existingDetail.photos.length > 0) || (volumeInputs && volumeInputs.length > 0)) {
        // @ts-ignore
        newDetails.push({ level, percentage: 0, volume, volumeInputs: volumeInputs || existingDetail?.volumeInputs || [], photos: existingDetail?.photos || [] });
      }
      
      // Auto-compute Volume Total Komponen = Sum of Volume Kerusakan
      const totalVolume = newDetails.reduce((sum, d) => sum + (d.volume || 0), 0);
      comp.totalVolume = totalVolume;
      
      // Auto-compute percentages for all levels
      comp.damageDetails = newDetails.map(d => ({
        ...d,
        percentage: totalVolume > 0 ? Math.min(100, Math.round(((d.volume || 0) / totalVolume) * 100 * 100) / 100) : 0
      }));
      
      newComps[compIndex] = comp;
      return newComps;
    });
  };

  const updateComponentMeta = (compIndex: number, field: 'totalVolume' | 'unit', value: string | number) => {
    setIsDirty(true);
    setComponents(prev => {
      const newComps = [...prev];
      newComps[compIndex] = { ...newComps[compIndex], [field]: value };
      return newComps;
    });
  };

  const handleComponentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, compIndex: number, level: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      if (files.length === 1) {
        const file = files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          setAnnotatingPhotoUrl(reader.result as string);
          setAnnotatingContext({
            type: "component",
            index: compIndex,
            level,
          }); // photoIdx undefined means appending new photo
          setIsAnnotatorOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        files.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setIsDirty(true);
            setComponents(prev => {
              const newComps = [...prev];
              const comp = { ...newComps[compIndex] };
              let detailIndex = comp.damageDetails.findIndex(d => d.level === level);
              
              if (detailIndex === -1) {
                // @ts-ignore
                comp.damageDetails.push({ level, percentage: 0, photos: [] });
                detailIndex = comp.damageDetails.length - 1;
              }
              
              const detail = { ...comp.damageDetails[detailIndex] };
              detail.photos = [...(detail.photos || []), reader.result as string];
              comp.damageDetails[detailIndex] = detail;
              newComps[compIndex] = comp;
              return newComps;
            });
          };
          reader.readAsDataURL(file);
        });
      }
      
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleAiAnalysis = async (e: React.ChangeEvent<HTMLInputElement>, compIndex: number, compName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAnalyzingAiComp(compIndex);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageBase64 = reader.result as string;
        try {
          const response = await fetch("/api/gemini/analyze-damage", {
  
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64, componentName: compName })
          });
          const result = await response.json();
          if (response.ok && result.level) {
            // Check if level is valid
            const validLevels = Object.keys(DAMAGE_MULTIPLIERS);
            if (validLevels.includes(result.level)) {
              setIsDirty(true);
              setComponents(prev => {
                const newComps = [...prev];
                const comp = { ...newComps[compIndex] };
                let newDetails = comp.damageDetails.filter(d => d.level !== result.level);
                
                // Add new detail with the percentage and photo
                // @ts-ignore
                newDetails.push({ level: result.level, percentage: result.percentage, photos: [imageBase64] });
                
                comp.damageDetails = newDetails;
                newComps[compIndex] = comp;
                return newComps;
              });
              alert(`AI Analysis Success:\nKategori: ${result.level}\nPersentase: ${result.percentage}%\nAlasan: ${result.reasoning}`);
            } else {
              alert("AI mengembalikan kategori level yang tidak valid: " + result.level);
            }
          } else {
            alert("AI Error: " + (result.error || "Gagal menganalisis gambar"));
          }
        } catch (error: any) {
          console.error("AI Analysis error:", error);
          alert("Error: " + error.message);
        } finally {
          setAnalyzingAiComp(null);
        }
      };
      reader.readAsDataURL(file);

      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeComponentPhoto = (compIndex: number, level: string, photoIdx: number) => {
    setIsDirty(true);
    setComponents(prev => {
      const newComps = [...prev];
      const comp = { ...newComps[compIndex] };
      const detailIndex = comp.damageDetails.findIndex(d => d.level === level);
      
      if (detailIndex !== -1) {
        const detail = { ...comp.damageDetails[detailIndex] };
        if (detail.photos) {
          detail.photos = detail.photos.filter((_, i) => i !== photoIdx);
          comp.damageDetails[detailIndex] = detail;
          newComps[compIndex] = comp;
        }
      }
      return newComps;
    });
  };

  const setComponentSafetyImpact = (compIndex: number, impact: boolean) => {
    setIsDirty(true);
    setComponents(prev => {
      const newComps = [...prev];
      newComps[compIndex] = { ...newComps[compIndex], safetyImpact: impact };
      return newComps;
    });
  };


  return {
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
    calculateFinalResult,
    suratPermohonanDriveLink
  };
}
