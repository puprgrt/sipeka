<div align="center">
  <h1>🏢 SIPEKA (Sistem Penilaian Keandalan Bangunan)</h1>
  <p>Aplikasi penilaian keandalan dan analisis kerusakan bangunan komprehensif berbasis web terintegrasi AI, Peta Digital, dan Auto-Save Offline.</p>
</div>

---

## 📖 Deskripsi Proyek
**SIPEKA** dirancang untuk memudahkan para insinyur dan verifikator dari instansi (seperti PUPR) dalam menilai tingkat kerusakan, keselamatan struktural, dan kelayakan bangunan. Aplikasi ini menggabungkan pencatatan data berlapis, fitur anotasi kerusakan berbasis Artificial Intelligence (Gemini), integrasi peta, hingga pembuatan otomatis laporan PDF (BA/Surat Pernyataan).

### ✨ Fitur Utama
- **Multi-step Assessment**: Pengisian form sistematis (Informasi Bangunan, Uji Keselamatan, Analisis Kerusakan, Review, hingga Dokumen).
- **AI Damage Annotator**: Analisis pintar foto kerusakan menggunakan integrasi Gemini Vision.
- **Offline Draft / Auto-save**: Berbasis **Zustand Persist**, aplikasi akan menyimpan ketikan Anda secara *real-time* dan *offline* di browser. Tidak ada data yang hilang bila tab tertutup tak sengaja.
- **TanStack Table (Modern Data Grid)**: Menyajikan daftar Disposisi, Verifikasi, dan Riwayat Assessment dengan fitur pencarian dan paginasi yang gegas.
- **Drizzle ORM & Supabase**: Database *type-safe* dan otentikasi berbasis Postgres.
- **Full Clean Architecture**: Stabilitas *maintenance* karena pemisahan tegas antara UI, Store, API Service, dan Backend Router.

---

## 🛠️ Tech Stack
| Bagian      | Teknologi yang Digunakan |
| :---        |    :----   |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **State**    | Zustand (with Persist Middleware) |
| **Backend**  | Node.js, Express.js (Modular Router) |
| **Database** | PostgreSQL via Supabase, Drizzle ORM |
| **Table**    | TanStack Table (React Table v8) |
| **AI**       | Google Gemini (AI Studio) |

---

## 📂 Struktur Direktori (*Clean Architecture*)
Aplikasi ini mematuhi standar *clean architecture* demi kebersihan dan skalabilitas:

```text
sipeka/
├── public/                 # Aset statis & Service Workers
├── server.ts               # Entry point backend Express (Setup & Middleware)
├── src/
│   ├── components/         # Komponen UI Reusable
│   │   └── assessment/     # Sub-komponen modular untuk Assessment Form
│   │   └── ui/             # Komponen UI generic (e.g., DataTable)
│   ├── controllers/        # Logika kontrol backend (e.g., aiController)
│   ├── db/                 # Skema Drizzle ORM & Migrasi database
│   ├── lib/                # Konfigurasi eksternal (Supabase, Firebase, Google API)
│   ├── pages/              # Komponen Halaman Utama (Dashboard, AssessmentList, dll)
│   ├── routes/             # Pemisahan Endpoint Express (aiRoutes, assessmentRoutes, dll)
│   ├── services/           # Logika bisnis dan pemanggilan ke API/AI
│   ├── store/              # State Management Global (Zustand)
│   └── utils/              # Fungsi helper & format (Config, Audit)
```

---

## 🚀 Panduan Instalasi (Run Locally)

### Prasyarat:
Pastikan Anda sudah menginstal:
- **Node.js** (versi 18+)
- **NPM** atau **Yarn**

### Langkah-Langkah:
1. **Clone Repositori**
   ```bash
   git clone https://github.com/puprgrt/sipeka.git
   cd sipeka
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment (*.env*)**
   Salin `file` kredensial contoh dan isi dengan kunci proyek Anda (Supabase & Gemini):
   ```bash
   cp .env.example .env
   ```
   > **Note:** Buka `.env` dan ganti nilai `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, dan `GEMINI_API_KEY` milik Anda. Jangan biarkan *secret key* Anda terdorong ke repositori (*push*) demi keamanan!

4. **Jalankan *Development Server***
   Perintah ini akan menjalankan Vite (Frontend) dan esbuild (Backend) secara bersamaan:
   ```bash
   npm run dev
   ```

5. **Akses Aplikasi**
   Buka browser dan akses alamat yang tertera (biasanya `http://localhost:5173`).

---

## 📜 Skrip Tambahan (*Available Scripts*)
Di dalam `package.json`, Anda dapat menjalankan:
- `npm run build` : Membuat bundle produksi (*production build*) Frontend & Backend.
- `npm run preview` : Menjalankan server *preview* lokal dari hasil *build* sebelumnya.
- `npm run check` : Melakukan validasi *Type-checking* TypeScript secara menyeluruh via `tsc --noEmit`.

---

## 🛡️ Keamanan & Lisensi
Pastikan file `.env` selalu masuk dalam `.gitignore` (secara default sudah dikonfigurasi). Jangan mem-publish kunci API Supabase `service_role` (Secret Key) atau `GEMINI_API_KEY` ke publik.

Terima kasih telah menggunakan **SIPEKA**! Jika ada pertanyaan atau kendala pelaporan *bugs*, silakan ajukan *Issue* di repositori ini.
