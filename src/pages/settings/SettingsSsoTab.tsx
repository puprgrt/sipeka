import { apiFetch } from "../../lib/api";
import { useState, useEffect, useCallback } from "react";
import {
  Edit2,
  Shield,
  Globe,
  Key,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { SsoConfig } from "./settingsTypes";

interface SettingsSsoTabProps {
  onToast: (msg: string) => void;
}

const SIPEKA_ROLES = [
  "Administrator",
  "Pengelola_Bangunan",
  "Operator",
  "Tim_Teknis",
  "Petugas_Survey",
  "Koordinator",
  "Kabid",
  "Kadis",
];

const DEFAULT_CONFIG: SsoConfig = {
  enabled: false,
  puprIdBaseUrl: "https://pupr-id.vercel.app",
  puprIdApiGatewayUrl: "",
  puprIdRealm: "dpupr-garut",
  clientId: "",
  clientSecret: "",
  showLoginButton: true,
  autoCreateUser: true,
  defaultRole: "Pengelola_Bangunan",
  roleMapping: {
    Administrator: "Administrator",
    "Super Admin": "Administrator",
    Guest: "Pengelola_Bangunan",
  },
};

interface TestResult {
  success: boolean;
  partial?: boolean;
  message: string;
  latencyMs: number;
  tests?: Array<{
    name: string;
    url: string;
    status: string;
    success: boolean;
    issuer?: string;
  }>;
}

export default function SettingsSsoTab({ onToast }: SettingsSsoTabProps) {
  const [config, setConfig] = useState<SsoConfig>(DEFAULT_CONFIG);
  const [form, setForm] = useState<SsoConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [newRoleKey, setNewRoleKey] = useState("");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/sso-settings");
      const data = await res.json();
      setConfig(data);
      setForm(data);
    } catch (error) {
      console.error("Failed to fetch SSO config:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/sso-settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setForm(data);
        setEditing(false);
        onToast("Pengaturan SSO puprID berhasil disimpan!");
      }
    } catch (error) {
      console.error("Failed to save SSO config:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/api/sso/test-connection", {
        method: "POST",
        body: JSON.stringify({
          puprIdBaseUrl: form.puprIdBaseUrl,
          puprIdApiGatewayUrl: form.puprIdApiGatewayUrl,
          puprIdRealm: form.puprIdRealm,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Gagal menguji koneksi.",
        latencyMs: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  const updateForm = (updates: Partial<SsoConfig>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const updateRoleMapping = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      roleMapping: { ...prev.roleMapping, [key]: value },
    }));
  };

  const removeRoleMapping = (key: string) => {
    setForm((prev) => {
      const { [key]: _, ...rest } = prev.roleMapping;
      return { ...prev, roleMapping: rest };
    });
  };

  const addRoleMapping = () => {
    if (!newRoleKey.trim()) return;
    setForm((prev) => ({
      ...prev,
      roleMapping: {
        ...prev.roleMapping,
        [newRoleKey.trim()]: "Pengelola_Bangunan",
      },
    }));
    setNewRoleKey("");
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 font-medium animate-pulse">
        Memuat pengaturan SSO...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-200/50">
              <Shield className="h-6 w-6 text-pu-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Integrasi SSO puprID
              </h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Single Sign-On dengan Platform Identitas Digital DPUPR
              </p>
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => {
                setEditing(true);
                setForm(config);
                setTestResult(null);
              }}
              className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
            >
              <Edit2 className="h-4 w-4 mr-2" /> Edit Konfigurasi
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setForm(config);
                  setTestResult(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-pu-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          )}
        </div>

        {/* Master Toggle */}
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
            form.enabled
              ? "bg-emerald-50/80 border-emerald-200/70"
              : "bg-slate-50/80 border-slate-200/70"
          )}
        >
          <div className="flex items-center gap-3">
            {form.enabled ? (
              <Wifi className="h-5 w-5 text-emerald-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Integrasi SSO{" "}
                <span
                  className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase ml-1",
                    form.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {form.enabled ? "Aktif" : "Nonaktif"}
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {form.enabled
                  ? "Pengguna dapat login ke SI-PEKA menggunakan akun puprID"
                  : "Tombol login puprID tidak ditampilkan di halaman masuk"}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => updateForm({ enabled: e.target.checked })}
              disabled={!editing}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>
      </div>

      {/* Connection Settings */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-5">
          <Globe className="h-5 w-5 text-pu-blue" />
          <h3 className="text-sm font-bold text-slate-800">
            Konfigurasi Koneksi puprID
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              URL Frontend puprID
            </label>
            <input
              type="url"
              disabled={!editing}
              value={form.puprIdBaseUrl}
              onChange={(e) => updateForm({ puprIdBaseUrl: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:bg-white text-xs disabled:opacity-60 focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-all"
              placeholder="https://pupr-id.vercel.app"
            />
            <p className="text-[9px] text-slate-400 font-mono">
              URL halaman login puprID untuk redirect SSO
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              URL API Gateway puprID
            </label>
            <input
              type="url"
              disabled={!editing}
              value={form.puprIdApiGatewayUrl}
              onChange={(e) =>
                updateForm({ puprIdApiGatewayUrl: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:bg-white text-xs disabled:opacity-60 focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-all"
              placeholder="https://api-gateway.pupr-id.example.com"
            />
            <p className="text-[9px] text-slate-400 font-mono">
              URL backend puprID untuk validasi token & userinfo
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              Realm Name
            </label>
            <input
              type="text"
              disabled={!editing}
              value={form.puprIdRealm}
              onChange={(e) => updateForm({ puprIdRealm: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:bg-white text-xs disabled:opacity-60 focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-all"
              placeholder="dpupr-garut"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              Client ID
            </label>
            <input
              type="text"
              disabled={!editing}
              value={form.clientId}
              onChange={(e) => updateForm({ clientId: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:bg-white text-xs disabled:opacity-60 focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-all"
              placeholder="sipeka-client"
            />
          </div>
        </div>

        {/* Client Secret — separate row */}
        <div className="mt-5 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-600">
            <Key className="h-3 w-3 inline mr-1" /> Client Secret
          </label>
          <input
            type="password"
            disabled={!editing}
            value={form.clientSecret}
            onChange={(e) => updateForm({ clientSecret: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:bg-white text-xs disabled:opacity-60 focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-all font-mono"
            placeholder="••••••••"
          />
        </div>

        {/* Test Connection */}
        <div className="mt-6 pt-5 border-t border-slate-200/50">
          <button
            onClick={handleTestConnection}
            disabled={testing || (!form.puprIdBaseUrl && !form.puprIdApiGatewayUrl)}
            className="inline-flex items-center px-5 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-900 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {testing ? "Menguji Koneksi..." : "Test Koneksi"}
          </button>

          {testResult && (
            <div
              className={cn(
                "mt-4 p-4 rounded-xl border transition-all duration-300",
                testResult.success
                  ? "bg-emerald-50/80 border-emerald-200/70"
                  : testResult.partial
                  ? "bg-amber-50/80 border-amber-200/70"
                  : "bg-red-50/80 border-red-200/70"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : testResult.partial ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    "text-xs font-bold",
                    testResult.success
                      ? "text-emerald-700"
                      : testResult.partial
                      ? "text-amber-700"
                      : "text-red-700"
                  )}
                >
                  {testResult.message}
                </span>
                <span className="text-[9px] text-slate-500 font-mono ml-auto">
                  {testResult.latencyMs}ms
                </span>
              </div>

              {testResult.tests && testResult.tests.length > 0 && (
                <div className="mt-3 space-y-2">
                  {testResult.tests.map((test, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[10px] font-mono"
                    >
                      {test.success ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                      )}
                      <span className="font-bold text-slate-700 w-28 shrink-0">
                        {test.name}
                      </span>
                      <span className="text-slate-500 truncate">
                        {test.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-5">
          <Users className="h-5 w-5 text-pu-blue" />
          <h3 className="text-sm font-bold text-slate-800">
            Perilaku & Manajemen User
          </h3>
        </div>

        <div className="space-y-5">
          {/* Show Login Button Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/50">
            <div>
              <h4 className="text-xs font-bold text-slate-700">
                Tampilkan Tombol Login puprID
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Tombol "Masuk via puprID" muncul di halaman Login
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.showLoginButton}
                onChange={(e) =>
                  updateForm({ showLoginButton: e.target.checked })
                }
                disabled={!editing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-pu-blue after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>

          {/* Auto-Create User Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/50">
            <div>
              <h4 className="text-xs font-bold text-slate-700">
                Otomatis Buat Akun User Baru
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Jika user puprID belum terdaftar di SI-PEKA, buat akun secara
                otomatis
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoCreateUser}
                onChange={(e) =>
                  updateForm({ autoCreateUser: e.target.checked })
                }
                disabled={!editing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-pu-blue after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>

          {/* Default Role */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              Role Default untuk User Baru
            </label>
            <select
              disabled={!editing}
              value={form.defaultRole}
              onChange={(e) => updateForm({ defaultRole: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-xs disabled:opacity-60 focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-all"
            >
              {SIPEKA_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <p className="text-[9px] text-slate-400 font-mono">
              Role yang diberikan saat user puprID pertama kali masuk ke SI-PEKA
              (jika tidak ada mapping)
            </p>
          </div>
        </div>
      </div>

      {/* Role Mapping */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-pu-blue" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pemetaan Role (puprID → SI-PEKA)
              </h3>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                Mapping otomatis role dari puprID ke role SI-PEKA
              </p>
            </div>
          </div>
          {form.puprIdBaseUrl && (
            <a
              href={form.puprIdBaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-pu-blue hover:underline font-bold"
            >
              Buka puprID <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/70">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100/80">
                <th className="text-left px-4 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                  Role puprID
                </th>
                <th className="text-left px-4 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                  →
                </th>
                <th className="text-left px-4 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                  Role SI-PEKA
                </th>
                {editing && (
                  <th className="w-12 px-4 py-2.5 text-[10px]"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {Object.entries(form.roleMapping).map(
                ([puprRole, sipekaRole], i) => (
                  <tr
                    key={puprRole}
                    className={cn(
                      "border-t border-slate-200/50",
                      i % 2 === 0 ? "bg-white/40" : "bg-slate-50/40"
                    )}
                  >
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                      {puprRole}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">→</td>
                    <td className="px-4 py-2.5">
                      {editing ? (
                        <select
                          value={sipekaRole}
                          onChange={(e) =>
                            updateRoleMapping(puprRole, e.target.value)
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs focus:border-pu-blue"
                        >
                          {SIPEKA_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium text-pu-blue">
                          {sipekaRole.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    {editing && (
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => removeRoleMapping(puprRole)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Hapus mapping"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {editing && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={newRoleKey}
              onChange={(e) => setNewRoleKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRoleMapping()}
              placeholder="Nama role puprID baru..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs focus:border-pu-blue focus:ring-1 focus:ring-pu-blue/30 transition-all"
            />
            <button
              onClick={addRoleMapping}
              disabled={!newRoleKey.trim()}
              className="inline-flex items-center px-3 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-800 transition-all disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
