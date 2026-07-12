# Panduan Pengembangan (AI Agent Guidelines)

Dokumen ini berisi aturan arsitektur dan konvensi kode untuk aplikasi ini. Semua AI Agent pengembang wajib mematuhi aturan ini secara konsisten demi menjaga kualitas, kemudahan pemeliharaan (maintainability), dan skalabilitas aplikasi.

## 1. Arsitektur Clean & Scalable
* **Pemisahan Tanggung Jawab (Separation of Concerns)**: 
  - Logika Presentasi (UI/UX) berada di folder `src/pages/` dan `src/components/`.
  - Logika Bisnis & Integrasi API Eksternal (seperti integrasi Google Workspace Docs/Calendar/Sheets) dikelola di sisi backend (`server.ts` atau modul pembantu di backend) untuk menjamin keamanan kunci API.
  - Logika Penyimpanan & Database menggunakan Drizzle ORM dengan skema terstruktur di `src/db/schema.ts`.
* **Desain Kode Modular**:
  - Hindari menumpuk semua logika pada satu file tunggal yang besar (seperti `App.tsx` atau `AssessmentForm.tsx` secara berlebihan).
  - Ekstrak sub-komponen modular, komponen visual, kalkulator pendukung, atau fungsi utilitas ke dalam file terpisah di `/src/components/` atau `/src/utils/`.
* **Deklarasi Tipe TypeScript**:
  - Tipe data, enum, dan interface bersama didefinisikan di `src/types.ts` atau file tipe modular lainnya. Jangan menulis tipe inline yang berulang-ulang untuk memastikan keseragaman data.

## 2. Struktur File & Folder
Pertahankan organisasi file yang rapi sebagai berikut:
* `/src/components/` - Komponen UI/UX kecil yang reusable (contoh: form-fields, charts, maps, custom-inputs).
* `/src/pages/` - Halaman utama aplikasi (seperti `Dashboard.tsx`, `AssessmentForm.tsx`, `AssessmentList.tsx`, `AiDashboard.tsx`).
* `/src/lib/` - Konfigurasi keamanan, perizinan role, dan helper state.
* `/src/db/` - Skema database Drizzle, relasi data, dan migrasi.
* `/server.ts` - Server backend Express penyedia API, penanganan sesi, integrasi AI Gemini, dan sinkronisasi Google Workspace.

## 3. Penanganan State & Efek Samping (React Hooks)
* Hindari loop re-render yang tak berujung dengan memastikan array dependensi pada `useEffect` selalu terdefinisi dengan tipe primitif (atau menggunakan state ter-memoize).
* Pisahkan status draf lokal (seperti `localStorage`) untuk fungsionalitas offline sebelum data akhirnya dikirim secara resmi ke backend melalui REST API.
