export interface ComponentAssessment {
  name: string;
  safetyImpact: boolean;
  totalVolume?: number;
  unit?: string;
  damageDetails: {
    level: "Tidak Rusak" | "Rusak Sangat Ringan" | "Rusak Ringan" | "Rusak Sedang" | "Rusak Berat" | "Rusak Sangat Berat" | "Komponen Tidak Sesuai";
    percentage: number;
    volume?: number;
    volumeInputs?: string[];
    photos?: string[];
  }[];
  photo?: string;
}

export interface Assessment {
  id: string;
  idBangunan?: number;
  idUserPengelola?: number;
  schoolName: string;
  buildingName: string;
  npsn: string;
  nup: string;
  address: string;
  city: string;
  province: string;
  buildingArea: number;
  floorCount: number;
  coordinates: { lat: number; lng: number } | null;
  date: string;
  components: ComponentAssessment[];
  photos: string[]; // base64 strings or URLs
  finalResult: {
    totalDamagePercentage: number;
    category: "Ringan" | "Sedang" | "Berat";
  };
  status?: string;
  customFields?: Record<string, any>;
  verification?: Record<string, { status: 'Sesuai' | 'Butuh_Survey'; comment: string }>;
  disposisiData?: string;
  documentLink?: string | null;
}

export const DAMAGE_MULTIPLIERS: Record<string, number> = {
  "Tidak Rusak": 0,
  "Rusak Sangat Ringan": 0.20,
  "Rusak Ringan": 0.35,
  "Rusak Sedang": 0.50,
  "Rusak Berat": 0.70,
  "Rusak Sangat Berat": 0.85,
  "Komponen Tidak Sesuai": 1.00
};

export const COMPONENT_WEIGHTS_1_LANTAI: Record<string, number> = {
  "Pondasi & Sloof": 12.0,
  "Kolom": 10.0,
  "Balok": 8.0,
  "Atap": 7.0,
  "Dinding / Partisi": 21.5,
  "Plafond": 10.0,
  "Lantai": 14.5,
  "Kusen": 1.0,
  "Pintu": 1.5,
  "Jendela": 2.0,
  "Finishing Plafond": 3.0,
  "Finishing Dinding": 4.0,
  "Finishing Kusen & Pintu": 2.0,
  "Instalasi Listrik": 1.0,
  "Instalasi Air Bersih": 1.0,
  "Drainase Limbah": 1.5
};

export const COMPONENT_WEIGHTS_2_LANTAI: Record<string, number> = {
  "Pondasi & Sloof": 10.0,
  "Kolom": 13.0,
  "Balok": 12.0,
  "Plat Lantai": 7.0,
  "Tangga": 3.0,
  "Atap": 10.0,
  "Dinding / Partisi": 15.0,
  "Plafond": 6.0,
  "Lantai": 9.0,
  "Kusen": 1.5,
  "Pintu": 1.0,
  "Jendela": 1.25,
  "Finishing Plafond": 1.0,
  "Finishing Dinding": 5.0,
  "Finishing Kusen & Pintu": 1.0,
  "Instalasi Listrik": 2.0,
  "Instalasi Air Bersih": 1.0,
  "Drainase Limbah": 1.25
};

export const COMPONENT_WEIGHTS_3_LANTAI: Record<string, number> = {
  "Pondasi & Sloof": 10.0,
  "Kolom": 13.0,
  "Balok": 12.0,
  "Plat Lantai": 10.0,
  "Tangga": 3.0,
  "Atap": 7.0,
  "Dinding / Partisi": 6.25,
  "Plafond": 8.0,
  "Lantai": 10.0,
  "Kusen": 1.5,
  "Pintu": 1.0,
  "Jendela": 1.25,
  "Finishing Plafond": 3.0,
  "Finishing Dinding": 5.0,
  "Finishing Kusen & Pintu": 3.0,
  "Instalasi Listrik": 3.0,
  "Instalasi Air Bersih": 1.5,
  "Drainase Limbah": 1.5
};
