// Shared types for Settings page sub-components

export interface ComponentConfig {
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

export interface KatalogConfig {
  idKatalog: number;
  idKomponen: number;
  idKlasifikasi: number;
  deskripsiPupr: string;
  urlFotoContoh: string;
  namaKomponen?: string;
  namaKlasifikasi?: string;
}

export interface ClassificationConfig {
  idKlasifikasi: number;
  namaKlasifikasi: string;
  nilaiFaktor: string;
}

export interface UserConfig {
  idUser: number;
  uid: string;
  namaLengkap: string;
  email: string | null;
  role: 'Administrator' | 'Pengelola_Bangunan' | 'Operator' | 'Tim_Teknis' | 'Koordinator' | 'Kabid' | 'Kadis';
  kontakWhatsapp: string | null;
  createdAt?: string;
}

export interface DinasConfig {
  id: number;
  namaDinas: string;
  alamat: string;
  kontak: string | null;
  email: string | null;
  website: string | null;
  idKadis: number | null;
  idKabid: number | null;
}

export interface LetterSection {
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

export interface LetterConfig {
  sistem: LetterSection;
  pengelola: LetterSection;
}

export interface AppConfig {
  logoKiri: string;
  logoKanan: string;
  templateDriveLink?: string;
}

export interface BuildingParamConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  placeholder: string;
  required: boolean;
  enabled: boolean;
  showInPermohonan?: boolean;
  showInPenilaian?: boolean;
}

export interface ProfileParamConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  placeholder: string;
  required: boolean;
  enabled: boolean;
}

export interface AiConfig {
  provider: 'google' | 'openai' | 'anthropic' | 'ollama';
  apiKey: string; // Used for Google or generic
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaEndpoint?: string;
  model: string;
  autoAnalyze: boolean;
  confidenceThreshold: number;
  visionPrompt: string;
  documentPrompt: string;
}

// Helper: available tabs per role
export const getAvailableTabsList = (role: string): string[] => {
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

export const ALL_TABS = [
  { id: "aplikasi", label: "Logo Aplikasi" },
  { id: "komponen", label: "Parameter Komponen" },
  { id: "katalog", label: "Kamus Visual (PUPR)" },
  { id: "users", label: "Pengaturan User" },
  { id: "formulir", label: "Parameter Formulir" },
  { id: "param_profil", label: "Parameter Profil" },
  { id: "dinas", label: "Profil Dinas" },
  { id: "surat", label: "Kop Surat" },
  { id: "template", label: "Pusat Template" },
  { id: "ai", label: "Pengaturan AI" },
] as const;
