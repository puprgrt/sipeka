import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Mail, Phone, Shield, Save, Camera, Building2, Briefcase, Award, MapPin, Volume2, Lock, Key, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { initAuth, changeFirebasePassword, sendFirebasePasswordReset } from "../lib/firebaseAuth";
import { User as FirebaseUser } from "firebase/auth";

interface ProfileField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  placeholder: string;
  required: boolean;
  enabled: boolean;
}

interface ProfileData {
  idUser?: number;
  uid?: string;
  namaLengkap: string;
  email: string;
  role: string;
  kontakWhatsapp: string;
  bio: string;
  photoURL: string;
  customFields: Record<string, string>;
}

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileParams, setProfileParams] = useState<ProfileField[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    namaLengkap: "",
    email: "",
    role: "Pengelola_Bangunan",
    kontakWhatsapp: "",
    bio: "",
    photoURL: "",
    customFields: {}
  });

  const [managedBuildings, setManagedBuildings] = useState<any[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [playSound, setPlaySound] = useState(() => {
    return localStorage.getItem("playNotificationSound") !== "false";
  });

  // States for password change & reset
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || !confirmPassword) {
      setPasswordError("Silakan isi semua bidang kata sandi.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal harus terdiri dari 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setPasswordLoading(true);

    try {
      const isLocal = localStorage.getItem("isLoggedIn") === "true" && (!currentUser || currentUser.uid === "demo_user" || !currentUser.providerData || currentUser.providerData.length === 0);

      if (isLocal) {
        localStorage.setItem("mock_user_password", newPassword);
        setPasswordSuccess("Kata sandi simulasi berhasil diperbarui secara lokal!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        await changeFirebasePassword(newPassword);
        setPasswordSuccess("Kata sandi Anda berhasil diperbarui di Firebase Auth!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      console.error("Gagal mengganti kata sandi", err);
      setPasswordError(err.message || "Gagal memperbarui kata sandi. Silakan coba masuk kembali terlebih dahulu.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetError(null);
    setResetSuccess(null);
    setResetLoading(true);

    try {
      const emailToReset = profileData.email || currentUser?.email || "";
      if (!emailToReset) {
        throw new Error("Alamat email tidak ditemukan.");
      }

      const isLocal = localStorage.getItem("isLoggedIn") === "true" && (!currentUser || currentUser.uid === "demo_user" || !currentUser.providerData || currentUser.providerData.length === 0);

      if (isLocal) {
        setResetSuccess(`[Simulasi] Tautan reset kata sandi telah dikirim ke email: ${emailToReset}`);
      } else {
        await sendFirebasePasswordReset(emailToReset);
        setResetSuccess(`Tautan pengaturan ulang kata sandi berhasil dikirim ke email: ${emailToReset}`);
      }
    } catch (err: any) {
      console.error("Gagal mengirim reset password", err);
      setResetError(err.message || "Gagal mengirim email reset kata sandi.");
    } finally {
      setResetLoading(false);
    }
  };

  // Load firebase or local simulation auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        if (user) {
          setCurrentUser(user);
          fetchProfileAndParams(user.email || "");
        } else {
          const isLocalLoggedIn = localStorage.getItem("isLoggedIn") === "true";
          if (isLocalLoggedIn) {
            const email = localStorage.getItem("userEmail") || "admin@sipeka.com";
            const name = localStorage.getItem("userName") || "Sistem Admin";
            const mockUser = {
              email,
              displayName: name,
              photoURL: localStorage.getItem("userPhoto") || "",
              uid: localStorage.getItem("activeUserId") || "demo_user",
            } as FirebaseUser;
            setCurrentUser(mockUser);
            fetchProfileAndParams(email);
          } else {
            setCurrentUser(null);
            const fallbackEmail = "admin@dinaspupr.go.id";
            fetchProfileAndParams(fallbackEmail);
          }
        }
      },
      () => {
        const isLocalLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (isLocalLoggedIn) {
          const email = localStorage.getItem("userEmail") || "admin@sipeka.com";
          const name = localStorage.getItem("userName") || "Sistem Admin";
          const mockUser = {
            email,
            displayName: name,
            photoURL: localStorage.getItem("userPhoto") || "",
            uid: localStorage.getItem("activeUserId") || "demo_user",
          } as FirebaseUser;
          setCurrentUser(mockUser);
          fetchProfileAndParams(email);
        } else {
          setCurrentUser(null);
          const fallbackEmail = "admin@dinaspupr.go.id";
          fetchProfileAndParams(fallbackEmail);
        }
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const fetchProfileAndParams = async (email: string) => {
    setLoading(true);
    try {
      // 1. Fetch profile parameters config
      const paramsRes = await fetch("/api/profile-parameters");
      const paramsData = await paramsRes.json();
      const activeParams = paramsData.filter((p: ProfileField) => p.enabled);
      setProfileParams(activeParams);

      // 2. Fetch user detailed profile info
      const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      const profileObj = await profileRes.json();
      
      setProfileData({
        ...profileObj,
        customFields: profileObj.customFields || {}
      });

      // 3. If Pengelola Bangunan, fetch managed buildings
      if (profileObj.role === "Pengelola_Bangunan" && profileObj.idUser) {
        setLoadingBuildings(true);
        try {
          const bRes = await fetch("/api/buildings");
          const bData = await bRes.json();
          if (Array.isArray(bData)) {
            setManagedBuildings(bData.filter(b => b.idUserPengelola === profileObj.idUser));
          }
        } catch (e) {
          console.error("Gagal memuat bangunan", e);
        } finally {
          setLoadingBuildings(false);
        }
      }
    } catch (error) {
      console.error("Gagal memuat detail profil", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar maksimal 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleInputChange("photoURL", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldId]: value
      }
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const emailToUse = profileData.email || currentUser?.email || "admin@dinaspupr.go.id";
      const payload = {
        ...profileData,
        email: emailToUse
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToast("Profil Anda berhasil diperbarui!");
        setTimeout(() => setToast(null), 3000);
        // Refresh
        fetchProfileAndParams(emailToUse);
      } else {
        alert("Gagal memperbarui profil.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pu-blue mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold text-sm uppercase tracking-widest animate-pulse">Memuat Detail Profil...</p>
        </div>
      </div>
    );
  }

  const defaultPhoto = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop";

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-500 animate-bounce">
          <Award className="h-4 w-4 animate-spin" />
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative h-48 rounded-t-3xl bg-gradient-to-r from-pu-blue to-indigo-900 overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pu-yellow/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-4 right-6 text-right text-white/50 text-[10px] font-mono tracking-widest font-black uppercase">
          SI-PEKA PROFILE ENGINE
        </div>
      </div>

      {/* Profile Card Main */}
      <div className="bg-white/70 backdrop-blur-lg rounded-b-3xl border-x border-b border-white/50 shadow-xl p-6 sm:p-8 -mt-10 relative z-10">
        
        {/* Avatar & Basic Info Grid */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-8 border-b border-slate-100">
          <div className="relative group -mt-20">
            <img 
              src={currentUser?.photoURL || profileData.photoURL || defaultPhoto} 
              alt={profileData.namaLengkap} 
              className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl bg-slate-100 transition-all group-hover:scale-[1.03]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultPhoto;
              }}
            />
            <input 
              type="file" 
              id="profile-avatar-input" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarChange}
            />
            <label 
              htmlFor="profile-avatar-input"
              className="absolute -bottom-2 -right-2 bg-pu-yellow text-pu-blue p-2.5 rounded-2xl shadow-lg border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
              title="Ganti Foto Profil"
            >
              <Camera className="w-4 h-4" />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{profileData.namaLengkap || "Tanpa Nama"}</h2>
              <span className="px-3 py-1 bg-pu-blue/10 text-pu-blue border border-pu-blue/20 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                {profileData.role.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-pu-blue" /> {profileData.email}
            </p>
            {profileData.bio && (
              <p className="text-xs font-medium text-slate-500 max-w-xl italic">"{profileData.bio}"</p>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="mt-8 space-y-8">
          <div>
            <h3 className="text-xs font-black text-pu-blue uppercase tracking-widest mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4" /> Informasi Dasar Akun
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileData.namaLengkap}
                    onChange={(e) => handleInputChange("namaLengkap", e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.T."
                    className="w-full pl-11 rounded-2xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3.5 text-slate-800 bg-white font-semibold"
                  />
                </div>
              </div>

              {/* No WhatsApp */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Kontak WhatsApp (Gunakan Kode Negara)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={profileData.kontakWhatsapp}
                    onChange={(e) => handleInputChange("kontakWhatsapp", e.target.value)}
                    placeholder="Contoh: 628123456789"
                    className="w-full pl-11 rounded-2xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3.5 text-slate-800 bg-white font-semibold"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Alamat Email (Terkunci)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                  <input
                    type="email"
                    disabled
                    value={profileData.email}
                    className="w-full pl-11 rounded-2xl border border-slate-100 text-xs p-3.5 text-slate-400 bg-slate-50 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Hak Akses / Role (Read Only) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Hak Akses / Peran (Terkunci)
                </label>
                <div className="relative">
                  <Shield className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                  <input
                    type="text"
                    disabled
                    value={profileData.role.replace("_", " ")}
                    className="w-full pl-11 rounded-2xl border border-slate-100 text-xs p-3.5 text-slate-400 bg-slate-50 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Tautan Foto Profil (URL Image)
                </label>
                <input
                  type="url"
                  value={profileData.photoURL || (currentUser?.photoURL ? currentUser.photoURL : "")}
                  onChange={(e) => handleInputChange("photoURL", e.target.value)}
                  placeholder="https://images.unsplash.com/... atau tautan foto resmi lainnya"
                  className="w-full rounded-2xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3.5 text-slate-800 bg-white font-medium"
                />
                {currentUser?.photoURL && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                    ✓ Foto profil aktif disinkronkan dari akun Google/Gmail Anda.
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Bio Singkat / Deskripsi Tugas
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={3}
                  placeholder="Ceritakan singkat tentang peran, keahlian, atau tugas Anda dalam pengelolaan dan penilaian tata bangunan..."
                  className="w-full rounded-2xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3.5 text-slate-800 bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Custom Fields from Admin Parameters */}
          {profileParams.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xs font-black text-pu-blue uppercase tracking-widest mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4" /> Kredensial & Atribut Tambahan (Dinamis)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profileParams.map((param) => {
                  const currentValue = profileData.customFields[param.id] || "";
                  
                  return (
                    <div key={param.id} className={cn(param.type === "textarea" ? "md:col-span-2" : "")}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        {param.label}
                        {param.required && <span className="text-red-500">*</span>}
                        <span className="text-[9px] text-slate-400 font-mono font-medium lowercase">({param.id})</span>
                      </label>

                      {param.type === "textarea" ? (
                        <textarea
                          required={param.required}
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(param.id, e.target.value)}
                          placeholder={param.placeholder}
                          rows={3}
                          className="w-full rounded-2xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3.5 text-slate-800 bg-white font-medium"
                        />
                      ) : (
                        <input
                          type={param.type === "number" ? "number" : "text"}
                          required={param.required}
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(param.id, e.target.value)}
                          placeholder={param.placeholder}
                          className="w-full rounded-2xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3.5 text-slate-800 bg-white font-semibold"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pengaturan Notifikasi & Audio */}
          <div>
            <h3 className="text-xs font-black text-pu-blue uppercase tracking-widest mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Pengaturan Notifikasi & Sistem
            </h3>
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Efek Suara Notifikasi (Audio Alert)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mainkan suara bel notifikasi yang halus ketika ada notifikasi baru masuk.</p>
                </div>
                <button
                  id="sound-alert-toggle"
                  type="button"
                  onClick={() => {
                    const newValue = playSound ? "false" : "true";
                    setPlaySound(!playSound);
                    localStorage.setItem("playNotificationSound", newValue);
                    if (newValue === "true") {
                      try {
                        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
                        audio.volume = 0.5;
                        audio.play();
                      } catch (err) {
                        console.error("Audio playback test failed", err);
                      }
                    }
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    playSound ? "bg-pu-blue" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      playSound ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Pengaturan Keamanan (Ubah & Lupa Password) */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-black text-pu-blue uppercase tracking-widest mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Pengaturan Keamanan Akun
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card 1: Ubah Password */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Ubah Kata Sandi Baru</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Perbarui kata sandi akun Anda untuk meningkatkan keamanan akses.</p>
                  </div>
                </div>

                {currentUser && currentUser.providerData?.some(p => p.providerId === "google.com") ? (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-[11px] text-slate-600 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-blue-800 mb-0.5">Google Sign-In Aktif</span>
                      Akun Anda saat ini masuk melalui otentikasi Google/Gmail. Anda dapat memperbarui kata sandi langsung dari Pengaturan Akun Google Anda.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 mt-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Kata Sandi Baru <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium shadow-sm"
                      />
                    </div>

                    {passwordError && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 text-[11px] rounded-xl font-medium border border-red-100">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-xl font-medium border border-emerald-100">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={passwordLoading}
                      onClick={handlePasswordChange}
                      className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          Simpan Kata Sandi Baru
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: Lupa Password */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Lupa Kata Sandi Akun?</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Kirimkan tautan pemulihan untuk mengatur ulang kata sandi melalui email Anda yang terdaftar.</p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-[11px] text-slate-600 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Terdaftar:</span>
                    </div>
                    <p className="font-mono bg-white/80 py-1.5 px-3 rounded-lg border border-amber-100/50 text-slate-700 break-all select-all font-semibold">
                      {profileData.email || currentUser?.email || "Tidak ada email"}
                    </p>
                  </div>

                  {resetError && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 text-[11px] rounded-xl font-medium border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-xl font-medium border border-emerald-100">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{resetSuccess}</span>
                    </div>
                  )}
                </div>

                <div className="pt-5 lg:pt-0">
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={handleForgotPassword}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        Kirim Tautan Atur Ulang
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-pu-blue text-white text-xs font-bold rounded-2xl shadow-lg hover:bg-blue-800 transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Pembaruan Profil"}
            </button>
          </div>
        </form>
      </div>

      {/* Managed Buildings Section for Pengelola_Bangunan */}
      {profileData.role === "Pengelola_Bangunan" && (
        <div className="mt-8 bg-white/70 backdrop-blur-lg rounded-3xl border border-white/50 shadow-xl p-6 sm:p-8 relative z-10">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-pu-blue uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Bangunan yang Dikelola
            </h3>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">
              {managedBuildings.length} Bangunan
            </span>
          </div>

          {loadingBuildings ? (
            <div className="py-8 text-center text-slate-500 text-xs font-semibold animate-pulse">
              Memuat data bangunan...
            </div>
          ) : managedBuildings.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Belum ada bangunan yang terdaftar.</p>
              <p className="text-xs mt-1">Bangunan akan otomatis terdaftar saat Anda membuat permohonan penilaian baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {managedBuildings.map(b => (
                <div key={b.idBangunan} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{b.namaMassaBangunan}</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{b.schoolName}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600 px-2 py-1 rounded">
                      NPSN: {b.npsn || '-'}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold tracking-wider">Luas</span>
                        <span className="text-slate-700 font-semibold">{b.buildingArea || 0} m²</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold tracking-wider">Lantai</span>
                        <span className="text-slate-700 font-semibold">{b.floorCount || 1} Lt</span>
                      </div>
                    </div>
                    <a 
                      href={`/new?reassess=${b.idBangunan}`}
                      className="px-3 py-1.5 bg-pu-blue text-white text-[10px] font-bold rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Permohonan Baru
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
