export const PONDASI_OPTIONS = [
  { level: "Tidak Rusak", label: "Pondasi diindikasi dalam kondisi baik" },
  { level: "Rusak Sangat Ringan", label: "Penurunan merata pada seluruh struktur bangunan" },
  { level: "Rusak Ringan", label: "Penurunan merata pada seluruh struktur bangunan dan/atau Sedikit beda penurunan (differential settlement) antar kolom / dinding, tetapi tidak berakibat kerusakan pada struktur atasnya." },
  { level: "Rusak Sedang", label: "Penurunan > 1/250 L (L adalah Jarak Antar Kolom), dan menyebabkan kerusakan awal pada struktur atasnya." },
  { level: "Rusak Berat", label: "Bangunan miring secara kasat mata, Lantai dasar naik/menggelembung" },
  { level: "Rusak Sangat Berat", label: "Pondasi patah, bergeser akibat longsor, struktur atas menjadi rusak" },
  { level: "Komponen Tidak Sesuai", label: "Material, dimensi, dan konstruksi pondasi diindikasi tidak sesuai dengan persyaratan teknis (merujuk pada Rencana Teknis apabila ada, Petunjuk Teknis, dan/atau SNI)" }
];

export const LISTRIK_OPTIONS = [
  { level: "Tidak Rusak", label: "Jaringan listrik dalam kondisi baik" },
  { level: "Rusak Sangat Ringan", label: "Sebagian kecil komponen dari panel-panel LP rusak, ada sedikit jalur kabel instalasi shortage, sebagian kecil armature rusak ringan, sehingga biaya perbaikan kurang dari 10% dari biaya instalasi baru" },
  { level: "Rusak Ringan", label: "Beberapa komponen dari panel-panel LP rusak, sebagian kecil jalur kabel instalasi shortage, sehingga armature rusak ringan, sehingga biaya perbaikan 10-25% dari biaya instalasi baru" },
  { level: "Rusak Sedang", label: "Beberapa komponen dari panel-panel LP rusak, sebagian kecil jalur kabel instalasi shortage, sehingga armature rusak berat dan ringan, sehingga biaya perbaikan 25-50% dari biaya instalasi baru" },
  { level: "Rusak Berat", label: "Sebagian besar komponen panel-panel LP rusak, sebagian besar kabel instalasi shortage, sebagian besar armature rusak, sehingga biaya perbaikan 50-65 % dari instalasi baru" },
  { level: "Rusak Sangat Berat", label: "Sebagian besar komponen panel-panel LP rusak, sebagian besar kabel instalasi shortage, seluruh armature rusak berat, sehingga biaya perbaikan lebih dari 65 % dari instalasi baru" },
  { level: "Komponen Tidak Sesuai", label: "Material, dimensi, dan konstruksi jaringan listrik diindikasi tidak sesuai dengan persyaratan teknis (merujuk pada Rencana Teknis apabila ada, Petunjuk Teknis, dan/atau SNI)" }
];

export const AIR_BERSIH_OPTIONS = [
  { level: "Tidak Rusak", label: "Sistem penyediaan air dalam kondisi baik" },
  { level: "Rusak Sangat Ringan", label: "Kebocoran pipa terbatas ditempat yang terlihat atau mudah dicapai, keran-keran kecil rusak, sehingga biaya perbaikan kurang dari 10% biaya instalasi baru" },
  { level: "Rusak Ringan", label: "Bagian-bagian kecil pemipaan bocor, motor pompa terbakar, keran-keran kecil rusak, sehingga biaya perbaikan antara 10-25% dari biaya instalasi baru" },
  { level: "Rusak Sedang", label: "Pompa, motor, pipa, dan keran rusak apabila diganti atau diperbaiki memerlukan biaya antara 25-50% dari biaya instalasi baru" },
  { level: "Rusak Berat", label: "Sebagian besar pompa, sebagian besar motor terbakar, pipa utama bocor namun ditempat terbuka, beberapa keran tidak berfungsi, sehingga biaya perbaikan 50-65% dari biaya instalasi baru" },
  { level: "Rusak Sangat Berat", label: "Pompa -pompa rusak total, motor terbakar, di banyak tempat terbuka dan tutup pipa-pipa bocor keran-keran tidak berfungsi, sehingga perbaikan instalasi perlu menyeluruh, dengan perkiraan biaya lebih dari 65% dari biaya instalasi baru" },
  { level: "Komponen Tidak Sesuai", label: "Material, dimensi, dan konstruksi sistem penyediaan air diindikasi tidak sesuai dengan persyaratan teknis (merujuk pada Rencana Teknis apabila ada, Petunjuk Teknis, dan/atau SNI)" }
];
