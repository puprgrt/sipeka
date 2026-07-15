import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Trash2, Plus, X, Phone, Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import { getRolePermissions, saveRolePermissions, RolePermissionsType } from "../../lib/permissions";
import type { UserConfig } from "./settingsTypes";

interface SettingsUsersTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsUsersTab({ onToast }: SettingsUsersTabProps) {
  const [usersList, setUsersList] = useState<UserConfig[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState<Partial<UserConfig>>({ namaLengkap: "", email: "", role: "Pengelola_Bangunan", kontakWhatsapp: "" });
  const [rolePermissions, setRolePermissions_] = useState<Record<string, { name: string; description: string; permissions: Record<string, boolean>; }>>(getRolePermissions() as any);

  useEffect(() => { fetchUsers(); }, []);

  // Real-time auto-refresh
  useEffect(() => {
    const interval = setInterval(() => { fetchUsers(true); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoadingUsers(true);
    try { const res = await fetch("/api/users"); const data = await res.json(); if (Array.isArray(data)) setUsersList(data); }
    catch (error) { console.error(error); }
    finally { if (!silent) setLoadingUsers(false); }
  };

  const handleEditUser = (user: UserConfig) => { setEditingUserId(user.idUser); setUserForm(user); setIsAddingUser(false); };

  const handleSaveUser = async () => {
    if (!userForm.namaLengkap) { alert("Nama Lengkap wajib diisi!"); return; }
    try {
      if (isAddingUser) { await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm) }); }
      else { await fetch(`/api/users/${editingUserId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm) }); }
      setEditingUserId(null); setIsAddingUser(false); fetchUsers();
    } catch (error) { console.error(error); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Hapus user ini?")) return;
    try { const res = await fetch(`/api/users/${id}`, { method: "DELETE" }); if (!res.ok) { const errorData = await res.json().catch(() => ({})); alert(errorData.error || "Gagal menghapus user."); return; } fetchUsers(); }
    catch (error) { console.error(error); alert("Terjadi kesalahan koneksi saat mencoba menghapus user."); }
  };

  const handleTogglePermission = (roleKey: string, permKey: string) => {
    setRolePermissions_(prev => {
      const currentRole = prev[roleKey];
      const updated = { ...prev, [roleKey]: { ...currentRole, permissions: { ...currentRole.permissions, [permKey]: !currentRole.permissions[permKey] } } };
      saveRolePermissions(updated as RolePermissionsType);
      onToast(`Hak akses '${permKey}' untuk ${currentRole.name} berhasil diperbarui!`);
      return updated;
    });
  };

  const PERMISSION_ITEMS = [
    { key: "dashboard", label: "Dashboard & Analitik", desc: "Akses visualisasi data & peta" },
    { key: "manageUsers", label: "Manajemen Pengguna", desc: "Atur akun & role petugas" },
    { key: "survey", label: "Survei Lapangan", desc: "Input volume kerusakan fisik" },
    { key: "disposition", label: "Disposisi & Verifikasi", desc: "Setujui & teruskan permohonan" },
    { key: "reports", label: "Penerbitan Laporan", desc: "Tanda tangan & rilis PDF hasil" },
    { key: "editKamus", label: "Kamus Visual PUPR", desc: "Ubah bobot & standar katalog" },
    { key: "showMap", label: "Peta Lokasi Bangunan", desc: "Akses menu peta persebaran" },
    { key: "showSettings", label: "Pengaturan Sistem", desc: "Akses menu pengaturan & konfigurasi" },
    { key: "aiEngine", label: "AI Engine Penilaian", desc: "Akses analisis AI cerdas untuk klasifikasi dan volume kerusakan", isSpecial: true },
  ];

  return (
    <div className="space-y-6">
      {/* User List Card */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Manajemen Pengguna & Hak Akses</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">Atur akun petugas, operator dinas, tim teknis lapangan, dan pimpinan untuk koordinasi terintegrasi.</p>
        </div>
        <button onClick={() => { setIsAddingUser(true); setEditingUserId(null); setUserForm({ namaLengkap: "", email: "", role: "Pengelola_Bangunan", kontakWhatsapp: "" }); }}
          className="inline-flex items-center px-4 py-2.5 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95 flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Tambah User Baru
        </button>
      </div>

      {/* User Table */}
      {loadingUsers ? (
        <div className="p-16 flex justify-center"><div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div></div>
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
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">{user.namaLengkap.charAt(0).toUpperCase()}</div>
                          <div><p className="font-bold text-slate-800 text-xs md:text-sm">{user.namaLengkap}</p><p className="text-[10px] text-slate-400 font-mono font-medium">ID: {user.idUser}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium font-mono">{user.email || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                          user.role === "Administrator" ? "bg-purple-50 text-purple-700 border border-purple-200/50" :
                          user.role === "Kadis" ? "bg-rose-50 text-rose-700 border border-rose-200/50" :
                          user.role === "Kabid" ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                          user.role === "Koordinator" ? "bg-sky-50 text-sky-700 border border-sky-200/50" :
                          user.role === "Tim_Teknis" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                          user.role === "Operator" ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50" :
                          "bg-slate-50 text-slate-700 border border-slate-200/50"
                        )}>{user.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 font-mono">
                        {user.kontakWhatsapp ? (
                          <a href={`https://wa.me/${user.kontakWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors">
                            <Phone className="w-3.5 h-3.5" />{user.kontakWhatsapp}
                          </a>
                        ) : <span className="text-slate-400 font-normal">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEditUser(user)} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-pu-blue hover:border-pu-blue rounded-lg shadow-sm transition-all" title="Edit User"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteUser(user.idUser)} disabled={isSystemDefault} className={cn("p-1.5 bg-white border rounded-lg shadow-sm transition-all", isSystemDefault ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200")} title={isSystemDefault ? "User bawaan sistem tidak bisa dihapus" : "Hapus User"}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {usersList.length === 0 && (<tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">Belum ada data pengguna.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Permissions Matrix */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg p-6 space-y-6 mt-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Shield className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Matriks Hak Akses & Konfigurasi Role</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Atur izin khusus untuk masing-masing peran/jabatan secara interaktif.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(rolePermissions).map(([roleKey, roleVal]) => (
            <div key={roleKey} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="p-5 border-b border-slate-50 bg-slate-50/40">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm",
                    roleKey === "Administrator" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                    roleKey === "Kadis" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                    roleKey === "Kabid" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                    roleKey === "Koordinator" ? "bg-sky-100 text-sky-700 border border-sky-200" :
                    roleKey === "Tim_Teknis" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    roleKey === "Operator" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                    "bg-slate-100 text-slate-700 border border-slate-200"
                  )}>{roleVal.name}</span>
                  <Shield className="w-4 h-4 text-slate-400" />
                </div>
                <p className="mt-3 text-[11px] text-slate-500 leading-relaxed font-medium">{roleVal.description}</p>
              </div>
              <div className="p-5 space-y-3.5 bg-white">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Konfigurasi Hak Akses</p>
                {PERMISSION_ITEMS.map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <div>
                      <p className={cn("text-xs font-bold", item.isSpecial ? "text-amber-700" : "text-slate-700")}>{item.label}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{item.desc}</p>
                    </div>
                    <button onClick={() => handleTogglePermission(roleKey, item.key)}
                      className={cn("relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        roleVal.permissions[item.key] ? (item.isSpecial ? "bg-amber-500" : "bg-pu-blue") : "bg-slate-200")}>
                      <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        roleVal.permissions[item.key] ? "translate-x-4" : "translate-x-0")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {(isAddingUser || editingUserId !== null) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setIsAddingUser(false); setEditingUserId(null); }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{isAddingUser ? "Tambah User Baru" : "Edit Profil User"}</h3>
                <button onClick={() => { setIsAddingUser(false); setEditingUserId(null); }} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" value={userForm.namaLengkap || ""} onChange={e => setUserForm({...userForm, namaLengkap: e.target.value})} placeholder="Contoh: Ahmad Subardjo" className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Alamat Email (Opsional)</label>
                  <input type="email" value={userForm.email || ""} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="Contoh: ahmad@dinaspupr.go.id" className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">No. WhatsApp (Gunakan Kode Negara, e.g. 628123...)</label>
                  <input type="text" value={userForm.kontakWhatsapp || ""} onChange={e => setUserForm({...userForm, kontakWhatsapp: e.target.value})} placeholder="Contoh: 628123456789" className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium" />
                  <p className="mt-1 text-[9px] font-semibold text-slate-400">Digunakan untuk koordinasi lapangan & notifikasi otomatis.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hak Akses / Jabatan</label>
                  <select value={userForm.role || "Pengelola_Bangunan"} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-semibold text-slate-700">
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
                <button onClick={() => { setIsAddingUser(false); setEditingUserId(null); }} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Batal</button>
                <button onClick={handleSaveUser} className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">Simpan User</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
