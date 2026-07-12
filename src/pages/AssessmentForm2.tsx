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
import PhotoAnnotator from "../components/PhotoAnnotator";
import SmartPhotoViewer from "../components/SmartPhotoViewer";

export default function AssessmentForm() {
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
  const [smartPreviewPhoto, setSmartPreviewPhoto] = useState<string | null>(null);

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
    if (data.components) setAllComponentsData(data.components);
    if (data.photos) setPhotos(data.photos);
    if (data.coordinates) setCoordinates(data.coordinates);
    if (data.idBangunan) setIdBangunan(data.idBangunan);
    if (data.customFields) setDynamicValues(data.customFields || {});
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
          setComponents(comps);
        } else {
          // fallback to defaults if api is empty
          const fallbackWeights = floorCount === 2 ? COMPONENT_WEIGHTS_2_LANTAI : floorCount >= 3 ? COMPONENT_WEIGHTS_3_LANTAI : COMPONENT_WEIGHTS_1_LANTAI;
          setComponentWeights(fallbackWeights);
          setComponents(Object.keys(COMPONENT_WEIGHTS_3_LANTAI).map(name => ({
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
        setComponents(Object.keys(COMPONENT_WEIGHTS_3_LANTAI).map(name => ({
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
      let docContent = `${kopText}SURAT PERMOHONAN PENILAIAN KERUSAKAN BANGUNAN GEDUNG
          
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
    if (token) {
      try {
        if (!documentLink) {
          const docTitle = `Surat Permohonan Penilaian Kerusakan - ${schoolName}`;
          const docContent = isPermohonanFlow
            ? `SURAT PERMOHONAN PENILAIAN KERUSAKAN BANGUNAN KEDINASAN
            
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
Pengelola Bangunan / Pemohon`
            : `SURAT PERMOHONAN PENILAIAN KERUSAKAN BANGUNAN

${getParamLabel("schoolName", "Nama Sekolah / Instansi")}: ${schoolName}
${getParamLabel("buildingName", "Nama Bangunan")}: ${buildingName}
${getParamLabel("npsn", "NPSN")}: ${npsn}
${getParamLabel("buildingArea", "Luas Bangunan")}: ${buildingArea} m2
${getParamLabel("address", "Alamat")}: ${address}
Kategori Kerusakan Awal: Rusak ${finalResult.category} (${finalResult.totalDamagePercentage.toFixed(1)}%)

Demikian permohonan ini kami sampaikan agar dapat ditindaklanjuti.
          `;
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
          isPermohonanFlow
            ? `Permohonan Baru (Menunggu Survei): ${schoolName} - ${buildingName}`
            : `Permohonan Baru: ${schoolName} - ${buildingName}`,
          isPermohonanFlow
            ? `Terdapat permohonan baru untuk ${schoolName} (Massa Bangunan: ${buildingName}).\nSurat permohonan resmi kedinasan telah digenerate.\nLihat dokumen resmi: ${documentLink}`
            : `Terdapat permohonan penilaian kerusakan baru untuk ${schoolName}.\nHasil sementara: Rusak ${finalResult.category} (${finalResult.totalDamagePercentage.toFixed(1)}%).\nLihat dokumen permohonan: ${documentLink}`
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
      photos,
      components,
      finalResult,
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
        navigate("/list");
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
        navigate("/list");
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
        navigate("/list");
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
                { num: 4, label: "Dokumentasi", desc: "Foto Bangunan", icon: Camera },
                { num: 5, label: "Ringkasan", desc: "Kesimpulan", icon: CheckCircle }
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

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Foto Kondisi Bangunan</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-square shadow-sm">
                      <img src={photo} alt={`Foto ${idx+1}`} className="w-full h-full object-cover cursor-pointer" onClick={() => setSmartPreviewPhoto(photo)} />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setAnnotatingPhotoUrl(photo);
                            setAnnotatingContext({ type: "main", photoIdx: idx });
                            setIsAnnotatorOpen(true);
                          }}
                          className="bg-pu-yellow hover:bg-yellow-400 text-slate-950 p-2.5 rounded-xl transition-all hover:scale-110 shadow cursor-pointer"
                          title="Coret / Anotasi"
                        >
                          <Paintbrush className="h-4 w-4 stroke-[2.5]" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removePhoto(idx)} 
                          className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-xl transition-all hover:scale-110 shadow cursor-pointer"
                          title="Hapus"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <label className={cn("border-2 border-dashed border-slate-300/50 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-white/40 hover:text-slate-800 hover:border-pu-blue transition-all cursor-pointer aspect-square shadow-inner bg-white/20 backdrop-blur-sm", uploadingPhoto && "opacity-50 cursor-not-allowed")}>
                    {uploadingPhoto ? (
                      <>
                        <CloudUpload className="h-8 w-8 mb-2 animate-bounce text-pu-blue" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2 opacity-70">Tambah Foto</span>
                      </>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  </label>
                </div>
              </div>
            </div>
            </div>
            
            {/* Validation Notice & Proceed Button */}
            <div className="p-6 border-t border-white/30 bg-white/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {(() => {
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
                if (photos.length === 0) {
                  missing.push({ label: "Foto Kondisi" });
                }

                const hasMissing = missing.length > 0;

                return (
                  <>
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
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}

        {step === 4 && isPermohonanFlow && (
          <motion.div 
            key="step3-permohonan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
          >
            <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
              <h3 className="text-sm font-bold text-slate-800">TAHAP 3: GENERATE SURAT PERMOHONAN RESMI KEDINASAN</h3>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistem menyusun surat permohonan dinas secara otomatis sesuai standar</p>
            </div>
            
            <div className="p-6 space-y-6">
              {!isLetterGenerated ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white/40 rounded-xl border border-dashed border-slate-300">
                  <FileTextIcon className="w-16 h-16 text-slate-400 mb-4 stroke-[1.5]" />
                  <h4 className="text-base font-bold text-slate-800">Belum Ada Surat yang Digenerate</h4>
                  <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
                    Sesuai aturan kedinasan, Anda wajib membuat surat permohonan resmi terlebih dahulu sebelum dapat melanjutkan ke tahap ringkasan dan pengiriman.
                  </p>
                  
                  <button
                    onClick={handleGenerateLetter}
                    disabled={isGeneratingLetter}
                    className="mt-6 inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl shadow-md text-white bg-pu-blue hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-105"
                  >
                    {isGeneratingLetter ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menggenerasi Surat Resmi...
                      </>
                    ) : (
                      "✨ Generate Surat Permohonan Otomatis"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Surat Permohonan Berhasil Digenerate!</p>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
                        Surat permohonan resmi kedinasan telah berhasil digenerate otomatis berdasarkan data isian Anda. Silakan buka editor dokumen di bawah ini (jika ada perubahan/tambahan) sebelum dikirim.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (generatedDocLink) window.open(generatedDocLink, "_blank");
                      }}
                      className="inline-flex items-center px-4 py-2.5 text-xs font-bold rounded-xl text-pu-blue bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
                    >
                      <FileTextIcon className="w-4 h-4 mr-2" />
                      Buka Editor Surat (Google Docs)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20">
              <button onClick={() => setStep(hasCriticalDamage ? 2 : 3)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 border border-white/50 hover:bg-white/80 transition-all">
                Kembali
              </button>
              
              <div className="flex gap-2">
                {isLetterGenerated && (
                  <button 
                    onClick={() => {
                      window.print();
                    }} 
                    className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Surat
                  </button>
                )}
                <button 
                  onClick={handleSubmit} 
                  disabled={!isLetterGenerated || submitting}
                  className={cn(
                    "inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all",
                    (!isLetterGenerated || submitting)
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/30" 
                      : "text-white bg-garut-green hover:bg-green-600 hover:scale-105 active:scale-95 animate-pulse"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Permohonan Resmi
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
          >
            <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
              <h3 className="text-sm font-bold text-slate-800">TAHAP 1: CEK KESELAMATAN VISUAL</h3>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pertanyaan fundamental terkait keselamatan struktur</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50/70 backdrop-blur-sm p-4 rounded-xl border border-red-200/50 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest">Penting</h4>
                    <p className="text-xs text-red-700/80 mt-1 font-medium">Jika Anda menjawab "Ya" pada salah satu indikasi bahaya di bawah ini, proses akan langsung disimpulkan sebagai "Rusak Berat" karena bangunan membahayakan keselamatan.</p>
                  </div>
                </div>
              </div>

              {SAFETY_QUESTIONS.map((q) => (
                <div key={q.id} className="bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{q.label}</h4>
                    <p className="text-xs text-slate-600 mt-1">{q.question}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setIsDirty(true);
                        setSafetyChecks(prev => ({...prev, [q.id]: true}));
                      }}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                        safetyChecks[q.id] === true 
                          ? "bg-red-500 text-white border-red-600 shadow-md" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      Ya
                    </button>
                    <button 
                      onClick={() => {
                        setIsDirty(true);
                        setSafetyChecks(prev => ({...prev, [q.id]: false}));
                      }}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                        safetyChecks[q.id] === false 
                          ? "bg-green-500 text-white border-green-600 shadow-md" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      Tidak
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20 backdrop-blur-sm">
              <button onClick={() => setStep(1)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm hover:bg-white/80 transition-all hover:scale-105 active:scale-95">
                Kembali
              </button>
              <button onClick={() => setStep(hasCriticalDamage ? 4 : 3)} className="inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl shadow-md text-pu-blue bg-pu-yellow hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95">
                {hasCriticalDamage ? "Lihat Kesimpulan" : "Lanjut ke Penilaian Detail"}
              </button>
            </div>
          </motion.div>
        )}


        {step === 3 && (
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
                if (weight === 0) return null;

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
                                    {photos.map((p, idx) => (
                                      <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 bg-slate-50 group cursor-pointer hover:shadow-sm transition-all" onClick={() => setSmartPreviewPhoto(p)}>
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

          <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20 backdrop-blur-sm">
            <button onClick={() => setStep(2)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm hover:bg-white/80 transition-all hover:scale-105 active:scale-95">
              Kembali
            </button>
            <button onClick={() => setStep(4)} className="inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl shadow-md text-pu-blue bg-pu-yellow hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95">
              {isPermohonanFlow ? "Lanjut ke Surat Permohonan" : "Lihat Ringkasan"}
            </button>
          </div>
        </motion.div>
      )}

      {step === 4 && !isPermohonanFlow && (() => {
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

              <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20 backdrop-blur-sm print:hidden">
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
        })()}
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
          photoUrl={smartPreviewPhoto} 
          fileName={smartPreviewPhoto.split('/').pop() || "Dokumentasi Bangunan"}
          onClose={() => setSmartPreviewPhoto(null)}
        />
      )}
    </div>
  );
}
