# Panduan Deployment (Hosting) Aplikasi SIPEKA ke Production

Aplikasi SIPEKA menggunakan arsitektur **Vite + React (Frontend)** dan **Express.js + Node.js (Backend)** dalam satu repositori (*monorepo* sederhana). Saat dijalankan di lingkungan *production*, server backend akan sekaligus melayani (serve) file statis hasil *build* dari frontend.

Berikut adalah panduan langkah demi langkah untuk meng-online-kan aplikasi SIPEKA secara komprehensif.

---

## Tahap 1: Persiapan Repository & Variabel Lingkungan (.env)

Sebelum melakukan *deploy*, pastikan hal-hal berikut sudah disiapkan:

1. **GitHub Repository**: 
   - *Push* seluruh kode SIPEKA ke repositori GitHub pribadi (Private) atau organisasi Anda.
   - **Penting**: Pastikan file `.env` dan folder `node_modules` **tidak** ikut ter-push (pastikan terdaftar di dalam `.gitignore`).

2. **Daftar Variabel Lingkungan yang Dibutuhkan di Production**:
   Anda akan membutuhkan kredensial berikut untuk dimasukkan ke platform *hosting*:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (Connection string dari database PostgreSQL online)
   - `GEMINI_API_KEY` = (API Key dari Google AI Studio)
   - `SYSTEM_DRIVE_FOLDER_ID` = (ID Folder Google Drive untuk pencadangan)
   - `PORT` = (Biasanya platform hosting akan mengatur ini secara otomatis)

3. **Kredensial Service Account (`service-account.json`)**:
   Untuk mengaktifkan fitur pencadangan otomatis (Double-Upload) ke Google Drive sistem, Anda memerlukan file `service-account.json`. Jangan *push* file ini ke repositori, tetapi unggah langsung ke penyedia hosting melalui fitur "Secret Files" atau *Environment Variables*.


---

## Tahap 2: Setup Database Online (PostgreSQL)

Anda tidak bisa menggunakan `localhost` untuk database di *production*. Anda memerlukan layanan hosting database PostgreSQL.

**Rekomendasi Layanan (Gratis / Murah):**
- [Supabase](https://supabase.com)
- [Neon.tech](https://neon.tech)
- [Render PostgreSQL](https://render.com)

**Langkah-langkah Setup Database:**
1. Buat akun di salah satu layanan di atas dan buat *Project* baru.
2. Cari menu pengaturan koneksi (Connection String / URI). Formatnya biasanya seperti ini:
   `postgresql://username:password@hostname:port/database_name`
3. Salin *Connection String* tersebut (Ini akan digunakan sebagai `DATABASE_URL`).

**Migrasi Skema ke Database Online:**
1. Di komputer lokal Anda, buka file `.env`.
2. Ubah sementara variabel `DATABASE_URL` dengan *Connection String* database online yang baru didapat.
3. Buka terminal di VS Code, lalu jalankan perintah migrasi skema Drizzle:
   ```bash
   npx drizzle-kit push
   ```
4. *Opsional*: Jika Anda memiliki script _seeder_ untuk data awal, jalankan:
   ```bash
   npm run db:seed
   ```
5. Setelah tabel berhasil terbuat di database online, Anda boleh mengembalikan `DATABASE_URL` di file `.env` lokal Anda ke alamat `localhost` lagi untuk keperluan *development*.

---

## Tahap 3: Deployment ke Cloud Hosting (Backend + Frontend)

Karena SIPEKA adalah aplikasi berbasis **Node.js**, Anda harus menggunakan layanan *Platform as a Service* (PaaS), bukan *shared hosting* cPanel konvensional.

### Opsi A: Menggunakan Render.com (Direkomendasikan)
Render.com sangat mudah digunakan karena akan mengurus proses instalasi dan *build* otomatis dari GitHub Anda.

1. Buka [Render.com](https://render.com) dan login menggunakan akun GitHub.
2. Pada *dashboard*, klik **New** -> **Web Service**.
3. Hubungkan/Pilih repositori GitHub SIPEKA Anda.
4. Isi konfigurasi dasar berikut:
   - **Name**: `sipeka-pupr` (atau nama lain)
   - **Region**: Pilih region terdekat (misal: Singapore, jika tersedia).
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
     *(Sistem akan menginstal dependencies dan menjalankan script Vite + ESBuild yang ada di package.json)*
   - **Start Command**: `npm start`
5. Gulir ke bawah ke bagian **Environment Variables** (atau klik *Advanced*), lalu tambahkan:
   - Key: `NODE_ENV`, Value: `production`
   - Key: `DATABASE_URL`, Value: *(Connection String PostgreSQL online Anda)*
   - Key: `GEMINI_API_KEY`, Value: *(API Key dari Google AI Studio Anda)*
   - Key: `SYSTEM_DRIVE_FOLDER_ID`, Value: *(ID Folder GDrive Anda)*
6. (Untuk fitur backup): Pada Render, buka menu **Secret Files**, tambahkan file dengan nama `service-account.json` dan isi (*copy-paste*) dari isi file JSON akun servis Google Cloud Anda.
7. Klik **Create Web Service**. 
8. Render akan mulai menarik kode Anda, melakukan *build*, dan menjalankannya. Tunggu beberapa menit hingga statusnya menjadi **Live**. URL publik aplikasi Anda akan muncul di bagian atas (misal: `https://sipeka-pupr.onrender.com`).

### Opsi B: Menggunakan Railway.app
1. Buka [Railway.app](https://railway.app), klik **New Project**.
2. Pilih **Deploy from GitHub repo**, lalu pilih repositori SIPEKA Anda.
3. Railway akan otomatis mendeteksi bahwa repositori ini berisi aplikasi Node.js.
4. Jangan langsung dibuka, pergi ke tab **Variables** pada *project* tersebut.
5. Tambahkan variabel yang sama seperti di atas: `DATABASE_URL`, `GEMINI_API_KEY`, `SYSTEM_DRIVE_FOLDER_ID`, dan `NODE_ENV=production`. (Catatan: Untuk menggunakan `service-account.json` di Railway, Anda mungkin perlu mengatur script untuk men-generate file dari environment variables, misal dengan mengekstrak variabel `GOOGLE_CREDENTIALS_JSON` menjadi file fisik `service-account.json` pada saat runtime).
6. Buka tab **Settings** -> bagian **Networking**, lalu klik **Generate Domain** agar aplikasi Anda mendapatkan URL publik yang bisa diakses.
7. Railway otomatis mem-*build* dan me-*restart* aplikasi dengan environment yang baru dimasukkan.

---

## Tahap 4: Konfigurasi Layanan Eksternal (Post-Deployment)

### 1. Google OAuth (Autentikasi Firebase)
Karena URL aplikasi Anda sekarang berubah dari `localhost` menjadi URL publik (misalnya `https://sipeka-pupr.onrender.com`), Anda harus mendaftarkan URL ini ke Firebase Console.
1. Buka [Firebase Console](https://console.firebase.google.com).
2. Pilih proyek Firebase SIPEKA Anda.
3. Masuk ke menu **Authentication** -> tab **Settings** -> **Authorized domains**.
4. Tambahkan domain aplikasi baru Anda (contoh: `sipeka-pupr.onrender.com`) ke dalam daftar *authorized domains*.
5. Tanpa ini, pengguna tidak akan bisa melakukan login dengan Google.

### 2. Google AI Studio
Koneksi ke Gemini AI tidak memerlukan whitelist domain karena dipanggil melalui sisi Backend (Server-Side) SIPEKA, jadi asalkan `GEMINI_API_KEY` dimasukkan dengan benar di *Environment Variables* platform hosting, fitur AI akan langsung berfungsi.

---

## Validasi Keberhasilan Deployment

Buka URL aplikasi Anda yang baru secara publik, dan uji coba beberapa hal berikut:
1. **Tes Halaman Utama**: Apakah memuat tanpa error putih?
2. **Tes Login**: Coba klik tombol "Masuk dengan Google". Pastikan popup Google OAuth terbuka tanpa pesan error otorisasi.
3. **Tes Database**: Buat permohonan baru atau edit pengaturan sistem, lalu pastikan data tersimpan.
4. **Tes AI**: Buka Dasbor AI dan tunggu apakah analisis kerusakan AI dari Gemini muncul. Jika muncul, koneksi ke Google AI Studio berhasil.
5. **Tes Pencadangan Sistem (Double Upload)**: Buat dokumen "Laporan Penilaian" (PDF) atau "Surat Permohonan" lalu cek *File Manager*. Pastikan daftar dokumen di-load dengan benar (koneksi Database) dan periksa apakah file tersebut masuk ke Google Drive sistem (koneksi Service Account).

Selesai! Aplikasi SIPEKA Anda kini berhasil di-*hosting* dan siap digunakan secara publik.
