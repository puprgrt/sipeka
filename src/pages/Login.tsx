import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Chrome, ArrowRight, Building2, Shield, Activity, Info, UserCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { googleSignIn, initAuth } from "../lib/firebaseAuth";
import { Turnstile } from "@marsidev/react-turnstile";

interface DemoRole {
  id: string;
  name: string;
  email: string;
  desc: string;
  role: string;
  color: string;
  badge: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: "admin",
    name: "Sistem Admin",
    email: "admin@sipeka.com",
    desc: "Akses penuh manajemen parameter, kamus visual, pengguna, dan pengaturan sistem.",
    role: "Administrator",
    color: "from-amber-500 to-orange-600",
    badge: "👑 Admin"
  },
  {
    id: "teknis",
    name: "Tim Teknis Lapangan",
    email: "teknis@sipeka.com",
    desc: "Melakukan survei visual kerusakan komponen dan melengkapi draf penilaian di lapangan.",
    role: "Tim_Teknis",
    color: "from-blue-500 to-indigo-600",
    badge: "🔧 Teknis"
  },
  {
    id: "operator",
    name: "Operator Dinas PUPR",
    email: "operator@sipeka.com",
    desc: "Verifikasi berkas administratif, pendaftaran sekolah, dan inisiasi permohonan.",
    role: "Operator",
    color: "from-emerald-500 to-teal-600",
    badge: "💻 Operator"
  },
  {
    id: "koordinator",
    name: "Koordinator Survei",
    email: "koordinator@sipeka.com",
    desc: "Penjadwalan petugas, delegasi kartu disposisi, serta meninjau draf penilaian akhir.",
    role: "Koordinator",
    color: "from-purple-500 to-pink-600",
    badge: "📋 Koordinator"
  },
  {
    id: "kadis",
    name: "Kepala Dinas (Kadis)",
    email: "kadis@sipeka.com",
    desc: "Memantau laporan kemajuan daerah, validasi akhir, serta tanda tangan elektronik sertifikat.",
    role: "Kadis",
    color: "from-rose-500 to-red-600",
    badge: "🏛️ Kadis"
  },
  {
    id: "pengelola",
    name: "Pengelola Bangunan",
    email: "sekolah@garut.go.id",
    desc: "Mendaftarkan profil gedung sekolah, unggah berkas, dan mengajukan penilaian mandiri.",
    role: "Pengelola_Bangunan",
    color: "from-slate-600 to-slate-800",
    badge: "🏢 Pengelola"
  }
];

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"credentials" | "demo">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<{logoKiri: string, logoKanan: string}>({
    logoKiri: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Coat_of_arms_of_Garut_Regency.svg",
    logoKanan: "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_PUPR.png"
  });

  useEffect(() => {
    apiFetch("/api/app-settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.logoKiri && data.logoKanan) {
          setAppSettings(data);
        }
      })
      .catch(err => console.error("Error fetching app settings in login:", err));
  }, []);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user) => {
        if (user) {
          // Check if we already have local session set up
          const isLocalLoggedIn = localStorage.getItem("isLoggedIn") === "true";
          const localRole = localStorage.getItem("activeRole");
          
          if (isLocalLoggedIn && localRole) {
            navigate("/", { replace: true });
            return;
          }

          // Otherwise, process the fresh OAuth redirect login
          setLoading(true);
          let userRole = "Pengelola_Bangunan"; // Default role
          let displayName = user.displayName || "Pengguna";
          let activeUserId = "";

          // Check for users in database
          try {
            const res = await apiFetch("/api/users");
            if (res.ok) {
              const dbUsers = await res.json();
              if (Array.isArray(dbUsers)) {
                const dbUser = dbUsers.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
                if (dbUser) {
                  userRole = dbUser.role;
                  displayName = dbUser.namaLengkap;
                  activeUserId = String(dbUser.idUser);
                }
              }
            }
          } catch (err) {
            console.warn("Could not query DB users list", err);
          }

          setSuccess(`Selamat datang, ${displayName}!`);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userEmail", user.email || "");
          localStorage.setItem("userName", displayName);
          localStorage.setItem("userPhoto", user.photoURL || "");
          localStorage.setItem("activeRole", userRole);
          localStorage.setItem("actualRole", userRole);
          if (activeUserId) {
            localStorage.setItem("activeUserId", activeUserId);
          }
          
          setTimeout(() => {
            window.dispatchEvent(new Event("storage"));
            navigate("/", { replace: true });
          }, 800);
        }
      },
      () => {
        const isLocalLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (isLocalLoggedIn) {
          navigate("/", { replace: true });
        }
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [navigate]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Silakan lengkapi Email dan Kata Sandi Anda.");
      return;
    }

    if (!turnstileToken) {
      setError("Silakan selesaikan validasi keamanan CAPTCHA (Turnstile).");
      return;
    }

    setLoading(true);

    try {
      // Verifikasi Turnstile ke backend
      const turnstileRes = await apiFetch("/api/auth/verify-turnstile", {
        method: "POST",
        body: JSON.stringify({ token: turnstileToken })
      });
      
      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        throw new Error("Validasi keamanan gagal. Coba muat ulang halaman.");
      }

      // Validate password for demo
      if (password !== "password" && password !== "admin123") {
        throw new Error("Kata sandi salah. (Petunjuk demo: gunakan 'password')");
      }

      // Check for users in database if possible
      let dbUserFound = null;
      try {
        const res = await apiFetch("/api/users");
        if (res.ok) {
          const dbUsers = await res.json();
          if (Array.isArray(dbUsers)) {
            dbUserFound = dbUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
          }
        }
      } catch (err) {
        console.warn("Could not query DB users list", err);
      }

      const matchedDemo = DEMO_ROLES.find(r => r.email.toLowerCase() === email.toLowerCase());
      
      let userRole = "Pengelola_Bangunan";
      let displayName = email.split("@")[0];
      let finalEmail = email;
      let isValidUser = false;

      if (dbUserFound) {
        userRole = dbUserFound.role;
        displayName = dbUserFound.namaLengkap;
        finalEmail = dbUserFound.email;
        localStorage.setItem("activeUserId", String(dbUserFound.idUser));
        isValidUser = true;
      } else if (matchedDemo) {
        userRole = matchedDemo.role;
        displayName = matchedDemo.name;
        finalEmail = matchedDemo.email;
        isValidUser = true;
      } else if (email.toLowerCase() === "admin@sipeka.com") {
        userRole = "Administrator";
        displayName = "Super Admin SI-PEKA";
        isValidUser = true;
      }

      if (!isValidUser) {
        throw new Error("Email tidak terdaftar di sistem.");
      }

      // Save to localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", finalEmail);
      localStorage.setItem("userName", displayName);
      localStorage.setItem("activeRole", userRole);
      localStorage.setItem("actualRole", userRole);
      localStorage.setItem("userPhoto", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150");

      setSuccess("Autentikasi berhasil! Mengalihkan ke Dasbor...");
      setTimeout(() => {
        window.dispatchEvent(new Event("storage"));
        navigate("/", { replace: true });
      }, 800);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan periksa kembali email & sandi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await googleSignIn();
      // Supabase OAuth redirects to Google, so execution will not continue here.
      // Logic is handled in initAuth callback.
    } catch (err: any) {
      console.error("Google Login failed", err);
      const errMsg = err?.message || "";
      if (err?.code === "auth/popup-closed-by-user" || errMsg.includes("popup-closed-by-user")) {
        setError(
          "Pendaftaran/Masuk via Google dibatalkan atau diblokir oleh browser. Silakan coba lagi atau gunakan login manual."
        );
      } else if (errMsg.includes("access_denied") || errMsg.includes("unverified") || errMsg.includes("403") || errMsg.includes("redirect_uri_mismatch")) {
        setError(
          "Akses Google Terblokir. Pastikan email Anda telah didaftarkan dan Site URL Supabase dikonfigurasi dengan benar."
        );
      } else {
        setError(
          "Gagal masuk dengan Google. Silakan hubungi Administrator atau gunakan Masuk Akun manual."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demo: DemoRole) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Auto-fetch profile role from DB to sync if exists, else we override
      try {
        const res = await apiFetch(`/api/profile?email=${encodeURIComponent(demo.email)}`);
        if (res.ok) {
          const profile = await res.json();
          if (profile && profile.role) {
            demo.role = profile.role;
            demo.name = profile.namaLengkap;
            if (profile.idUser) {
              localStorage.setItem("activeUserId", String(profile.idUser));
            }
          }
        }
      } catch (e) {
        console.warn("Profile fetch skipped, using default config", e);
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", demo.email);
      localStorage.setItem("userName", demo.name);
      localStorage.setItem("activeRole", demo.role);
      localStorage.setItem("actualRole", demo.role);
      localStorage.setItem("userPhoto", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150");

      setSuccess(`Masuk sebagai Simulasi: ${demo.name}`);
      setTimeout(() => {
        window.dispatchEvent(new Event("storage"));
        navigate("/", { replace: true });
      }, 800);
    } catch (err: any) {
      setError("Gagal menginisiasi sesi simulasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      
      {/* Background Decorative Ripples */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-pu-yellow/5 blur-3xl"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row relative">
        
        {/* Left Branding Panel */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-pu-blue to-indigo-950 p-8 flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-white/10">
          
          {/* Logos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={appSettings.logoKiri} 
                alt="Logo Kiri" 
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
              <img 
                src={appSettings.logoKanan} 
                alt="Logo Kanan" 
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
            </div>
            <span className="bg-white/15 px-2 py-0.5 rounded text-[10px] font-mono text-pu-yellow font-extrabold uppercase tracking-widest">v1.0-PRO</span>
          </div>

          {/* Slogan */}
          <div className="my-8 md:my-0 space-y-4">
            <h1 className="text-3xl font-black tracking-tight leading-none text-white">
              SI-PEKA
            </h1>
            <p className="text-sm font-semibold text-pu-yellow uppercase tracking-widest font-mono">
              Sistem Penilaian Kerusakan Bangunan
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Platform inspeksi visual digital terintegrasi untuk pendataan, penilaian mandiri, verifikasi, dan pemetaan tingkat kerusakan bangunan sekolah di Kabupaten Garut berdasarkan standar formulir Kementerian PUPR.
            </p>
          </div>

          {/* Bottom Badge Info */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Shield className="w-4 h-4 text-pu-yellow shrink-0" />
              <span>Koneksi aman SSL & Database Terenskripsi</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span>Offline-First: Pengisian Form Mandiri Offline</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between bg-slate-950 text-slate-100">
          
          <div>
            {/* Login Modes Tabs (Hidden per user request) */}
            <div className="hidden gap-4 mb-6 border-b border-white/10">
              <button
                type="button"
                onClick={() => { setActiveTab("credentials"); setError(null); }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "credentials" 
                    ? "border-pu-yellow text-pu-yellow font-black" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("demo"); setError(null); }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "demo" 
                    ? "border-pu-yellow text-pu-yellow font-black" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Akses Simulasi Role
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {/* Tab 1: Credentials Login */}
            {activeTab === "credentials" && (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Dinas / Sekolah</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="contoh: admin@sipeka.com atau sekolah@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-900 border border-white/10 hover:border-slate-700 focus:border-pu-yellow/80 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-pu-yellow/50 transition-all text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kata Sandi</label>
                    <a href="#forgot" className="text-xs text-pu-yellow hover:underline" onClick={(e) => { e.preventDefault(); alert("Fitur pemulihan sandi sedang disiapkan. Harap hubungi administrator Dinas PUPR."); }}>Lupa Sandi?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-900 border border-white/10 hover:border-slate-700 focus:border-pu-yellow/80 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-pu-yellow/50 transition-all text-white placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Cloudflare Turnstile CAPTCHA */}
                <div className="flex justify-center mt-2 mb-4">
                  <Turnstile
                    siteKey="1x00000000000000000000AA"
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setError("Error pada verifikasi keamanan. Silakan muat ulang halaman.")}
                    options={{ theme: "dark" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="w-full mt-4 bg-pu-yellow hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-extrabold text-sm py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Menautkan Sesi..." : "Masuk Aplikasi"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}

            {/* Tab 2: Demo Quick Login */}
            {activeTab === "demo" && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-start gap-2 text-[11px]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mode Simulasi Aktif:</strong> Pilih salah satu akun dinas/sekolah di bawah untuk langsung mencoba workflow khusus masing-masing role tanpa memasukkan sandi.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {DEMO_ROLES.map((demo) => (
                    <button
                      key={demo.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin(demo)}
                      className="p-3 bg-slate-900 hover:bg-slate-850 border border-white/5 hover:border-pu-yellow/40 rounded-xl flex flex-col text-left transition-all duration-200 group relative overflow-hidden cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold text-xs text-slate-200 group-hover:text-pu-yellow transition-colors">{demo.name}</span>
                        <span className="text-[9px] font-black tracking-wide text-pu-yellow bg-pu-yellow/10 px-1.5 py-0.5 rounded uppercase">
                          {demo.role.split("_").join(" ")}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2 mt-1">{demo.desc}</p>
                      <div className="text-[9px] text-slate-500 font-mono mt-2 truncate w-full">{demo.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Google Sign-In as secondary / unified auth option */}
            <div className="relative flex items-center justify-center my-6">
              <hr className="w-full border-white/10" />
              <span className="absolute bg-slate-950 px-3 text-xs text-slate-500 font-bold uppercase tracking-wider">Atau Masuk Melalui</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-white/10 hover:border-slate-700 text-slate-200 font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-amber-500" />
              <span>Masuk dengan Google Workspace</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-white/5 text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)</p>
            <p>© 2026 Pemerintah Kabupaten Garut. Hak Cipta Dilindungi Undang-Undang.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
