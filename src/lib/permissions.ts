export const DEFAULT_ROLE_PERMISSIONS = {
  Administrator: {
    name: "Administrator",
    description: "Memiliki kendali penuh atas sistem, manajemen pengguna, database, dan seluruh parameter penilaian.",
    permissions: { dashboard: true, manageUsers: true, survey: true, disposition: true, reports: true, editKamus: true, showMap: true, showSettings: true, aiEngine: true }
  },
  Kadis: {
    name: "Kepala Dinas (Kadis)",
    description: "Memantau laporan akhir, menandatangani, dan menerbitkan hasil penilaian resmi tingkat kabupaten/provinsi.",
    permissions: { dashboard: true, manageUsers: false, survey: false, disposition: true, reports: true, editKamus: false, showMap: true, showSettings: true, aiEngine: true }
  },
  Kabid: {
    name: "Kepala Bidang (Kabid)",
    description: "Memvalidasi analisis kerusakan, memberikan rekomendasi akhir, dan meneruskan dokumen ke Kadis.",
    permissions: { dashboard: true, manageUsers: false, survey: false, disposition: true, reports: true, editKamus: false, showMap: true, showSettings: true, aiEngine: true }
  },
  Koordinator: {
    name: "Koordinator Survei",
    description: "Mengoordinasikan tim lapangan, menetapkan jadwal survei, melakukan disposisi petugas, serta meninjau draf penilaian.",
    permissions: { dashboard: true, manageUsers: false, survey: true, disposition: true, reports: true, editKamus: true, showMap: true, showSettings: true, aiEngine: true }
  },
  Tim_Teknis: {
    name: "Tim Teknis Lapangan",
    description: "Petugas ahli yang melakukan inspeksi visual, mengukur volume kerusakan di lapangan, dan melengkapi data form penilaian.",
    permissions: { dashboard: true, manageUsers: false, survey: true, disposition: false, reports: false, editKamus: false, showMap: true, showSettings: false, aiEngine: true }
  },
  Operator: {
    name: "Operator Dinas PUPR",
    description: "Melakukan verifikasi berkas permohonan masuk, pendaftaran akun pengelola, serta input awal data administratif.",
    permissions: { dashboard: true, manageUsers: true, survey: false, disposition: true, reports: false, editKamus: false, showMap: true, showSettings: true, aiEngine: false }
  },
  Pengelola_Bangunan: {
    name: "Pengelola Bangunan",
    description: "Petugas eksternal (Kepala Sekolah/Operator Madrasah) yang mendaftarkan profil bangunan dan mengajukan penilaian mandiri.",
    permissions: { dashboard: false, manageUsers: false, survey: false, disposition: false, reports: false, editKamus: false, showMap: true, showSettings: false, aiEngine: false }
  }
};

export type RolePermissionsType = typeof DEFAULT_ROLE_PERMISSIONS;

export function getRolePermissions(): RolePermissionsType {
  const stored = localStorage.getItem("role_permissions");
  if (stored) {
    try {
      return JSON.parse(stored) as RolePermissionsType;
    } catch (e) {
      console.error("Failed to parse role_permissions from localStorage", e);
    }
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export function saveRolePermissions(permissions: typeof DEFAULT_ROLE_PERMISSIONS) {
  localStorage.setItem("role_permissions", JSON.stringify(permissions));
}
