import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Loader2, Edit2, Trash2, Plus, Save, X, Info, Camera, HelpCircle, Layers, Users, Phone, Mail, Shield, UserCog, FileText, Printer, UploadCloud, CloudUpload, Settings as SettingsIcon, GripVertical, Sun, Moon, Check } from "lucide-react";
import { cn } from "../lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { getRolePermissions, saveRolePermissions, RolePermissionsType } from "../lib/permissions";

interface ComponentConfig {
  idKomponen: number;
  kategoriKomponen: string;
  namaKomponen: string;
  satuan: string;
  bobotFormA: string;
  bobotFormB: string;
  bobotFormC: string;
  tooltipText?: string;
  tooltipImage?: string;
  urutan?: number;
}

interface KatalogConfig {
  idKatalog: number;
  idKomponen: number;
  idKlasifikasi: number;
  deskripsiPupr: string;
  urlFotoContoh: string;
  namaKomponen?: string;
  namaKlasifikasi?: string;
}

interface ClassificationConfig {
  idKlasifikasi: number;
  namaKlasifikasi: string;
  nilaiFaktor: string;
}

interface UserConfig {
  idUser: number;
  uid: string;
  namaLengkap: string;
  email: string | null;
  role: 'Administrator' | 'Pengelola_Bangunan' | 'Operator' | 'Tim_Teknis' | 'Koordinator' | 'Kabid' | 'Kadis';
  kontakWhatsapp: string | null;
  createdAt?: string;
}

interface DinasConfig {
  id: number;
  namaDinas: string;
  alamat: string;
  kontak: string | null;
  email: string | null;
  website: string | null;
  idKadis: number | null;
  idKabid: number | null;
}


function SortableRow({ comp, editingId, editForm, setEditForm, handleSave, setIsAdding, setEditingId, handleInfoEdit, handleEdit, handleDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: comp.idKomponen });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className={"transition-colors " + (isDragging ? "bg-white shadow-xl opacity-80" : "hover:bg-white/40")}>
      <td className="px-2 py-3">
        <button className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      {editingId === comp.idKomponen ? (
        <>
          <td className="px-4 py-3">
            <select 
              value={editForm.kategoriKomponen || 'Struktur'} 
              onChange={(e) => setEditForm({...editForm, kategoriKomponen: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70"
            >
              <option value="Struktur">Struktur</option>
              <option value="Arsitektur">Arsitektur</option>
              <option value="Utilitas">Utilitas</option>
            </select>
          </td>
          <td className="px-4 py-3">
            <input 
              type="text" 
              value={editForm.namaKomponen || ''} 
              onChange={(e) => setEditForm({...editForm, namaKomponen: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="text" 
              value={editForm.satuan || ''} 
              onChange={(e) => setEditForm({...editForm, satuan: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-16"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="number" 
              step="0.01"
              value={editForm.bobotFormA || ''} 
              onChange={(e) => setEditForm({...editForm, bobotFormA: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="number"
              step="0.01"
              value={editForm.bobotFormB || ''} 
              onChange={(e) => setEditForm({...editForm, bobotFormB: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="number"
              step="0.01"
              value={editForm.bobotFormC || ''} 
              onChange={(e) => setEditForm({...editForm, bobotFormC: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
            />
          </td>
          <td className="px-4 py-3 text-right">
            <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1.5 rounded mr-1"><Save className="h-4 w-4" /></button>
            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded"><X className="h-4 w-4" /></button>
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">
            {comp.kategoriKomponen}
          </td>
          <td className="px-6 py-4 font-medium text-slate-800">
            {comp.namaKomponen}
          </td>
          <td className="px-6 py-4 text-xs text-slate-600 font-mono">
            {comp.satuan}
          </td>
          <td className="px-6 py-4 text-xs font-mono text-slate-600">
            {comp.bobotFormA}%
          </td>
          <td className="px-6 py-4 text-xs font-mono text-slate-600">
            {comp.bobotFormB}%
          </td>
          <td className="px-6 py-4 text-xs font-mono text-slate-600">
            {comp.bobotFormC}%
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end">
            <button onClick={() => handleInfoEdit(comp)} title="Atur Panduan Cara Menghitung Volume" className="text-slate-400 hover:text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors mr-1">
              <Info className="h-4 w-4" />
            </button>
            <button onClick={() => handleEdit(comp)} title="Edit Komponen" className="text-slate-400 hover:text-pu-blue hover:bg-blue-50 p-1.5 rounded transition-colors mr-1">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(comp.idKomponen)} title="Hapus" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </td>
        </>
      )}
    </tr>
  );
}


function SortableBuildingParamRow({ p, handleEditParam, handleDeleteParam }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className={"transition-colors " + (isDragging ? "bg-white shadow-xl opacity-80" : "hover:bg-white/40")}>
      <td className="px-2 py-4 w-8">
        <button className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{p.id}</td>
      <td className="px-6 py-4 font-bold text-slate-800">{p.label}</td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          {p.type}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-medium text-slate-500 italic">{p.placeholder || "-"}</td>
      <td className="px-6 py-4 text-center">
        <span className={p.required ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200"}>
          {p.required ? "WAJIB" : "OPSIONAL"}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={p.enabled ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200"}>
          {p.enabled ? "AKTIF" : "NONAKTIF"}
        </span>
      </td>
      <td className="px-6 py-4 text-right flex justify-end">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEditParam(p)}
            className="p-1.5 hover:bg-blue-50 hover:text-pu-blue rounded-md transition-all text-slate-500"
            title="Edit Parameter"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteParam(p.id)}
            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all text-slate-500"
            title="Hapus Parameter"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}


function SortableProfileParamRow({ p, handleEditProfileParam, handleDeleteProfileParam }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className={"transition-colors " + (isDragging ? "bg-white shadow-xl opacity-80" : "hover:bg-white/40")}>
      <td className="px-2 py-4 w-8">
        <button className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{p.id}</td>
      <td className="px-6 py-4 font-bold text-slate-800">{p.label}</td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          {p.type}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-medium text-slate-500 italic">{p.placeholder || "-"}</td>
      <td className="px-6 py-4 text-center">
        <span className={p.required ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200"}>
          {p.required ? "WAJIB" : "OPSIONAL"}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={p.enabled ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200"}>
          {p.enabled ? "AKTIF" : "NONAKTIF"}
        </span>
      </td>
      <td className="px-6 py-4 text-right flex justify-end">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEditProfileParam(p)}
            className="p-1.5 hover:bg-blue-50 hover:text-pu-blue rounded-md transition-all text-slate-500"
            title="Edit Parameter Profil"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteProfileParam(p.id)}
            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all text-slate-500"
            title="Hapus Parameter Profil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Settings() {



  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  
  
  const handleDragEndProfileParams = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setProfileParams((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        fetch("/api/profile-parameters/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parameters: newItems })
        }).catch(err => console.error("Failed to save profile parameters reorder", err));

        return newItems;
      });
    }
  };

  const handleDragEndBuildingParams = async (event: any) => {

    const { active, over } = event;
    if (active.id !== over.id) {
      setBuildingParams((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        fetch("/api/building-parameters/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parameters: newItems })
        }).catch(err => console.error("Failed to save building parameters reorder", err));

        return newItems;
      });
    }
  };

  const handleDragEnd = async (event: any) => {

    const { active, over } = event;
    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.idKomponen === active.id);
        const newIndex = items.findIndex((item) => item.idKomponen === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update urutan values
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          urutan: index
        }));

        // Send to backend
        fetch("/api/components/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            components: updatedItems.map(item => ({ idKomponen: item.idKomponen, urutan: item.urutan }))
          })
        }).catch(err => console.error("Failed to save reorder", err));

        return updatedItems;
      });
    }
  };

  const [activeRole, setActiveRole]
 = useState<string>(() => {
    return localStorage.getItem("activeRole") || "Administrator";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event("storage"));
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = () => {
      setActiveRole(localStorage.getItem("activeRole") || "Administrator");
      const currentTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
      setTheme(currentTheme);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isPengelola = activeRole === "Pengelola_Bangunan" || activeRole === "Operator";

  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ComponentConfig>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [infoEditingId, setInfoEditingId] = useState<number | null>(null);
  const [infoEditForm, setInfoEditForm] = useState<Partial<ComponentConfig>>({});

  const getAvailableTabsList = (role: string) => {
    switch (role) {
      case "Administrator":
        return ["aplikasi", "komponen", "katalog", "users", "formulir", "param_profil", "dinas", "surat", "template", "ai"];
      case "Kadis":
      case "Kabid":
        return ["aplikasi", "dinas", "surat", "users"];
      case "Koordinator":
      case "Tim_Teknis":
        return ["komponen", "katalog", "formulir"];
      case "Operator":
      case "Pengelola_Bangunan":
      default:
        return ["surat", "dinas", "param_profil"];
    }
  };

  // Tab & Katalog Visual States
  const [activeTab, setActiveTab] = useState<any>(() => {
    const role = localStorage.getItem("activeRole") || "Administrator";
    return getAvailableTabsList(role)[0];
  });

  useEffect(() => {
    setActiveTab(getAvailableTabsList(activeRole)[0]);
  }, [activeRole]);

  const [aiConfig, setAiConfig] = useState<any>({
    apiKey: "",
    model: "gemini-3.5-flash",
    autoAnalyze: true,
    confidenceThreshold: 85,
    visionPrompt: "",
    documentPrompt: ""
  });
  const [isSavingAi, setIsSavingAi] = useState(false);

  // Letter Template configurations
  interface LetterSection {
    logoKiri: string;
    logoKanan: string;
    namaInstansiAtas: string;
    namaInstansiBawah: string;
    alamat: string;
    email: string;
    website: string;
    nomorTelepon: string;
    namaKepala: string;
    nipKepala: string;
    jabatan: string;
  }
  interface LetterConfig {
    sistem: LetterSection;
    pengelola: LetterSection;
  }
  
  interface AppConfig {
    logoKiri: string;
    logoKanan: string;
    templateDriveLink?: string;
  }
  
  const [appConfig, setAppConfig] = useState<AppConfig>({ logoKiri: "", logoKanan: "", templateDriveLink: "" });
  const [loadingAppConfig, setLoadingAppConfig] = useState(false);
  const [editingAppConfig, setEditingAppConfig] = useState(false);
  const [appConfigForm, setAppConfigForm] = useState<AppConfig>({ logoKiri: "", logoKanan: "", templateDriveLink: "" });

  const [letterConfig, setLetterConfig] = useState<LetterConfig | null>(null);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [editingLetter, setEditingLetter] = useState(false);
  const [letterForm, setLetterForm] = useState<LetterConfig | null>(null);

  // === Pusat Template State ===
  const [docTemplates, setDocTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateContent, setEditingTemplateContent] = useState("");
  const [editingTemplateDriveLink, setEditingTemplateDriveLink] = useState("");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  
  const [editingDriveLink, setEditingDriveLink] = useState(false);
  const [driveLinkInput, setDriveLinkInput] = useState("");

  const [katalogList, setKatalogList] = useState<KatalogConfig[]>([]);
  const [classifications, setClassifications] = useState<ClassificationConfig[]>([]);
  const [loadingKatalog, setLoadingKatalog] = useState(false);
  const [editingKatalogId, setEditingKatalogId] = useState<number | null>(null);
  const [isAddingKatalog, setIsAddingKatalog] = useState(false);
  const [katalogForm, setKatalogForm] = useState<Partial<KatalogConfig>>({
    idKomponen: undefined,
    idKlasifikasi: undefined,
    deskripsiPupr: "",
    urlFotoContoh: ""
  });
  const [filterComponent, setFilterComponent] = useState<string>("");

  // User Management States
  const [usersList, setUsersList] = useState<UserConfig[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState<Partial<UserConfig>>({
    namaLengkap: "",
    email: "",
    role: "Pengelola_Bangunan",
    kontakWhatsapp: ""
  });

  // Dynamic Role Permissions Configurations State
  const [rolePermissions, setRolePermissions] = useState<Record<string, {
    name: string;
    description: string;
    permissions: Record<string, boolean>;
  }>>(getRolePermissions() as any);

  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Dinas Configuration State
  const [dinasConfig, setDinasConfig] = useState<DinasConfig | null>(null);
  const [loadingDinas, setLoadingDinas] = useState(false);
  const [editingDinas, setEditingDinas] = useState(false);
  const [dinasForm, setDinasForm] = useState<Partial<DinasConfig>>({});

  interface BuildingParamConfig {
    id: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select';
    placeholder: string;
    required: boolean;
    enabled: boolean;
    showInPermohonan?: boolean;
    showInPenilaian?: boolean;
  }
  const [buildingParams, setBuildingParams] = useState<BuildingParamConfig[]>([]);
  const [loadingParams, setLoadingParams] = useState(false);
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [isAddingParam, setIsAddingParam] = useState(false);
  const [paramForm, setParamForm] = useState<Partial<BuildingParamConfig>>({
    label: "",
    type: "text",
    placeholder: "",
    required: true,
    enabled: true
  });

  const fetchBuildingParams = async () => {
    setLoadingParams(true);
    try {
      const res = await fetch("/api/building-parameters");
      const data = await res.json();
      if (Array.isArray(data)) { setBuildingParams(data); } else { setBuildingParams([]); }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingParams(false);
    }
  };

  const handleEditParam = (param: BuildingParamConfig) => {
    setEditingParamId(param.id);
    setParamForm(param);
    setIsAddingParam(false);
  };

  const handleSaveParam = async () => {
    if (!paramForm.label) {
      alert("Label parameter wajib diisi!");
      return;
    }
    try {
      if (isAddingParam) {
        await fetch("/api/building-parameters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paramForm),
        });
      } else {
        await fetch(`/api/building-parameters/${editingParamId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paramForm),
        });
      }
      setEditingParamId(null);
      setIsAddingParam(false);
      fetchBuildingParams();
      setSaveToast("Parameter formulir berhasil disimpan!");
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteParam = async (id: string) => {
    if (!confirm("Hapus parameter formulir ini?")) return;
    try {
      const res = await fetch(`/api/building-parameters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Gagal menghapus parameter formulir.");
        return;
      }
      fetchBuildingParams();
      setSaveToast("Parameter formulir berhasil dihapus!");
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    }
  };

  interface ProfileParamConfig {
    id: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select';
    placeholder: string;
    required: boolean;
    enabled: boolean;
  }
  const [profileParams, setProfileParams] = useState<ProfileParamConfig[]>([]);
  const [loadingProfileParams, setLoadingProfileParams] = useState(false);
  const [editingProfileParamId, setEditingProfileParamId] = useState<string | null>(null);
  const [isAddingProfileParam, setIsAddingProfileParam] = useState(false);
  const [profileParamForm, setProfileParamForm] = useState<Partial<ProfileParamConfig>>({
    label: "",
    type: "text",
    placeholder: "",
    required: false,
    enabled: true
  });

  const fetchProfileParams = async () => {
    setLoadingProfileParams(true);
    try {
      const res = await fetch("/api/profile-parameters");
      const data = await res.json();
      if (Array.isArray(data)) { setProfileParams(data); } else { setProfileParams([]); }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfileParams(false);
    }
  };

  const handleEditProfileParam = (param: ProfileParamConfig) => {
    setEditingProfileParamId(param.id);
    setProfileParamForm(param);
    setIsAddingProfileParam(false);
  };

  const handleSaveProfileParam = async () => {
    if (!profileParamForm.label) {
      alert("Label parameter wajib diisi!");
      return;
    }
    try {
      if (isAddingProfileParam) {
        await fetch("/api/profile-parameters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileParamForm),
        });
      } else {
        await fetch(`/api/profile-parameters/${editingProfileParamId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileParamForm),
        });
      }
      setEditingProfileParamId(null);
      setIsAddingProfileParam(false);
      fetchProfileParams();
      setSaveToast("Parameter profil berhasil disimpan!");
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteProfileParam = async (id: string) => {
    if (!confirm("Hapus parameter profil ini?")) return;
    try {
      const res = await fetch(`/api/profile-parameters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Gagal menghapus parameter profil.");
        return;
      }
      fetchProfileParams();
      setSaveToast("Parameter profil berhasil dihapus!");
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    }
  };

  const handleTogglePermission = (roleKey: string, permKey: string) => {
    setRolePermissions(prev => {
      const currentRole = prev[roleKey];
      const updated = {
        ...prev,
        [roleKey]: {
          ...currentRole,
          permissions: {
            ...currentRole.permissions,
            [permKey]: !currentRole.permissions[permKey]
          }
        }
      };
      
      saveRolePermissions(updated as RolePermissionsType);
      
      // Show elegant toast confirmation
      setSaveToast(`Hak akses '${permKey}' untuk ${currentRole.name} berhasil diperbarui!`);
      setTimeout(() => setSaveToast(null), 3000);

      return updated;
    });
  };

  const fetchAppConfig = async () => {
    setLoadingAppConfig(true);
    try {
      const res = await fetch("/api/app-settings");
      const data = await res.json();
      setAppConfig(data);
      setAppConfigForm(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAppConfig(false);
    }
  };

  const handleSaveAppConfig = async () => {
    try {
      const res = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appConfigForm)
      });
      if (res.ok) {
        setAppConfig(appConfigForm);
        setEditingAppConfig(false);
        setSaveToast("Pengaturan logo aplikasi berhasil disimpan!");
        setTimeout(() => setSaveToast(null), 3000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDinas = async () => {
    setLoadingDinas(true);
    try {
      const res = await fetch("/api/dinas");
      const data = await res.json();
      setDinasConfig(data);
      setDinasForm(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDinas(false);
    }
  };

  const handleSaveDinas = async () => {
    if (!dinasForm.namaDinas || !dinasForm.alamat) {
      alert("Nama Dinas dan Alamat wajib diisi!");
      return;
    }
    try {
      const res = await fetch("/api/dinas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dinasForm),
      });
      const data = await res.json();
      setDinasConfig(data);
      setEditingDinas(false);
      setSaveToast("Pengaturan profil dinas berhasil disimpan!");
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan profil dinas");
    }
  };

  const fetchLetterConfig = async () => {
    setLoadingLetter(true);
    try {
      const res = await fetch("/api/pengaturan-surat");
      const data = await res.json();
      setLetterConfig(data);
      setLetterForm(data);
    } catch (error) {
      console.error("Gagal mengambil pengaturan surat", error);
    } finally {
      setLoadingLetter(false);
    }
  };

  const handleSaveLetter = async () => {
    if (!letterForm) return;
    try {
      const res = await fetch("/api/pengaturan-surat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(letterForm),
      });
      const data = await res.json();
      setLetterConfig(data);
      setEditingLetter(false);
      setSaveToast("Pengaturan kop surat dinas & pengelola berhasil disimpan!");
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan pengaturan surat");
    }
  };

  // === PUSAT TEMPLATE FUNCTIONS ===
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
      setSaveToast(`Template "${updated.nama}" berhasil disimpan!`);
      setTimeout(() => setSaveToast(null), 3000);
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
      setSaveToast(`Template "${updated.nama}" berhasil direset ke default!`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert("Gagal mereset template");
    }
  };

  const handleSaveDriveLink = async () => {
    try {
      const updatedConfig = { ...appConfig, templateDriveLink: driveLinkInput };
      const res = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        setAppConfig(updatedConfig);
        setAppConfigForm(updatedConfig);
        setEditingDriveLink(false);
        setSaveToast("Link Google Drive berhasil disimpan!");
        setTimeout(() => setSaveToast(null), 3000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoKiri' | 'logoKanan') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppConfigForm(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'sistem.logoKiri' | 'sistem.logoKanan' | 'pengelola.logoKiri' | 'pengelola.logoKanan') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const parts = field.split('.');
        const type = parts[0] as 'sistem' | 'pengelola';
        const key = parts[1] as 'logoKiri' | 'logoKanan';
        
        setLetterForm(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            [type]: {
              ...prev[type],
              [key]: base64String
            }
          };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchComponents();
    fetchKatalog();
    fetchClassifications();
    fetchUsers();
    fetchBuildingParams();
    fetchProfileParams();
    fetchDinas();
    fetchLetterConfig();
    fetchAppConfig();
    fetchAiConfig();
    fetchDocTemplates();
  }, []);

  // Real-time auto-refresh untuk tab users
  useEffect(() => {
    let interval: any;
    if (activeTab === "users") {
      interval = setInterval(() => {
        fetchUsers(true);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  const fetchAiConfig = async () => {
    try {
      const res = await fetch('/api/ai-settings');
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setAiConfig(data);
      }
    } catch (err) {
      console.error("Failed to fetch ai settings:", err);
    }
  };

  const handleSaveAiConfig = async () => {
    setIsSavingAi(true);
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig)
      });
      if (res.ok) {
        alert('Pengaturan AI berhasil disimpan');
      } else {
        alert('Gagal menyimpan pengaturan AI');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan pengaturan AI');
    }
    setIsSavingAi(false);
  };

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/components");
      const data = await res.json();
      if (Array.isArray(data)) { setComponents(data); } else { setComponents([]); console.error("Invalid components data:", data); }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKatalog = async () => {
    setLoadingKatalog(true);
    try {
      const res = await fetch("/api/katalog");
      const data = await res.json();
      if (Array.isArray(data)) { setKatalogList(data); } else { setKatalogList([]); console.error("Invalid katalog data:", data); }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingKatalog(false);
    }
  };

  const fetchClassifications = async () => {
    try {
      const res = await fetch("/api/klasifikasi");
      const data = await res.json();
      if (Array.isArray(data)) { setClassifications(data); } else { setClassifications([]); }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) { setUsersList(data); } else { setUsersList([]); }
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoadingUsers(false);
    }
  };

  const handleEditUser = (user: UserConfig) => {
    setEditingUserId(user.idUser);
    setUserForm(user);
    setIsAddingUser(false);
  };

  const handleSaveUser = async () => {
    if (!userForm.namaLengkap) {
      alert("Nama Lengkap wajib diisi!");
      return;
    }
    try {
      if (isAddingUser) {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
      } else {
        await fetch(`/api/users/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
      }
      setEditingUserId(null);
      setIsAddingUser(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Hapus user ini?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Gagal menghapus user. Silakan coba lagi.");
        return;
      }
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi saat mencoba menghapus user.");
    }
  };

  const handleEdit = (comp: ComponentConfig) => {
    setEditingId(comp.idKomponen);
    setEditForm(comp);
    setIsAdding(false);
  };

  const handleInfoEdit = (comp: ComponentConfig) => {
    setInfoEditingId(comp.idKomponen);
    setInfoEditForm(comp);
  };

  const handleInfoSave = async () => {
    try {
      await fetch(`/api/components/${infoEditingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoEditForm),
      });
      setInfoEditingId(null);
      fetchComponents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await fetch("/api/components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });
      } else {
        await fetch(`/api/components/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });
      }
      setEditingId(null);
      setIsAdding(false);
      fetchComponents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus komponen ini?")) return;
    try {
      const res = await fetch(`/api/components/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Gagal menghapus komponen.");
        return;
      }
      fetchComponents();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    }
  };

  // Katalog Visual Handlers
  const handleEditKatalog = (kat: KatalogConfig) => {
    setEditingKatalogId(kat.idKatalog);
    setKatalogForm(kat);
    setIsAddingKatalog(false);
  };

  const handleSaveKatalog = async () => {
    if (!katalogForm.idKomponen || !katalogForm.idKlasifikasi || !katalogForm.deskripsiPupr) {
      alert("Komponen, Tingkat Kerusakan, dan Deskripsi wajib diisi!");
      return;
    }
    try {
      if (isAddingKatalog) {
        await fetch("/api/katalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(katalogForm),
        });
      } else {
        await fetch(`/api/katalog/${editingKatalogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(katalogForm),
        });
      }
      setEditingKatalogId(null);
      setIsAddingKatalog(false);
      fetchKatalog();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteKatalog = async (id: number) => {
    if (!confirm("Hapus panduan visual ini?")) return;
    try {
      const res = await fetch(`/api/katalog/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Gagal menghapus panduan visual.");
        return;
      }
      fetchKatalog();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    }
  };

  const availableTabs = getAvailableTabsList(activeRole);

  const ALL_TABS = [
    { id: "aplikasi", label: "Logo Aplikasi", icon: SettingsIcon },
    { id: "komponen", label: "Parameter Komponen", icon: Layers },
    { id: "katalog", label: "Kamus Visual (PUPR)", icon: HelpCircle },
    { id: "users", label: "Pengaturan User", icon: Users },
    { id: "formulir", label: "Parameter Formulir", icon: Info },
    { id: "param_profil", label: "Parameter Profil", icon: UserCog },
    { id: "dinas", label: "Profil Dinas", icon: Shield },
    { id: "surat", label: "Kop Surat", icon: Printer },
    { id: "template", label: "Pusat Template", icon: FileText },
    { id: "ai", label: "Pengaturan AI", icon: Brain },
  ];


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* Tabs Selector */}
      <div className="flex overflow-x-auto custom-scrollbar bg-slate-200/50 backdrop-blur-sm p-1 rounded-2xl max-w-5xl border border-slate-200/50 shadow-inner gap-1">
        {ALL_TABS.filter(t => availableTabs.includes(t.id)).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-shrink-0 flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white text-pu-blue shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-600" />
                Pengaturan Kecerdasan Buatan (AI)
              </h2>
              <p className="text-sm text-slate-500 mt-1">Konfigurasi parameter model, tingkat deteksi, dan instruksi mesin (Prompt Engineering).</p>
            </div>
            <button 
              onClick={handleSaveAiConfig}
              disabled={isSavingAi}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {isSavingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Konfigurasi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-slate-400" /> Konfigurasi Utama
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">API Key Gemini</label>
                <input 
                  type="password" 
                  value={aiConfig.apiKey}
                  onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                  placeholder="Biarkan kosong untuk menggunakan .env (Server)"
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Kredensial dari Google AI Studio. Sangat rahasia.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model Visual Default</label>
                <select 
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Sangat Cepat)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Akurat & Detail)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Analisis Otomatis</h4>
                  <p className="text-[10px] text-slate-500">Memicu deteksi visual langsung saat foto diunggah.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={aiConfig.autoAnalyze} onChange={(e) => setAiConfig({...aiConfig, autoAnalyze: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Tingkat Keyakinan Minimum (Threshold)</label>
                  <span className="text-xs font-mono font-bold text-indigo-600">{aiConfig.confidenceThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" max="99" 
                  value={aiConfig.confidenceThreshold}
                  onChange={(e) => setAiConfig({...aiConfig, confidenceThreshold: parseInt(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">Sistem hanya akan menyetujui temuan AI dengan keyakinan di atas persentase ini.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-slate-400" /> Prompt Engineering
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi AI (Vision Damage Detection)</label>
                <textarea 
                  rows={5}
                  value={aiConfig.visionPrompt}
                  onChange={(e) => setAiConfig({...aiConfig, visionPrompt: e.target.value})}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 mt-1">Prompt utama yang digunakan untuk mendeteksi retak dan kerusakan struktur dari gambar.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi AI (Document Review)</label>
                <textarea 
                  rows={5}
                  value={aiConfig.documentPrompt}
                  onChange={(e) => setAiConfig({...aiConfig, documentPrompt: e.target.value})}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 mt-1">Prompt khusus untuk mendeteksi masalah administratif/kelaikan pada PDF dan dokumen.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "aplikasi" && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Logo Aplikasi</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Atur logo utama yang tampil di seluruh sistem
              </p>
            </div>
            {!editingAppConfig ? (
              <button 
                onClick={() => {
                  setEditingAppConfig(true);
                  setAppConfigForm(appConfig);
                }}
                className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
              >
                <Edit2 className="h-4 w-4 mr-2" /> Edit Logo
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingAppConfig(false);
                    setAppConfigForm(appConfig);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveAppConfig}
                  className="px-4 py-2 bg-pu-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Simpan Logo
                </button>
              </div>
            )}
          </div>

          {loadingAppConfig ? (
            <div className="py-8 text-center text-slate-500 font-medium animate-pulse">Memuat pengaturan aplikasi...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-[11px] font-bold text-slate-600">Logo Aplikasi (Kiri)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    disabled={!editingAppConfig}
                    value={appConfigForm.logoKiri} 
                    onChange={e => setAppConfigForm({ ...appConfigForm, logoKiri: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                  />
                  <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!editingAppConfig}
                      className="hidden"
                      onChange={e => handleAppLogoUpload(e, 'logoKiri')}
                    />
                  </label>
                </div>
                {appConfigForm.logoKiri && (
                  <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-center">
                    <img src={appConfigForm.logoKiri} alt="Preview Logo Kiri" className="h-16 object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-bold text-slate-600">Logo Aplikasi (Kanan)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    disabled={!editingAppConfig}
                    value={appConfigForm.logoKanan} 
                    onChange={e => setAppConfigForm({ ...appConfigForm, logoKanan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                  />
                  <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!editingAppConfig}
                      className="hidden"
                      onChange={e => handleAppLogoUpload(e, 'logoKanan')}
                    />
                  </label>
                </div>
                {appConfigForm.logoKanan && (
                  <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-center">
                    <img src={appConfigForm.logoKanan} alt="Preview Logo Kanan" className="h-16 object-contain" />
                  </div>
                )}
              </div>
              
              {/* Template Drive Link */}
              <div className="space-y-4 md:col-span-2 border-t border-slate-200 pt-6 mt-2">
                <label className="block text-[11px] font-bold text-slate-600">Link Folder Google Drive (Template Dokumen)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    disabled={!editingAppConfig}
                    value={appConfigForm.templateDriveLink || ""} 
                    onChange={e => setAppConfigForm({ ...appConfigForm, templateDriveLink: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60"
                    placeholder="https://drive.google.com/drive/folders/..." 
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Tautan ke folder Google Drive yang berisi format asli (Word/Excel) dari template dokumen aplikasi.</p>
              </div>
            </div>
          )}

          {/* Pengaturan Tema & Tampilan */}
          <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Pengaturan Tema & Tampilan</h3>
              <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                Pilih tema tampilan sistem yang paling nyaman untuk Anda
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Mode Button Option */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer",
                  theme === "light"
                    ? "bg-white border-pu-blue shadow-md scale-[1.01] dark:bg-slate-800 dark:border-pu-blue"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 dark:bg-slate-800/20 dark:border-slate-700 dark:hover:bg-slate-800/40"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl border transition-all duration-300",
                  theme === "light"
                    ? "bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-950/35 dark:border-amber-900/50"
                    : "bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
                )}>
                  <Sun className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    Mode Terang
                    {theme === "light" && (
                      <span className="bg-pu-blue text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Aktif</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                    Tampilan klasik bernuansa terang dengan kontras tajam, ideal untuk penggunaan di siang hari atau ruangan terang benderang.
                  </p>
                </div>
              </button>

              {/* Dark Mode Button Option */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer",
                  theme === "dark"
                    ? "bg-white border-pu-blue shadow-md scale-[1.01] dark:bg-slate-800 dark:border-pu-blue"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 dark:bg-slate-800/20 dark:border-slate-700 dark:hover:bg-slate-800/40"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl border transition-all duration-300",
                  theme === "dark"
                    ? "bg-indigo-50 text-indigo-500 border-indigo-100 dark:bg-indigo-950/35 dark:border-indigo-900/50 dark:text-indigo-400"
                    : "bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
                )}>
                  <Moon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    Mode Gelap
                    {theme === "dark" && (
                      <span className="bg-pu-blue text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Aktif</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                    Tampilan bernuansa gelap yang modern, dirancang khusus untuk kenyamanan mata di malam hari atau lingkungan redup.
                  </p>
                </div>
              </button>
            </div>
          </div>

        </div>
      )}

      {activeTab === "komponen" && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col">
          <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Parameter Komponen</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kelola bobot dan daftar komponen penilaian</p>
            </div>
            <button 
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setEditForm({ kategoriKomponen: 'Struktur', satuan: '%', bobotFormA: '0.00', bobotFormB: '0.00', bobotFormC: '0.00' });
              }}
              className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah
            </button>
          </div>

        <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-left">
              <thead className="text-[10px] text-pu-blue uppercase font-bold border-b border-white/30 bg-white/30 backdrop-blur-md">
              <tr>
                <th className="px-2 py-4 w-8"></th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Nama Komponen</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4">Bobot Form A</th>
                <th className="px-6 py-4">Bobot Form B</th>
                <th className="px-6 py-4">Bobot Form C</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/20 bg-transparent">
              {isAdding && (
                <tr className="bg-blue-50/50 backdrop-blur-sm">
                  <td className="px-2 py-3"></td>
                  <td className="px-4 py-3">
                    <select 
                      value={editForm.kategoriKomponen || 'Struktur'} 
                      onChange={(e) => setEditForm({...editForm, kategoriKomponen: e.target.value})}
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70"
                    >
                      <option value="Struktur">Struktur</option>
                      <option value="Arsitektur">Arsitektur</option>
                      <option value="Utilitas">Utilitas</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={editForm.namaKomponen || ''} 
                      onChange={(e) => setEditForm({...editForm, namaKomponen: e.target.value})}
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 placeholder:text-slate-400"
                      placeholder="Nama"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={editForm.satuan || ''} 
                      onChange={(e) => setEditForm({...editForm, satuan: e.target.value})}
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-16"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      step="0.01"
                      value={editForm.bobotFormA || ''} 
                      onChange={(e) => setEditForm({...editForm, bobotFormA: e.target.value})}
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number"
                      step="0.01"
                      value={editForm.bobotFormB || ''} 
                      onChange={(e) => setEditForm({...editForm, bobotFormB: e.target.value})}
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number"
                      step="0.01"
                      value={editForm.bobotFormC || ''} 
                      onChange={(e) => setEditForm({...editForm, bobotFormC: e.target.value})}
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1.5 rounded mr-1"><Save className="h-4 w-4" /></button>
                    <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded"><X className="h-4 w-4" /></button>
                  </td>
                </tr>
              )}
              
              <SortableContext 
                  items={components.map(c => c.idKomponen)}
                  strategy={verticalListSortingStrategy}
                >
                  {components.map((comp) => (
                    <SortableRow 
                      key={comp.idKomponen} 
                      comp={comp}
                      editingId={editingId}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      handleSave={handleSave}
                      setIsAdding={setIsAdding}
                      setEditingId={setEditingId}
                      handleInfoEdit={handleInfoEdit}
                      handleEdit={handleEdit}
                      handleDelete={handleDelete}
                    />
                  ))}
                </SortableContext>

              {components.length === 0 && !loading && !isAdding && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                    Belum ada data komponen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </DndContext>
          {loading && (
            <div className="p-16 flex justify-center">
              <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    )}

      {activeTab === "katalog" && (
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Kamus Visual Kerusakan (Panduan Lapangan)</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Kelola foto referensi dan penjelasan teknis berdasarkan tingkat kerusakan untuk membantu pengurus awam.</p>
            </div>
            <button 
              onClick={() => {
                setIsAddingKatalog(true);
                setEditingKatalogId(null);
                setKatalogForm({
                  idKomponen: components[0]?.idKomponen || undefined,
                  idKlasifikasi: classifications.find(cl => cl.namaKlasifikasi === "Ringan")?.idKlasifikasi || undefined,
                  deskripsiPupr: "",
                  urlFotoContoh: ""
                });
              }}
              className="inline-flex items-center px-4 py-2.5 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Panduan Visual
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter Komponen:</span>
              <select
                value={filterComponent}
                onChange={e => setFilterComponent(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-200/60 bg-white/80 focus:ring-pu-blue focus:border-pu-blue"
              >
                <option value="">-- Semua Komponen --</option>
                {components.map(c => (
                  <option key={c.idKomponen} value={c.namaKomponen}>{c.namaKomponen}</option>
                ))}
              </select>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Menampilkan {
                katalogList.filter(k => !filterComponent || k.namaKomponen === filterComponent).length
              } Panduan
            </div>
          </div>

          {/* Grid View */}
          {loadingKatalog ? (
            <div className="p-16 flex justify-center">
              <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {katalogList
                .filter(k => !filterComponent || k.namaKomponen === filterComponent)
                .map((kat) => {
                  const isRingan = kat.namaKlasifikasi === "Ringan";
                  const isSedang = kat.namaKlasifikasi === "Sedang";
                  const isBerat = kat.namaKlasifikasi === "Berat";

                  return (
                    <motion.div
                      layout
                      key={kat.idKatalog}
                      className={cn(
                        "rounded-2xl border overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md hover:scale-[1.01]",
                        isRingan ? "bg-green-50/20 border-green-200/80" :
                        isSedang ? "bg-yellow-50/20 border-yellow-200/80" :
                        isBerat ? "bg-orange-50/20 border-orange-200/80" :
                        "bg-slate-50/20 border-slate-200"
                      )}
                    >
                      <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                        {kat.urlFotoContoh ? (
                          <img 
                            src={kat.urlFotoContoh} 
                            alt={kat.namaKomponen} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center justify-center p-4">
                            <Camera className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs">Belum ada gambar contoh</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-pu-blue/90 uppercase tracking-wider backdrop-blur-sm shadow-sm">
                            {kat.namaKomponen}
                          </span>
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-sm",
                            isRingan ? "bg-green-600/90" :
                            isSedang ? "bg-yellow-600/90" :
                            isBerat ? "bg-orange-600/90" :
                            "bg-slate-600/90"
                          )}>
                            Rusak {kat.namaKlasifikasi}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi Panduan Teknis</span>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {kat.deskripsiPupr}
                          </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100/50">
                          <button
                            onClick={() => handleEditKatalog(kat)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-pu-blue hover:border-pu-blue text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteKatalog(kat.idKatalog)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-200 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

              {katalogList.filter(k => !filterComponent || k.namaKomponen === filterComponent).length === 0 && (
                <div className="col-span-full bg-white/40 border border-slate-200/50 rounded-2xl p-12 text-center text-sm font-medium text-slate-500 flex flex-col items-center justify-center">
                  <HelpCircle className="w-12 h-12 text-slate-300 mb-2" />
                  Belum ada panduan visual untuk komponen yang dipilih.
                  <button 
                    onClick={() => {
                      setIsAddingKatalog(true);
                      setEditingKatalogId(null);
                      setKatalogForm({
                        idKomponen: components.find(c => !filterComponent || c.namaKomponen === filterComponent)?.idKomponen || components[0]?.idKomponen || undefined,
                        idKlasifikasi: classifications.find(cl => cl.namaKlasifikasi === "Ringan")?.idKlasifikasi || undefined,
                        deskripsiPupr: "",
                        urlFotoContoh: ""
                      });
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Tambah Panduan Pertama
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Manajemen Pengguna & Hak Akses</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Atur akun petugas, operator dinas, tim teknis lapangan, dan pimpinan untuk koordinasi terintegrasi.</p>
            </div>
            <button 
              onClick={() => {
                setIsAddingUser(true);
                setEditingUserId(null);
                setUserForm({
                  namaLengkap: "",
                  email: "",
                  role: "Pengelola_Bangunan",
                  kontakWhatsapp: ""
                });
              }}
              className="inline-flex items-center px-4 py-2.5 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah User Baru
            </button>
          </div>

          {/* User List Table/Cards */}
          {loadingUsers ? (
            <div className="p-16 flex justify-center">
              <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hak Akses / Role</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">No. WhatsApp</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/55">
                    {usersList.map((user) => {
                      const isSystemDefault = user.uid === 'system_default_uid';
                      
                      return (
                        <tr key={user.idUser} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                                {user.namaLengkap.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs md:text-sm">{user.namaLengkap}</p>
                                <p className="text-[10px] text-slate-400 font-mono font-medium">ID: {user.idUser}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 font-medium font-mono">
                            {user.email || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                              user.role === "Administrator" ? "bg-purple-50 text-purple-700 border border-purple-200/50" :
                              user.role === "Kadis" ? "bg-rose-50 text-rose-700 border border-rose-200/50" :
                              user.role === "Kabid" ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                              user.role === "Koordinator" ? "bg-sky-50 text-sky-700 border border-sky-200/50" :
                              user.role === "Tim_Teknis" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                              user.role === "Operator" ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50" :
                              "bg-slate-50 text-slate-700 border border-slate-200/50"
                            )}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600 font-mono">
                            {user.kontakWhatsapp ? (
                              <a 
                                href={`https://wa.me/${user.kontakWhatsapp.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                {user.kontakWhatsapp}
                              </a>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-pu-blue hover:border-pu-blue rounded-lg shadow-sm transition-all"
                                title="Edit User"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.idUser)}
                                disabled={isSystemDefault}
                                className={cn(
                                  "p-1.5 bg-white border rounded-lg shadow-sm transition-all",
                                  isSystemDefault 
                                    ? "border-slate-100 text-slate-300 cursor-not-allowed" 
                                    : "border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200"
                                )}
                                title={isSystemDefault ? "User bawaan sistem tidak bisa dihapus" : "Hapus User"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                          Belum ada data pengguna.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CARD 2: MATRIKS OTORITAS & KONFIGURASI ROLE */}
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg p-6 space-y-6 mt-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Matriks Hak Akses & Konfigurasi Role</h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Atur izin khusus untuk masing-masing peran/jabatan secara interaktif. Perubahan langsung disimulasikan secara real-time.
                  </p>
                </div>
              </div>
            </div>

            {/* List Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(rolePermissions).map(([roleKey, roleVal]) => (
                <div key={roleKey} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-50 bg-slate-50/40">
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm",
                        roleKey === "Administrator" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                        roleKey === "Kadis" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                        roleKey === "Kabid" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                        roleKey === "Koordinator" ? "bg-sky-100 text-sky-700 border border-sky-200" :
                        roleKey === "Tim_Teknis" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                        roleKey === "Operator" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      )}>
                        {roleVal.name}
                      </span>
                      <Shield className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 leading-relaxed font-medium">
                      {roleVal.description}
                    </p>
                  </div>

                  {/* Permissions Switch Matrix */}
                  <div className="p-5 space-y-3.5 bg-white">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Konfigurasi Hak Akses</p>
                    
                    {/* Permission Item: Dashboard */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Dashboard & Analitik</p>
                        <p className="text-[9px] text-slate-400 font-medium">Akses visualisasi data & peta</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "dashboard")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.dashboard ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.dashboard ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Permission Item: Manage Users */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Manajemen Pengguna</p>
                        <p className="text-[9px] text-slate-400 font-medium">Atur akun & role petugas</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "manageUsers")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.manageUsers ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.manageUsers ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Permission Item: Survey */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Survei Lapangan</p>
                        <p className="text-[9px] text-slate-400 font-medium">Input volume kerusakan fisik</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "survey")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.survey ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.survey ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Permission Item: Disposition */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Disposisi & Verifikasi</p>
                        <p className="text-[9px] text-slate-400 font-medium">Setujui & teruskan permohonan</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "disposition")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.disposition ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.disposition ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Permission Item: Reports */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Penerbitan Laporan</p>
                        <p className="text-[9px] text-slate-400 font-medium">Tanda tangan & rilis PDF hasil</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "reports")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.reports ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.reports ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Permission Item: Edit Kamus */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Kamus Visual PUPR</p>
                        <p className="text-[9px] text-slate-400 font-medium">Ubah bobot & standar katalog</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "editKamus")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.editKamus ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.editKamus ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                    {/* Permission Item: Show Map */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Peta Lokasi Bangunan</p>
                        <p className="text-[9px] text-slate-400 font-medium">Akses menu peta persebaran</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "showMap")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.showMap ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.showMap ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Permission Item: Show Settings */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Pengaturan Sistem</p>
                        <p className="text-[9px] text-slate-400 font-medium">Akses menu pengaturan & konfigurasi</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "showSettings")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.showSettings ? "bg-pu-blue" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.showSettings ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Permission Item: AI Engine */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-amber-700">AI Engine Penilaian</p>
                        <p className="text-[9px] text-slate-400 font-medium">Akses analisis AI cerdas untuk klasifikasi dan volume kerusakan</p>
                      </div>
                      <button
                        onClick={() => handleTogglePermission(roleKey, "aiEngine")}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          roleVal.permissions.aiEngine ? "bg-amber-500" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            roleVal.permissions.aiEngine ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "formulir" && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col">
          <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Parameter Formulir Informasi Bangunan</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kelola label, tipe input, placeholder, dan validasi isian umum secara dinamis</p>
            </div>
            <button 
              onClick={() => {
                setIsAddingParam(true);
                setEditingParamId(null);
                setParamForm({ label: "", type: "text", placeholder: "", required: true, enabled: true });
              }}
              className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Parameter
            </button>
          </div>

          <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndBuildingParams}
          >
            <table className="w-full text-left">
              <thead className="text-[10px] text-pu-blue uppercase font-bold border-b border-white/30 bg-white/30 backdrop-blur-md">
                <tr>
                  <th className="px-2 py-4 w-8"></th>
                  <th className="px-2 py-4 w-8"></th>
                  <th className="px-6 py-4">ID Parameter</th>
                  <th className="px-6 py-4">Label Field</th>
                  <th className="px-6 py-4">Tipe Input</th>
                  <th className="px-6 py-4">Placeholder</th>
                  <th className="px-6 py-4 text-center">Wajib Diisi</th>
                  <th className="px-6 py-4 text-center">Status Aktif</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/20 bg-transparent">
                {loadingParams ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-medium">
                      Memuat parameter formulir...
                    </td>
                  </tr>
                ) : buildingParams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-medium">
                      Belum ada parameter formulir yang dikonfigurasi.
                    </td>
                  </tr>
                ) : (
                  
              <SortableContext 
                  items={buildingParams.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {buildingParams.map((p) => (
                    <SortableBuildingParamRow 
                      key={p.id} 
                      p={p}
                      handleEditParam={handleEditParam}
                      handleDeleteParam={handleDeleteParam}
                    />
                  ))}
                </SortableContext>
                )}
              </tbody>
            </table>
            </DndContext>
          </div>
        </div>
      )}

      {activeTab === "param_profil" && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col">
          <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Parameter Formulir Detail Profil Pengguna</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kelola field tambahan, tipe data, dan petunjuk pengisian profil secara dinamis</p>
            </div>
            <button 
              onClick={() => {
                setIsAddingProfileParam(true);
                setEditingProfileParamId(null);
                setProfileParamForm({ label: "", type: "text", placeholder: "", required: false, enabled: true });
              }}
              className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Parameter Profil
            </button>
          </div>

          <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndProfileParams}
          >
            <table className="w-full text-left">
              <thead className="text-[10px] text-pu-blue uppercase font-bold border-b border-white/30 bg-white/30 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4">ID Parameter</th>
                  <th className="px-6 py-4">Label Field</th>
                  <th className="px-6 py-4">Tipe Input</th>
                  <th className="px-6 py-4">Placeholder</th>
                  <th className="px-6 py-4 text-center">Wajib Diisi</th>
                  <th className="px-6 py-4 text-center">Status Aktif</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/20 bg-transparent">
                {loadingProfileParams ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-medium">
                      Memuat parameter profil...
                    </td>
                  </tr>
                ) : profileParams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-medium">
                      Belum ada parameter profil tambahan. Parameter standar (Nama, Email, No. WA, Role) sudah terintegrasi secara bawaan.
                    </td>
                  </tr>
                ) : (
                  
              <SortableContext 
                  items={profileParams.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {profileParams.map((p) => (
                    <SortableProfileParamRow 
                      key={p.id} 
                      p={p}
                      handleEditProfileParam={handleEditProfileParam}
                      handleDeleteProfileParam={handleDeleteProfileParam}
                    />
                  ))}
                </SortableContext>
                )}
              </tbody>
            </table>
            </DndContext>
          </div>
        </div>
      )}

      {activeTab === "dinas" && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Profil Dinas PUPR</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Informasi Institusi dan Pejabat Terkait</p>
            </div>
            {!editingDinas && (
              <button 
                onClick={() => setEditingDinas(true)}
                className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
              >
                <Edit2 className="h-4 w-4 mr-2" /> Edit Profil
              </button>
            )}
          </div>
          
          {loadingDinas ? (
             <div className="py-8 text-center text-slate-500 font-medium">Memuat profil dinas...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Detail Institusi</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Dinas <span className="text-red-500">*</span></label>
                  {editingDinas ? (
                    <input type="text" value={dinasForm.namaDinas || ''} onChange={e => setDinasForm({...dinasForm, namaDinas: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
                  ) : (
                    <div className="text-sm font-bold text-slate-900">{dinasConfig?.namaDinas || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                  {editingDinas ? (
                    <textarea value={dinasForm.alamat || ''} onChange={e => setDinasForm({...dinasForm, alamat: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" rows={3}></textarea>
                  ) : (
                    <div className="text-sm font-medium text-slate-900">{dinasConfig?.alamat || '-'}</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kontak Telepon</label>
                    {editingDinas ? (
                      <input type="text" value={dinasForm.kontak || ''} onChange={e => setDinasForm({...dinasForm, kontak: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900">{dinasConfig?.kontak || '-'}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                    {editingDinas ? (
                      <input type="email" value={dinasForm.email || ''} onChange={e => setDinasForm({...dinasForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900">{dinasConfig?.email || '-'}</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Website</label>
                  {editingDinas ? (
                    <input type="text" value={dinasForm.website || ''} onChange={e => setDinasForm({...dinasForm, website: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
                  ) : (
                    <div className="text-sm font-medium text-slate-900">{dinasConfig?.website || '-'}</div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Pejabat & Penanggung Jawab</h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kepala Dinas</label>
                  {editingDinas ? (
                    <select 
                      value={dinasForm.idKadis || ""} 
                      onChange={e => setDinasForm({...dinasForm, idKadis: e.target.value ? Number(e.target.value) : null})} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm"
                    >
                      <option value="">-- Pilih User (Kepala Dinas) --</option>
                      {usersList.map(u => (
                        <option key={u.idUser} value={u.idUser}>{u.namaLengkap} ({u.role})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm font-medium text-slate-900">
                      {dinasConfig?.idKadis ? usersList.find(u => u.idUser === dinasConfig.idKadis)?.namaLengkap : '-'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kepala Bidang (Kabid)</label>
                  {editingDinas ? (
                    <select 
                      value={dinasForm.idKabid || ""} 
                      onChange={e => setDinasForm({...dinasForm, idKabid: e.target.value ? Number(e.target.value) : null})} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm"
                    >
                      <option value="">-- Pilih User (Kepala Bidang) --</option>
                      {usersList.map(u => (
                        <option key={u.idUser} value={u.idUser}>{u.namaLengkap} ({u.role})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm font-medium text-slate-900">
                      {dinasConfig?.idKabid ? usersList.find(u => u.idUser === dinasConfig.idKabid)?.namaLengkap : '-'}
                    </div>
                  )}
                </div>

                {editingDinas && (
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                    <button 
                      onClick={() => { setEditingDinas(false); setDinasForm(dinasConfig || {}); }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSaveDinas}
                      className="px-4 py-2 bg-pu-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "surat" && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Kop Surat Resmi</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                {isPengelola ? "Atur Kop Surat Instansi/Sekolah (Pengelola)" : "Atur Kop Surat Kedinasan (Sistem) dan Kop Surat Instansi/Sekolah (Pengelola)"}
              </p>
            </div>
            {!editingLetter ? (
              <button 
                onClick={() => {
                  setEditingLetter(true);
                  setLetterForm(letterConfig);
                }}
                className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
              >
                <Edit2 className="h-4 w-4 mr-2" /> Edit Pengaturan
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingLetter(false);
                    setLetterForm(letterConfig);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveLetter}
                  className="px-4 py-2 bg-pu-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Simpan Kop
                </button>
              </div>
            )}
          </div>

          {loadingLetter || !letterForm ? (
            <div className="py-8 text-center text-slate-500 font-medium animate-pulse">Memuat pengaturan kop surat...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Input Column */}
              <div className="space-y-6">
                {/* 1. KOP SURAT SISTEM / DINAS */}
                {!isPengelola && (
                  <div className="bg-white/50 p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pu-blue"></span>
                      <h3 className="font-bold text-slate-800 text-sm">Kop Surat Sistem / Dinas (Untuk Output Teknis)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">URL Logo Kiri (Pemda)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            disabled={!editingLetter}
                            value={letterForm.sistem.logoKiri} 
                            onChange={e => setLetterForm({
                              ...letterForm,
                              sistem: { ...letterForm.sistem, logoKiri: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                          />
                          <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              disabled={!editingLetter}
                              className="hidden"
                              onChange={e => handleFileUpload(e, 'sistem.logoKiri')}
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">URL Logo Kanan (Dinas/PUPR)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            disabled={!editingLetter}
                            value={letterForm.sistem.logoKanan} 
                            onChange={e => setLetterForm({
                              ...letterForm,
                              sistem: { ...letterForm.sistem, logoKanan: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                          />
                          <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              disabled={!editingLetter}
                              className="hidden"
                              onChange={e => handleFileUpload(e, 'sistem.logoKanan')}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Baris Instansi Atas (UPPERCASE)</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.sistem.namaInstansiAtas} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          sistem: { ...letterForm.sistem, namaInstansiAtas: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60 font-medium" 
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Baris Instansi Bawah / Nama Dinas (UPPERCASE)</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.sistem.namaInstansiBawah} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          sistem: { ...letterForm.sistem, namaInstansiBawah: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60 font-bold" 
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Alamat Kantor</label>
                      <textarea 
                        rows={2}
                        disabled={!editingLetter}
                        value={letterForm.sistem.alamat} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          sistem: { ...letterForm.sistem, alamat: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.sistem.email} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            sistem: { ...letterForm.sistem, email: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Website</label>
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.sistem.website} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            sistem: { ...letterForm.sistem, website: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Kontak Telepon</label>
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.sistem.nomorTelepon} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            sistem: { ...letterForm.sistem, nomorTelepon: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Pejabat</label>
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.sistem.namaKepala || ''} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            sistem: { ...letterForm.sistem, namaKepala: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">NIP Pejabat</label>
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.sistem.nipKepala || ''} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            sistem: { ...letterForm.sistem, nipKepala: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Jabatan</label>
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.sistem.jabatan || ''} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            sistem: { ...letterForm.sistem, jabatan: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. KOP SURAT PENGELOLA / INSTANSI */}
                <div className="bg-white/50 p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="font-bold text-slate-800 text-sm">Kop Surat Pengelola / Pemohon (Untuk Surat Permohonan)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">URL Logo Kiri (Sekolah/Tut Wuri)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.pengelola.logoKiri} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            pengelola: { ...letterForm.pengelola, logoKiri: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                        <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                          <UploadCloud className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!editingLetter}
                            className="hidden"
                            onChange={e => handleFileUpload(e, 'pengelola.logoKiri')}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">URL Logo Kanan (Opsional)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          disabled={!editingLetter}
                          value={letterForm.pengelola.logoKanan} 
                          onChange={e => setLetterForm({
                            ...letterForm,
                            pengelola: { ...letterForm.pengelola, logoKanan: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                        />
                        <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                          <UploadCloud className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!editingLetter}
                            className="hidden"
                            onChange={e => handleFileUpload(e, 'pengelola.logoKanan')}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Baris Instansi Atas (UPPERCASE)</label>
                    <input 
                      type="text" 
                      disabled={!editingLetter}
                      value={letterForm.pengelola.namaInstansiAtas} 
                      onChange={e => setLetterForm({
                        ...letterForm,
                        pengelola: { ...letterForm.pengelola, namaInstansiAtas: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60 font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Baris Instansi Bawah / Nama Lembaga (UPPERCASE)</label>
                    <input 
                      type="text" 
                      disabled={!editingLetter}
                      value={letterForm.pengelola.namaInstansiBawah} 
                      onChange={e => setLetterForm({
                        ...letterForm,
                        pengelola: { ...letterForm.pengelola, namaInstansiBawah: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60 font-bold" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Alamat Lembaga</label>
                    <textarea 
                      rows={2}
                      disabled={!editingLetter}
                      value={letterForm.pengelola.alamat} 
                      onChange={e => setLetterForm({
                        ...letterForm,
                        pengelola: { ...letterForm.pengelola, alamat: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.pengelola.email} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          pengelola: { ...letterForm.pengelola, email: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Website</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.pengelola.website} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          pengelola: { ...letterForm.pengelola, website: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Kontak Telepon</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.pengelola.nomorTelepon} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          pengelola: { ...letterForm.pengelola, nomorTelepon: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Pimpinan / Kepsek</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.pengelola.namaKepala || ''} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          pengelola: { ...letterForm.pengelola, namaKepala: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">NIP</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.pengelola.nipKepala || ''} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          pengelola: { ...letterForm.pengelola, nipKepala: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jabatan</label>
                      <input 
                        type="text" 
                        disabled={!editingLetter}
                        value={letterForm.pengelola.jabatan || ''} 
                        onChange={e => setLetterForm({
                          ...letterForm,
                          pengelola: { ...letterForm.pengelola, jabatan: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Column */}
              <div className="space-y-6">
                <div className="sticky top-6 space-y-6">
                  {/* Preview Sistem Header */}
                  {!isPengelola && (
                    <div className="bg-white border border-slate-200/80 rounded-xl shadow-md p-6 space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Live Preview Kop Surat Dinas</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">SISTEM (DINAS PUPR)</span>
                      </div>

                      <div className="flex items-center gap-3 border-b-4 border-double border-slate-900 pb-3 font-sans">
                        {letterForm.sistem.logoKiri && (
                          <img 
                            src={letterForm.sistem.logoKiri} 
                            alt="Logo Kiri" 
                            className="w-10 h-10 object-contain shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="text-center flex-1">
                          <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-wide leading-tight">
                            {letterForm.sistem.namaInstansiAtas || 'PEMERINTAH KABUPATEN GARUT'}
                          </h4>
                          <h5 className="text-[10px] font-extrabold text-slate-950 uppercase tracking-wide leading-tight mt-0.5">
                            {letterForm.sistem.namaInstansiBawah || 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG'}
                          </h5>
                          <p className="text-[7px] text-slate-500 mt-1 font-mono leading-tight">
                            {letterForm.sistem.alamat || 'Alamat Kantor'} 
                            {letterForm.sistem.nomorTelepon ? ` | Telp: ${letterForm.sistem.nomorTelepon}` : ''}
                            {letterForm.sistem.email ? ` | Email: ${letterForm.sistem.email}` : ''}
                            {letterForm.sistem.website ? ` | Web: ${letterForm.sistem.website}` : ''}
                          </p>
                        </div>
                        {letterForm.sistem.logoKanan ? (
                          <img 
                            src={letterForm.sistem.logoKanan} 
                            alt="Logo Kanan" 
                            className="w-10 h-10 object-contain shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          letterForm.sistem.logoKiri && <div className="w-10 h-10 shrink-0"></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview Pengelola Header */}
                  <div className="bg-white border border-slate-200/80 rounded-xl shadow-md p-6 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Live Preview Kop Surat Pengelola</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">PENGELOLA (SEKOLAH/PEMOHON)</span>
                    </div>

                    <div className="flex items-center gap-3 border-b-4 border-double border-slate-900 pb-3 font-sans">
                      {letterForm.pengelola.logoKiri && (
                        <img 
                          src={letterForm.pengelola.logoKiri} 
                          alt="Logo Kiri" 
                          className="w-10 h-10 object-contain shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="text-center flex-1">
                        <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-wide leading-tight">
                          {letterForm.pengelola.namaInstansiAtas || 'PEMERINTAH KABUPATEN GARUT'}
                        </h4>
                        <h5 className="text-[10px] font-extrabold text-slate-950 uppercase tracking-wide leading-tight mt-0.5">
                          {letterForm.pengelola.namaInstansiBawah || 'NAMA LEMBAGA / SEKOLAH'}
                        </h5>
                        <p className="text-[7px] text-slate-500 mt-1 font-mono leading-tight">
                          {letterForm.pengelola.alamat || 'Alamat Lembaga'} 
                          {letterForm.pengelola.nomorTelepon ? ` | Telp: ${letterForm.pengelola.nomorTelepon}` : ''}
                          {letterForm.pengelola.email ? ` | Email: ${letterForm.pengelola.email}` : ''}
                          {letterForm.pengelola.website ? ` | Web: ${letterForm.pengelola.website}` : ''}
                        </p>
                      </div>
                      {letterForm.pengelola.logoKanan && (
                        <img 
                          src={letterForm.pengelola.logoKanan} 
                          alt="Logo Kanan" 
                          className="w-10 h-10 object-contain shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================== TAB: PUSAT TEMPLATE ========================== */}
      {activeTab === "template" && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pusat Template Dokumen</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Kelola template surat dan dokumen yang digunakan di seluruh aplikasi. Gunakan variabel {"{{namaVariabel}}"} untuk data dinamis.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
              {editingDriveLink ? (
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <input
                     type="text"
                     value={driveLinkInput}
                     onChange={(e) => setDriveLinkInput(e.target.value)}
                     placeholder="Link Google Drive..."
                     className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-300 min-w-[200px] md:min-w-[250px] outline-none focus:border-pu-blue"
                  />
                  <button onClick={handleSaveDriveLink} className="p-1.5 bg-pu-blue text-white rounded-lg shadow hover:bg-blue-800 transition-colors"><Check className="w-4 h-4"/></button>
                  <button onClick={() => setEditingDriveLink(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                 <div className="flex items-center gap-2">
                    {appConfig?.templateDriveLink ? (
                      <a 
                        href={appConfig.templateDriveLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                      >
                        <CloudUpload className="h-4 w-4 mr-2" /> Google Drive Folder
                      </a>
                    ) : (
                      <span className="text-[10px] italic text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">Folder belum diatur</span>
                    )}
                    <button 
                      onClick={() => { setDriveLinkInput(appConfig?.templateDriveLink || ""); setEditingDriveLink(true); }} 
                      className="p-2 border border-slate-300 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all shadow-sm"
                      title="Edit Link Folder Google Drive"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                 </div>
              )}
            </div>
          </div>

          {loadingTemplates ? (
            <div className="py-12 text-center text-slate-500 font-medium animate-pulse">Memuat template dokumen...</div>
          ) : editingTemplateId ? (
            // === EDITOR MODE ===
            (() => {
              const tpl = docTemplates.find(t => t.id === editingTemplateId);
              if (!tpl) return null;
              return (
                <div className="space-y-4">
                  {/* Header Editor */}
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setEditingTemplateId(null); setEditingTemplateContent(""); setPreviewTemplateId(null); }}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{tpl.nama}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">{tpl.deskripsi}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetTemplate(editingTemplateId)}
                        className="px-3 py-1.5 border border-amber-300 text-amber-700 bg-amber-50 font-bold text-[10px] rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Reset Default
                      </button>
                      <button
                        onClick={() => setPreviewTemplateId(previewTemplateId ? null : editingTemplateId)}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 font-bold text-[10px] rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {previewTemplateId ? "Tutup Preview" : "Preview"}
                      </button>
                      <button
                        onClick={() => handleSaveTemplate(editingTemplateId, editingTemplateContent, editingTemplateDriveLink)}
                        disabled={savingTemplate}
                        className="px-4 py-1.5 bg-pu-blue text-white font-bold text-[10px] rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {savingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Simpan Template
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Editor Textarea */}
                    <div className={cn("space-y-4", previewTemplateId ? "lg:col-span-1" : "lg:col-span-2")}>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Link Template Asli (Google Drive)</label>
                        <input
                          type="text"
                          value={editingTemplateDriveLink}
                          onChange={e => setEditingTemplateDriveLink(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-white text-xs focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Konten Template</label>
                        <textarea
                          value={editingTemplateContent}
                          onChange={e => setEditingTemplateContent(e.target.value)}
                          rows={20}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-xs font-mono leading-relaxed focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-colors resize-y"
                        placeholder="Masukkan konten template..."
                        spellCheck={false}
                      />
                      {tpl.updatedAt && (
                        <p className="text-[9px] text-slate-400 font-mono">
                          Terakhir diubah: {new Date(tpl.updatedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preview Panel */}
                  {previewTemplateId && (
                      <div className="lg:col-span-1 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preview (Data Contoh)</label>
                        <div className="border border-slate-200 rounded-xl bg-white p-4 overflow-auto max-h-[550px] text-xs">
                          {tpl.kategori === 'surat' && editingTemplateContent.includes('<') ? (
                            <div dangerouslySetInnerHTML={{ __html: (() => {
                              const dummyData: Record<string, string> = {};
                              tpl.placeholders?.forEach((p: any) => { dummyData[p.key] = p.contoh; });
                              let result = editingTemplateContent;
                              for (const [key, value] of Object.entries(dummyData)) {
                                result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `<mark class="bg-yellow-100 px-0.5 rounded">${value}</mark>`);
                              }
                              result = result.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '<mark class="bg-red-100 px-0.5 rounded text-red-600">-</mark>');
                              return result;
                            })() }} />
                          ) : (
                            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700">
                              {(() => {
                                const dummyData: Record<string, string> = {};
                                tpl.placeholders?.forEach((p: any) => { dummyData[p.key] = p.contoh; });
                                let result = editingTemplateContent;
                                for (const [key, value] of Object.entries(dummyData)) {
                                  result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `[${value}]`);
                                }
                                result = result.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '[-]');
                                return result;
                              })()}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Variable List */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Variabel yang Tersedia</label>
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-1.5 max-h-[550px] overflow-y-auto">
                        {tpl.placeholders?.map((p: any) => (
                          <button
                            key={p.key}
                            onClick={() => {
                              const ta = document.querySelector('textarea') as HTMLTextAreaElement;
                              if (ta) {
                                const start = ta.selectionStart;
                                const end = ta.selectionEnd;
                                const text = editingTemplateContent;
                                const before = text.substring(0, start);
                                const after = text.substring(end);
                                setEditingTemplateContent(before + `{{${p.key}}}` + after);
                                setTimeout(() => {
                                  ta.focus();
                                  ta.selectionStart = ta.selectionEnd = start + p.key.length + 4;
                                }, 50);
                              }
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200 group"
                          >
                            <div className="flex items-center justify-between">
                              <code className="text-[10px] font-bold text-pu-blue bg-blue-50 px-1.5 py-0.5 rounded group-hover:bg-blue-100 transition-colors">
                                {`{{${p.key}}}`}
                              </code>
                              <Plus className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[9px] text-slate-600 mt-0.5 font-medium">{p.label}</p>
                            <p className="text-[8px] text-slate-400 font-mono">Contoh: {p.contoh}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            // === CARD GRID MODE ===
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docTemplates.map(tpl => (
                <motion.div
                  key={tpl.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/70 border border-slate-200/60 rounded-xl p-5 hover:shadow-lg hover:border-pu-blue/30 transition-all cursor-pointer group"
                  onClick={() => {
                    setEditingTemplateId(tpl.id);
                    setEditingTemplateContent(tpl.kontenHtml);
                    setEditingTemplateDriveLink(tpl.driveLink || "");
                    setPreviewTemplateId(null);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                        tpl.kategori === 'surat' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-pu-blue transition-colors">{tpl.nama}</h3>
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                          {tpl.kategori === 'surat' ? 'Template Surat' : 'Template Lampiran'}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold",
                      tpl.updatedAt ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {tpl.updatedAt ? "Diedit" : "Default"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed mb-3">{tpl.deskripsi}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-slate-400">
                        {tpl.placeholders?.length || 0} variabel
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResetTemplate(tpl.id); }}
                        className="px-2 py-1 text-[9px] font-bold text-amber-600 hover:bg-amber-50 rounded-md transition-colors border border-transparent hover:border-amber-200"
                      >
                        Reset
                      </button>
                      <span className="px-2 py-1 text-[9px] font-bold text-pu-blue bg-blue-50 rounded-md group-hover:bg-blue-100 transition-colors">
                        Edit →
                      </span>
                    </div>
                  </div>
                  {tpl.updatedAt && (
                    <p className="text-[8px] text-slate-400 font-mono mt-2 border-t border-slate-100 pt-2">
                      Terakhir diubah: {new Date(tpl.updatedAt).toLocaleString('id-ID')}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-800"
          >
            <Shield className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {infoEditingId !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setInfoEditingId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Atur Panduan Cara Menghitung Volume</h3>
                <button onClick={() => setInfoEditingId(null)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Komponen</label>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 font-medium border border-slate-100">{infoEditForm.namaKomponen}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Teks Panduan Cara Menghitung Volume</label>
                  <textarea 
                    value={infoEditForm.tooltipText || ''} 
                    onChange={e => setInfoEditForm({...infoEditForm, tooltipText: e.target.value})}
                    rows={4}
                    placeholder="Masukkan penjelasan singkat mengenai komponen ini untuk pengguna awam..."
                    className="w-full rounded-xl border border-slate-200/50 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-sm p-3 text-slate-800 bg-white/50 backdrop-blur-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">URL Gambar Panduan Visualisasi</label>
                  <input 
                    type="text" 
                    value={infoEditForm.tooltipImage || ''} 
                    onChange={e => setInfoEditForm({...infoEditForm, tooltipImage: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-slate-200/50 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-sm p-3 text-slate-800 bg-white/50 backdrop-blur-sm transition-colors"
                  />
                  {infoEditForm.tooltipImage && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 h-32 bg-slate-50 flex items-center justify-center">
                      <img src={infoEditForm.tooltipImage} alt="Preview" className="h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-slate-400">Gambar tidak valid</span>'; }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setInfoEditingId(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button onClick={handleInfoSave} className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">
                  Simpan Panduan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(isAddingKatalog || editingKatalogId !== null) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setIsAddingKatalog(false); setEditingKatalogId(null); }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                  {isAddingKatalog ? "Tambah Panduan Visual Baru" : "Edit Panduan Visual"}
                </h3>
                <button 
                  onClick={() => { setIsAddingKatalog(false); setEditingKatalogId(null); }}
                  className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* 1. Component Dropdown (automatically populated from database) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Komponen Bangunan (Otomatis dari Master)
                  </label>
                  <select
                    value={katalogForm.idKomponen || ""}
                    onChange={e => setKatalogForm({...katalogForm, idKomponen: parseInt(e.target.value)})}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-medium"
                  >
                    <option value="">-- Pilih Komponen --</option>
                    {components.map(c => (
                      <option key={c.idKomponen} value={c.idKomponen}>{c.namaKomponen} ({c.kategoriKomponen})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Damage Level Classification Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Tingkat Kerusakan
                  </label>
                  <select
                    value={katalogForm.idKlasifikasi || ""}
                    onChange={e => setKatalogForm({...katalogForm, idKlasifikasi: parseInt(e.target.value)})}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-medium"
                  >
                    <option value="">-- Pilih Tingkat Kerusakan --</option>
                    {classifications
                      .filter(cl => ["Ringan", "Sedang", "Berat"].includes(cl.namaKlasifikasi))
                      .map(cl => (
                        <option key={cl.idKlasifikasi} value={cl.idKlasifikasi}>{cl.namaKlasifikasi}</option>
                      ))}
                  </select>
                </div>

                {/* 3. Description text area */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Deskripsi Standar PUPR (Penjelasan Teknis)
                  </label>
                  <textarea 
                    value={katalogForm.deskripsiPupr || ""} 
                    onChange={e => setKatalogForm({...katalogForm, deskripsiPupr: e.target.value})}
                    rows={4}
                    placeholder="Contoh: Retak rambut lebar < 1mm pada permukaan beton..."
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                  />
                </div>

                {/* 4. Photo URL input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    URL Gambar Contoh Lapangan
                  </label>
                  <input 
                    type="text" 
                    value={katalogForm.urlFotoContoh || ""} 
                    onChange={e => setKatalogForm({...katalogForm, urlFotoContoh: e.target.value})}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                  />
                  {katalogForm.urlFotoContoh && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-50 flex items-center justify-center">
                      <img src={katalogForm.urlFotoContoh} alt="Preview" referrerPolicy="no-referrer" className="h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsAddingKatalog(false); setEditingKatalogId(null); }}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveKatalog}
                  className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700"
                >
                  Simpan Panduan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(isAddingUser || editingUserId !== null) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setIsAddingUser(false); setEditingUserId(null); }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                  {isAddingUser ? "Tambah User Baru" : "Edit Profil User"}
                </h3>
                <button 
                  onClick={() => { setIsAddingUser(false); setEditingUserId(null); }}
                  className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* 1. Nama Lengkap */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={userForm.namaLengkap || ""} 
                    onChange={e => setUserForm({...userForm, namaLengkap: e.target.value})}
                    placeholder="Contoh: Ahmad Subardjo"
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                    required
                  />
                </div>

                {/* 2. Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Alamat Email (Opsional)
                  </label>
                  <input 
                    type="email" 
                    value={userForm.email || ""} 
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    placeholder="Contoh: ahmad@dinaspupr.go.id"
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                  />
                </div>

                {/* 3. Kontak WhatsApp */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    No. WhatsApp (Gunakan Kode Negara, e.g. 628123...)
                  </label>
                  <input 
                    type="text" 
                    value={userForm.kontakWhatsapp || ""} 
                    onChange={e => setUserForm({...userForm, kontakWhatsapp: e.target.value})}
                    placeholder="Contoh: 628123456789"
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                  />
                  <p className="mt-1 text-[9px] font-semibold text-slate-400">Digunakan untuk koordinasi lapangan & notifikasi otomatis.</p>
                </div>

                {/* 4. Hak Akses / Role */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Hak Akses / Jabatan
                  </label>
                  <select
                    value={userForm.role || "Pengelola_Bangunan"}
                    onChange={e => setUserForm({...userForm, role: e.target.value as any})}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-semibold text-slate-700"
                  >
                    <option value="Administrator">Administrator / Admin Sistem</option>
                    <option value="Pengelola_Bangunan">Pengelola Bangunan / Petugas Penilai</option>
                    <option value="Operator">Operator Dinas PUPR</option>
                    <option value="Tim_Teknis">Tim Teknis Lapangan</option>
                    <option value="Koordinator">Koordinator Survei</option>
                    <option value="Kabid">Kepala Bidang (Kabid)</option>
                    <option value="Kadis">Kepala Dinas (Kadis)</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsAddingUser(false); setEditingUserId(null); }}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveUser}
                  className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors"
                >
                  Simpan User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(isAddingParam || editingParamId !== null) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setIsAddingParam(false); setEditingParamId(null); }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                  {isAddingParam ? "Tambah Parameter Baru" : "Edit Parameter Formulir"}
                </h3>
                <button 
                  onClick={() => { setIsAddingParam(false); setEditingParamId(null); }}
                  className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* 1. Label */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Label Field / Nama Parameter <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={paramForm.label || ""} 
                    onChange={e => setParamForm({...paramForm, label: e.target.value})}
                    placeholder="Contoh: Tahun Konstruksi / Pembangunan"
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                    required
                  />
                </div>

                {/* 2. Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Tipe Input
                  </label>
                  <select
                    value={paramForm.type || "text"}
                    onChange={e => setParamForm({...paramForm, type: e.target.value as any})}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-semibold text-slate-700"
                  >
                    <option value="text">Text / String</option>
                    <option value="number">Number / Angka</option>
                    <option value="textarea">Textarea / Deskripsi Panjang</option>
                  </select>
                </div>

                {/* 3. Placeholder */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Placeholder (Petunjuk Pengisian)
                  </label>
                  <input 
                    type="text" 
                    value={paramForm.placeholder || ""} 
                    onChange={e => setParamForm({...paramForm, placeholder: e.target.value})}
                    placeholder="Contoh: Masukkan tahun kontruksi, misal: 2024"
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                  />
                </div>

                {/* 4. Required & Enabled Toggles */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={paramForm.required === true}
                      onChange={e => setParamForm({...paramForm, required: e.target.checked})}
                      className="rounded border-slate-300 text-pu-blue focus:ring-pu-blue w-4 h-4"
                    />
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Wajib Diisi</div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={paramForm.enabled !== false}
                      onChange={e => setParamForm({...paramForm, enabled: e.target.checked})}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Status Aktif</div>
                  </label>
                </div>
                {/* 5. Tampil di Flow mana? */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer bg-blue-50/50 p-3 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={paramForm.showInPermohonan !== false}
                      onChange={e => setParamForm({...paramForm, showInPermohonan: e.target.checked})}
                      className="rounded border-blue-300 text-pu-blue focus:ring-pu-blue w-4 h-4"
                    />
                    <div className="text-[10px] font-bold text-blue-800 uppercase">Tampil di Permohonan Baru</div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={paramForm.showInPenilaian !== false}
                      onChange={e => setParamForm({...paramForm, showInPenilaian: e.target.checked})}
                      className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Tampil di Penilaian Baru</div>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsAddingParam(false); setEditingParamId(null); }}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveParam}
                  className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors"
                >
                  Simpan Parameter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(isAddingProfileParam || editingProfileParamId !== null) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setIsAddingProfileParam(false); setEditingProfileParamId(null); }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                  {isAddingProfileParam ? "Tambah Parameter Profil Baru" : "Edit Parameter Profil"}
                </h3>
                <button 
                  onClick={() => { setIsAddingProfileParam(false); setEditingProfileParamId(null); }}
                  className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* 1. Label */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Label Field / Nama Parameter <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={profileParamForm.label || ""} 
                    onChange={e => setProfileParamForm({...profileParamForm, label: e.target.value})}
                    placeholder="Contoh: NIP, Alamat Rumah, Golongan"
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                    required
                  />
                </div>

                {/* 2. Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Tipe Input
                  </label>
                  <select
                    value={profileParamForm.type || "text"}
                    onChange={e => setProfileParamForm({...profileParamForm, type: e.target.value as any})}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-semibold text-slate-700"
                  >
                    <option value="text">Text / String</option>
                    <option value="number">Number / Angka</option>
                    <option value="textarea">Textarea / Deskripsi Panjang</option>
                  </select>
                </div>

                {/* 3. Placeholder */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Placeholder (Petunjuk Pengisian)
                  </label>
                  <input 
                    type="text" 
                    value={profileParamForm.placeholder || ""} 
                    onChange={e => setProfileParamForm({...profileParamForm, placeholder: e.target.value})}
                    placeholder="Contoh: Masukkan NIP Anda"
                    className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium"
                  />
                </div>

                {/* 4. Required & Enabled Toggles */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={profileParamForm.required === true}
                      onChange={e => setProfileParamForm({...profileParamForm, required: e.target.checked})}
                      className="rounded border-slate-300 text-pu-blue focus:ring-pu-blue w-4 h-4"
                    />
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Wajib Diisi</div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={profileParamForm.enabled !== false}
                      onChange={e => setProfileParamForm({...profileParamForm, enabled: e.target.checked})}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Status Aktif</div>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsAddingProfileParam(false); setEditingProfileParamId(null); }}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveProfileParam}
                  className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors"
                >
                  Simpan Parameter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
