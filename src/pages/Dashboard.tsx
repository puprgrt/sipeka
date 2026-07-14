import { format } from "date-fns";
import { id } from "date-fns/locale";
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { Assessment } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  AlertTriangle, Building, CheckCircle, Sparkles, Loader2, Activity, ShieldAlert,
  Map as MapIcon, Wrench, DollarSign, Brain, ListOrdered, ShieldCheck, Layers, FileText,
  ArrowRight, HelpCircle, Info, BookOpen, Calculator, CheckSquare, PlusCircle, X, Calendar, MapPin, Bell,
  Search, Clock, Send, CheckCircle2, MessageSquare, Trash2, Download, Upload, Edit, ClipboardList, Plus, SlidersHorizontal, FileCheck, Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

import BuildingHistoryModal from "../components/BuildingHistoryModal";
import StatusUpdatesWidget from "../components/StatusUpdatesWidget";
import StaffPerformancePanel from "../components/StaffPerformancePanel";
import SupportTicketPanel from "../components/dashboard/SupportTicketPanel";
import ExecutiveSummaryWidget from "../components/ExecutiveSummaryWidget";

import DashboardMap from "../components/dashboard/DashboardMap";
export default function Dashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeRole, setActiveRole] = useState<string>(() => {
    return localStorage.getItem("activeRole") || "Administrator";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });
  const [simulatedRepairs, setSimulatedRepairs] = useState<Record<string, boolean>>({});
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [buildingHistory, setBuildingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [timeRange, setTimeRange] = useState<"6" | "12">("6");
  const [selectedCity, setSelectedCity] = useState<string>("Semua");

  const [activeTab, setActiveTab] = useState<"overview" | "recent" | "consultation">("overview");

  // States for Proposer Assistance (Sisi Pengusul/Masyarakat)
  const [propSubTab, setPropSubTab] = useState<"documents" | "tickets">("documents");
  const [propDocs, setPropDocs] = useState<any[]>([]);

  const [propForm, setPropForm] = useState<any>({});

  const [tickets, setTickets] = useState<any[]>([]);

  const [showDocPreview, setShowDocPreview] = useState<"sp" | "sptjm" | null>(null);


  const [auditTrails, setAuditTrails] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);
  const [selectedActionFilter, setSelectedActionFilter] = useState("Semua");

  const filteredAssessments = React.useMemo(() => {
    return selectedCity === "Semua" 
      ? assessments 
      : assessments.filter(a => a.city === selectedCity);
  }, [assessments, selectedCity]);

  const cities = ["Semua", ...Array.from(new Set(assessments.map(a => a.city).filter(Boolean)))];

  const monthlyDamageData = React.useMemo(() => {
    const list = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const count = timeRange === "6" ? 6 : 12;
    
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        name: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
        "Sangat Ringan": 0,
        "Ringan": 0,
        "Sedang": 0,
        "Berat": 0,
        "Sangat Berat": 0,
      });
    }

    filteredAssessments.forEach(a => {
      if (!a.date) return;
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthObj = list.find(m => m.key === key);
      
      const dmg = a.finalResult?.totalDamagePercentage || 0;
      let category = "Sangat Ringan";
      if (dmg > 0 && dmg <= 15) category = "Sangat Ringan";
      else if (dmg > 15 && dmg <= 30) category = "Ringan";
      else if (dmg > 30 && dmg <= 50) category = "Sedang";
      else if (dmg > 50 && dmg <= 75) category = "Berat";
      else if (dmg > 75) category = "Sangat Berat";

      if (monthObj) {
        monthObj[category as "Sangat Ringan" | "Ringan" | "Sedang" | "Berat" | "Sangat Berat"] += 1;
      }
    });

    return list;
  }, [filteredAssessments, timeRange]);

  useEffect(() => {
    if (selectedAssessment) {
      const idBangunan = selectedAssessment.customFields?.idBangunan;
      if (idBangunan) {
        setLoadingHistory(true);
        fetch(`/api/buildings/${idBangunan}/history`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
               setBuildingHistory(data);
            } else {
              setBuildingHistory([]);
            }
          })
          .catch(err => {
            console.error("Failed to fetch building history", err);
            setBuildingHistory([]);
          })
          .finally(() => setLoadingHistory(false));
      } else {
        setBuildingHistory([]);
      }
    } else {
      setBuildingHistory([]);
    }
  }, [selectedAssessment]);

  const fetchAssessments = () => {
    setLoading(true);
    fetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) { setAssessments(data); } else { setAssessments([]); }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch assessments", err);
        setLoading(false);
      });
  };

  const fetchAuditTrails = () => {
    setLoadingAudit(true);
    fetch("/api/audit-trails")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAuditTrails(data);
        } else {
          setAuditTrails([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch audit trails:", err);
      })
      .finally(() => {
        setLoadingAudit(false);
      });
  };

  useEffect(() => {
    fetchAssessments();
    fetchAuditTrails();

    const handleStorageChange = () => {
      setActiveRole(localStorage.getItem("activeRole") || "Administrator");
      setTheme((localStorage.getItem("theme") as "light" | "dark") || "light");
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("assessments-synced", fetchAssessments);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assessments-synced", fetchAssessments);
    };
  }, []);

  const handleSeedSample = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/seed-sample-building", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        alert("🎉 " + result.message);
        fetchAssessments();
      } else {
        alert("Gagal membuat sample: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  if (loading && assessments.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Real Data Processing ---
  const totalDamage = filteredAssessments.reduce((sum, a) => sum + (a.finalResult?.totalDamagePercentage || 0), 0);
  const averageDamage = filteredAssessments.length > 0 ? (totalDamage / filteredAssessments.length) : 0;
  
  // Backlog and Resolution
  const waitingCount = filteredAssessments.filter(a => a.status === 'Menunggu_Validasi' || a.status === 'Survei_Lapangan').length;
  const resolvedCount = filteredAssessments.filter(a => a.status === 'Selesai_Dianalisis' || a.status === 'Arsip_Digital').length;
  const resolutionRate = filteredAssessments.length > 0 ? ((resolvedCount / filteredAssessments.length) * 100) : 0;

  // Top Critical Buildings
  const criticalBuildings = [...filteredAssessments].sort((a, b) => (b.finalResult?.totalDamagePercentage || 0) - (a.finalResult?.totalDamagePercentage || 0)).slice(0, 4);

  // --- KPI Values (Real Data) ---
  const targetTotal = filteredAssessments.length;
  const targetAssessed = filteredAssessments.length;
  const targetPercent = targetTotal > 0 ? ((targetAssessed / targetTotal) * 100).toFixed(1) : "0.0";

  // Building Health Index (BHI) = 100 - Damage
  const currentBHI = 100 - (averageDamage || 8); 
  const getBHICategory = (val: number) => {
    if (val >= 85) return { label: "Sangat Baik", color: "text-emerald-500", bg: "bg-emerald-500" };
    if (val >= 70) return { label: "Baik", color: "text-blue-500", bg: "bg-blue-500" };
    if (val >= 55) return { label: "Cukup", color: "text-yellow-500", bg: "bg-yellow-500" };
    if (val >= 40) return { label: "Buruk", color: "text-orange-500", bg: "bg-orange-500" };
    return { label: "Kritis", color: "text-red-500", bg: "bg-red-500" };
  };
  const bhiStatus = getBHICategory(currentBHI);

  // Smart Building Damage Score (SBDS)
  const currentSBDS = currentBHI > 0 ? currentBHI * 0.95 : 87.5;
  const sbdsStatus = currentSBDS >= 90 ? "SANGAT BAIK" : currentSBDS >= 75 ? "BAIK" : currentSBDS >= 60 ? "SEDANG" : currentSBDS >= 40 ? "RUSAK" : "KRITIS";

  // Damage Severity Index (DSI) Distribution
  const minorCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) <= 20).length;
  const moderateCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 20 && (a.finalResult?.totalDamagePercentage || 0) <= 40).length;
  const majorCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 40 && (a.finalResult?.totalDamagePercentage || 0) <= 60).length;
  const severeCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 60 && (a.finalResult?.totalDamagePercentage || 0) <= 80).length;
  const criticalCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 80).length;

  const lowRiskCount = minorCount;
  const medRiskCount = moderateCount;
  const highRiskCount = majorCount + severeCount;
  const extremeRiskCount = criticalCount;

  const dsiData = [
    { name: 'Ringan (0-20)', value: minorCount, color: '#10B981' },
    { name: 'Sedang (21-40)', value: moderateCount, color: '#3B82F6' },
    { name: 'Berat (41-60)', value: majorCount, color: '#F59E0B' },
    { name: 'Sangat Berat (61-80)', value: severeCount, color: '#F97316' },
    { name: 'Kritis (>80)', value: criticalCount, color: '#EF4444' },
  ];

  // Building Health Index (BHI) Distribution
  const sangatBaikCount = filteredAssessments.filter(a => (100 - (a.finalResult?.totalDamagePercentage || 0)) >= 85).length;
  const baikCount = filteredAssessments.filter(a => {
    const bhi = 100 - (a.finalResult?.totalDamagePercentage || 0);
    return bhi >= 70 && bhi < 85;
  }).length;
  const cukupCount = filteredAssessments.filter(a => {
    const bhi = 100 - (a.finalResult?.totalDamagePercentage || 0);
    return bhi >= 55 && bhi < 70;
  }).length;
  const burukCount = filteredAssessments.filter(a => {
    const bhi = 100 - (a.finalResult?.totalDamagePercentage || 0);
    return bhi >= 40 && bhi < 55;
  }).length;
  const kritisBhiCount = filteredAssessments.filter(a => (100 - (a.finalResult?.totalDamagePercentage || 0)) < 40).length;

  const bhiData = [
    { name: 'Sangat Baik', value: sangatBaikCount, color: '#10B981' },
    { name: 'Baik', value: baikCount, color: '#3B82F6' },
    { name: 'Cukup', value: cukupCount, color: '#EAB308' },
    { name: 'Buruk', value: burukCount, color: '#F97316' },
    { name: 'Kritis', value: kritisBhiCount, color: '#EF4444' },
  ];

  // Dynamic SLA Trend Data based on real assessments
  const getSlaTrendData = () => {
    const list = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    // 6 months trend
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      // Calculate SLA for this specific month
      const monthlyAssessments = filteredAssessments.filter(a => {
        if (!a.date) return false;
        const ad = new Date(a.date);
        return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth();
      });
      
      const resolvedInMonth = monthlyAssessments.filter(a => a.status === 'Selesai_Dianalisis' || a.status === 'Arsip_Digital').length;
      const rate = monthlyAssessments.length > 0 
        ? Math.round((resolvedInMonth / monthlyAssessments.length) * 100)
        : 90; // high default baseline if no requests but not a mockup
        
      list.push({
        name: monthNames[d.getMonth()],
        value: rate
      });
    }
    return list;
  };

  const maintData = getSlaTrendData();

  // Dynamic budget & cost formatting
  const totalEstimatedBudget = filteredAssessments.reduce((sum, a) => {
    const damageFraction = (a.finalResult?.totalDamagePercentage || 0) / 100;
    const area = a.buildingArea || 380;
    return sum + (damageFraction * area * 2500000);
  }, 0);

  const formatRupiah = (val: number) => {
    if (val >= 1000000000) {
      return `Rp ${(val / 1000000000).toFixed(2)} M`;
    }
    return `Rp ${(val / 1000000).toFixed(1)} Jt`;
  };

  const dynamicROI = filteredAssessments.length > 0 ? Math.min(65, Math.round(averageDamage * 0.8 + 5)) : 0;

  // Dynamic Facility Condition Index
  const fciValue = averageDamage;
  const getFCIStatus = (val: number) => {
    if (val <= 5) return { label: "Sangat Baik (<5%)", color: "text-emerald-600", border: "text-emerald-600" };
    if (val <= 10) return { label: "Baik (5-10%)", color: "text-blue-600", border: "text-blue-600" };
    if (val <= 30) return { label: "Wajar (10-30%)", color: "text-yellow-600", border: "text-yellow-600" };
    return { label: "Kritis (>30%)", color: "text-red-600", border: "text-red-600" };
  };
  const fciStatus = getFCIStatus(fciValue);

  // Real AI metrics calculated from component damage details
  const getAiMetrics = () => {
    let structuralDamageSum = 0;
    let structuralCount = 0;
    let finishingDamageSum = 0;
    let finishingCount = 0;
    let utilityDamageSum = 0;
    let utilityCount = 0;

    filteredAssessments.forEach(a => {
      a.components?.forEach((c: any) => {
        const cDamage = c.damageDetails?.reduce((sum: number, det: any) => sum + det.percentage, 0) || 0;
        const nameLower = c.name?.toLowerCase() || "";
        
        if (nameLower.includes("struktur") || nameLower.includes("pondasi") || nameLower.includes("kolom") || nameLower.includes("balok")) {
          structuralDamageSum += cDamage;
          structuralCount++;
        } else if (nameLower.includes("arsitektur") || nameLower.includes("dinding") || nameLower.includes("atap") || nameLower.includes("finishing")) {
          finishingDamageSum += cDamage;
          finishingCount++;
        } else if (nameLower.includes("utilitas") || nameLower.includes("listrik") || nameLower.includes("air")) {
          utilityDamageSum += cDamage;
          utilityCount++;
        }
      });
    });

    const crackScore = structuralCount > 0 ? Math.round((structuralDamageSum / structuralCount) * 1.5 + 10) : 45;
    const corrosionScore = utilityCount > 0 ? Math.round((utilityDamageSum / utilityCount) * 1.2 + 5) : 30;
    const weatheringScore = finishingCount > 0 ? Math.round((finishingDamageSum / finishingCount) * 1.4 + 8) : 25;

    return {
      cracks: Math.min(98, Math.max(5, crackScore)),
      corrosion: Math.min(95, Math.max(5, corrosionScore)),
      weathering: Math.min(97, Math.max(5, weatheringScore))
    };
  };

  const aiMetrics = getAiMetrics();

  const getAiSeverityLabel = (val: number) => {
    if (val >= 70) return "Tinggi";
    if (val >= 35) return "Sedang";
    return "Rendah";
  };

  const newReportsCount = filteredAssessments.filter(a => !a.status || a.status === 'Menunggu_Validasi').length;

  const renderRecentActivity = () => {
    const filteredTrails = auditTrails.filter(t => {
      const searchMatch = !searchQuery || 
        t.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.details?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const actionMatch = selectedActionFilter === "Semua" || t.action === selectedActionFilter;
      
      return searchMatch && actionMatch;
    });

    return (
      <div className="space-y-6">
        {/* Filter controls */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari aktivitas berdasarkan nama, email, atau detail..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="action-filter" className="text-xs font-bold text-slate-500 shrink-0">Jenis Aksi:</label>
            <select
              id="action-filter"
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="Semua">Semua Aksi</option>
              <option value="Buat Permohonan">Buat Permohonan</option>
              <option value="Ubah Status">Ubah Status</option>
              <option value="Verifikasi">Verifikasi</option>
              <option value="Disposisi">Disposisi</option>
              <option value="Edit Penilaian">Edit Penilaian</option>
            </select>
          </div>
        </div>

        {/* Timeline List */}
        {loadingAudit ? (
          <div className="flex justify-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredTrails.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 relative shadow-sm">
            {/* Connecting timeline line */}
            <div className="absolute left-[34px] top-8 bottom-8 w-[2px] bg-slate-100"></div>
            
            <div className="space-y-6">
              {filteredTrails.map((trail, index) => {
                let actionIcon = <FileText className="w-4 h-4" />;
                let iconColor = "bg-indigo-50 text-indigo-600 border-indigo-100";
                
                if (trail.action === "Buat Permohonan") {
                  actionIcon = <PlusCircle className="w-4 h-4" />;
                  iconColor = "bg-blue-50 text-blue-600 border-blue-100";
                } else if (trail.action === "Ubah Status") {
                  actionIcon = <Activity className="w-4 h-4" />;
                  iconColor = "bg-amber-50 text-amber-600 border-amber-100";
                } else if (trail.action === "Verifikasi") {
                  actionIcon = <ShieldCheck className="w-4 h-4" />;
                  iconColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                } else if (trail.action === "Disposisi") {
                  actionIcon = <Layers className="w-4 h-4" />;
                  iconColor = "bg-purple-50 text-purple-600 border-purple-100";
                } else if (trail.action === "Edit Penilaian") {
                  actionIcon = <Wrench className="w-4 h-4" />;
                  iconColor = "bg-sky-50 text-sky-600 border-sky-100";
                }

                let roleBadgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                if (trail.role === "Administrator") {
                  roleBadgeColor = "bg-red-50 text-red-700 border-red-150";
                } else if (trail.role === "Verifikator") {
                  roleBadgeColor = "bg-blue-50 text-blue-700 border-blue-150";
                } else if (trail.role === "Dinas") {
                  roleBadgeColor = "bg-purple-50 text-purple-700 border-purple-150";
                } else if (trail.role === "Pengelola_Bangunan") {
                  roleBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-150";
                }

                const displayDate = new Date(trail.timestamp).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <motion.div
                    key={trail.idAudit || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-start gap-4 relative"
                  >
                    {/* Action Icon with colored circle */}
                    <div className={cn("w-9 h-9 rounded-full border flex items-center justify-center shrink-0 z-10 shadow-sm", iconColor)}>
                      {actionIcon}
                    </div>
                    
                    {/* Activity details card */}
                    <div className="flex-1 bg-slate-50/60 border border-slate-150/50 rounded-xl p-4 hover:shadow-sm hover:bg-slate-50 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                        {/* User Identity & Role */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-800 text-xs">
                            {trail.userName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({trail.userEmail})
                          </span>
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase border", roleBadgeColor)}>
                            {trail.role?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        
                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{displayDate}</span>
                        </div>
                      </div>
                      
                      {/* Description & metadata */}
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {trail.details}
                      </p>
                      
                      {/* Assessment scope label if present */}
                      {trail.schoolName && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-600 shadow-sm">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trail.schoolName}</span>
                          {trail.buildingName && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-mono">{trail.buildingName}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tidak Ada Aktivitas Ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Tidak ada riwayat log audit yang cocok dengan filter pencarian atau belum ada aktivitas yang tercatat.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderConsultationCenter = () => {
    // Handler to upload mock file
    const handleMockUpload = (docId: string, fileName: string) => {
      setPropDocs(prev => prev.map(d => {
        if (d.id === docId) {
          return { ...d, file: fileName, status: "Siap Dikirim" };
        }
        return d;
      }));
    };

    // Handler to remove mock file
    const handleRemoveFile = (docId: string) => {
      setPropDocs(prev => prev.map(d => {
        if (d.id === docId) {
          return { ...d, file: null, status: d.id === "sp" || d.id === "sptjm" ? "Draf Tersimpan" : "Belum Unggah" };
        }
        return d;
      }));
    };


    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-xl font-black uppercase tracking-tight text-emerald-400">Pusat Berkas & Pendampingan Masyarakat</h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Selamat datang di portal pendampingan resmi pengusul PUPR Garut. Di sini Anda dapat melengkapi seluruh dokumen kelengkapan administrasi, mengunduh draf template surat permohonan instansi, serta melakukan konsultasi teknis dua arah dengan Operator Dinas PUPR secara real-time.
            </p>
          </div>
        </div>

        {/* Local Navigation */}
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setPropSubTab("documents")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              propSubTab === "documents"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Pemeriksa Kelengkapan Berkas</span>
          </button>
          <button
            type="button"
            onClick={() => setPropSubTab("tickets")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              propSubTab === "tickets"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Konsultasi Teknis & Tiket ({tickets.length})</span>
          </button>
        </div>

        {propSubTab === "documents" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Checklist of Documents */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Checklist Berkas Administrasi
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                    {propDocs.filter(d => d.status === "Siap Dikirim").length} / {propDocs.length} Lengkap
                  </span>
                </div>

                <div className="space-y-3">
                  {propDocs.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-800">{doc.name}</h4>
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider",
                            doc.type === "Wajib" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-100 text-slate-500 border-slate-200"
                          )}>
                            {doc.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{doc.desc}</p>
                        {doc.file && (
                          <p className="text-[9px] text-emerald-600 font-mono font-bold flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3.5 h-3.5" /> File: {doc.file}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                        {/* Status badge */}
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-bold block text-center w-fit shrink-0",
                          doc.status === "Belum Unggah" ? "bg-slate-100 text-slate-500" :
                          doc.status === "Draf Tersimpan" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {doc.status}
                        </span>

                        {/* Interactive operations */}
                        {doc.id === "sp" || doc.id === "sptjm" ? (
                          <button
                            type="button"
                            onClick={() => setShowDocPreview(doc.id as any)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            title="Isi & Pratinjau Template"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Template</span>
                          </button>
                        ) : null}

                        {doc.file ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(doc.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <label className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleMockUpload(doc.id, file.name);
                                } else {
                                  handleMockUpload(doc.id, "dokumen_pilihan.pdf");
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Credentials Form */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-500" /> Identitas Surat & Berkas
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                  Sesuaikan kredensial di bawah ini. Data ini akan otomatis disematkan dalam draf template Surat Permohonan Resmi dan SPTJM PUPR yang dapat diunduh.
                </p>

                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Nama Kepala Sekolah / Pimpinan:</label>
                    <input
                      type="text"
                      value={propForm.headmasterName}
                      onChange={(e) => setPropForm(prev => ({ ...prev, headmasterName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Nama Instansi / Sekolah:</label>
                    <input
                      type="text"
                      value={propForm.schoolName}
                      onChange={(e) => setPropForm(prev => ({ ...prev, schoolName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">NPSN / NUP:</label>
                      <input
                        type="text"
                        value={propForm.npsn}
                        onChange={(e) => setPropForm(prev => ({ ...prev, npsn: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold font-mono text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Tanggal Surat:</label>
                      <input
                        type="date"
                        value={propForm.letterDate}
                        onChange={(e) => setPropForm(prev => ({ ...prev, letterDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Alamat Instansi:</label>
                    <textarea
                      value={propForm.schoolAddress}
                      onChange={(e) => setPropForm(prev => ({ ...prev, schoolAddress: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">No. Kontak / WA:</label>
                    <input
                      type="text"
                      value={propForm.phone}
                      onChange={(e) => setPropForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowDocPreview("sp")}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Draf Surat Permohonan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDocPreview("sptjm")}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Draf SPTJM Bermaterai</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sub-tab: Tickets list and chat */}
            <SupportTicketPanel tickets={tickets} setTickets={setTickets} />
          </>
        )}

        {/* Modal: Document Live Preview (KOP SURAT PUPR STYLE) */}
        <AnimatePresence>
          {showDocPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDocPreview(null)}
                className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 overflow-hidden text-slate-800 border border-slate-100 z-10 flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-4 shrink-0">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    {showDocPreview === "sp" ? "Pratinjau Surat Permohonan Resmi PUPR" : "Pratinjau Surat Pertanggungjawaban Mutlak (SPTJM)"}
                  </h3>
                  <button onClick={() => setShowDocPreview(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Printable Document Sheet View */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-100 rounded-xl border border-slate-200/60 font-serif text-slate-800 leading-relaxed text-sm">
                  {showDocPreview === "sp" ? (
                    <div className="bg-white p-8 shadow-md border border-slate-200 max-w-2xl mx-auto space-y-6">
                      {/* Kop Surat Sekolah */}
                      <div className="border-b-4 border-double border-slate-800 pb-3 text-center">
                        <h2 className="text-base font-black uppercase font-sans tracking-wide">PEMERINTAH KABUPATEN GARUT</h2>
                        <h1 className="text-lg font-black uppercase font-sans">{propForm.schoolName}</h1>
                        <p className="text-[10px] font-sans text-slate-500 not-italic font-bold">NPSN: {propForm.npsn} | Alamat: {propForm.schoolAddress} | Kontak: {propForm.phone}</p>
                      </div>

                      {/* Letter Info */}
                      <div className="flex justify-between text-xs font-sans font-bold">
                        <div className="space-y-0.5">
                          <p>Nomor : 421.3 / {Math.floor(100 + Math.random() * 900)} / SMAN1-CADISDIK</p>
                          <p>Sifat : Penting (Segera)</p>
                          <p>Lampiran : 1 (satu) Berkas Lengkap</p>
                          <p>Hal : Permohonan Penilaian Kelaikan Fisik Bangunan Gedung</p>
                        </div>
                        <div>
                          <p>Garut, {new Date(propForm.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>

                      {/* Recipient */}
                      <div className="text-xs font-sans font-bold space-y-0.5">
                        <p>Kepada Yth,</p>
                        <p className="font-extrabold text-slate-900">Kepala Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)</p>
                        <p>Kabupaten Garut</p>
                        <p>di- Tempat</p>
                      </div>

                      {/* Body */}
                      <div className="text-xs space-y-3.5 leading-relaxed font-sans text-slate-700">
                        <p>Dengan hormat,</p>
                        <p>
                          Sehubungan dengan adanya indikasi kerusakan fisik serta demi menjaga keselamatan, keamanan, dan kenyamanan seluruh pengguna fasilitas gedung negara pada instansi kami, dengan ini kami mengajukan permohonan resmi bantuan teknis penilaian kelaikan fungsi / tingkat kerusakan massa bangunan gedung di lingkungan <strong>{propForm.schoolName}</strong>.
                        </p>
                        <p>Sebagai bahan pertimbangan administrative awal bagi tim teknis dinas PUPR, bersama surat ini kami lampirkan dokumen pendukung berupa:</p>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Formulir Borang Penilaian Mandiri (Self-Assessment) via Aplikasi PUPR Cerdas</li>
                          <li>Surat Pertanggungjawaban Mutlak (SPTJM) bermaterai resmi</li>
                          <li>Bukti kepemilikan aset / Surat legalitas lahan</li>
                          <li>Dokumentasi visual foto kerusakan bangunan dari 4 arah mata angin</li>
                          <li>Sketsa gambar denah ruang bangunan terkait</li>
                        </ol>
                        <p>
                          Demikian surat permohonan bantuan penilaian teknis ini kami sampaikan dengan harapan agar tim teknis dari Dinas PUPR Kabupaten Garut dapat segera menjadwalkan verifikasi dan survei lapangan ke lokasi kami. Atas perhatian dan kerja sama yang baik, kami haturkan terima kasih.
                        </p>
                      </div>

                      {/* Signatures */}
                      <div className="pt-6 flex justify-end">
                        <div className="text-center text-xs font-sans space-y-12 w-64">
                          <div>
                            <p>Kepala Instansi / Sekolah,</p>
                            <p className="text-[10px] text-slate-400 italic font-medium">(Tanda Tangan & Stempel Resmi)</p>
                          </div>
                          <div>
                            <p className="font-black border-b border-slate-900 pb-0.5 uppercase tracking-wide">{propForm.headmasterName}</p>
                            <p className="text-[10px] text-slate-500 font-mono font-bold">NIP. 19741020200212100{Math.floor(1 + Math.random()*9)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-8 shadow-md border border-slate-200 max-w-2xl mx-auto space-y-6">
                      {/* Title */}
                      <div className="text-center space-y-1.5 border-b-2 border-slate-950 pb-3">
                        <h2 className="text-base font-black uppercase font-sans tracking-widest text-slate-900">SURAT PERNYATAAN PERTANGGUNGJAWABAN MUTLAK (SPTJM)</h2>
                        <h3 className="text-xs font-bold uppercase font-sans text-slate-500">PENGAJUAN USULAN REHABILITASI / SLF KABUPATEN GARUT</h3>
                      </div>

                      {/* Declaration Intro */}
                      <p className="text-xs font-sans text-slate-700 leading-relaxed">
                        Yang bertanda tangan di bawah ini selaku penanggung jawab penuh atas keabsahan data administrasi dan teknis pengusulan kelaikan fungsi bangunan:
                      </p>

                      {/* Declarer Data Table */}
                      <div className="text-xs font-sans text-slate-700 space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                        <div className="grid grid-cols-3">
                          <span className="font-bold text-slate-500">Nama Lengkap</span>
                          <span className="col-span-2 font-black">: {propForm.headmasterName}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold text-slate-500">Jabatan Resmi</span>
                          <span className="col-span-2 font-bold">: Kepala {propForm.schoolName}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold text-slate-500">Instansi / Unit Kerja</span>
                          <span className="col-span-2 font-bold">: {propForm.schoolName}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold text-slate-500">NPSN / Kode Registrasi</span>
                          <span className="col-span-2 font-mono font-bold">: {propForm.npsn}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold text-slate-500">Alamat Lengkap</span>
                          <span className="col-span-2">: {propForm.schoolAddress}</span>
                        </div>
                      </div>

                      {/* Declarer Promises */}
                      <div className="text-xs space-y-3 font-sans text-slate-700 leading-relaxed">
                        <p>Menyatakan dengan sesungguhnya dan penuh tanggung jawab mutlak bahwa:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            Seluruh data identitas instansi, detail luas massa bangunan gedung, jumlah lantai, serta nilai input volume kerusakan pada borang penilaian mandiri (Self-Assessment) via aplikasi <strong>PUPR Cerdas</strong> adalah benar, akurat, dan sesuai dengan kondisi faktual di lapangan.
                          </li>
                          <li>
                            Dokumen bukti kepemilikan aset / status kepemilikan lahan yang kami lampirkan adalah dokumen sah dan tidak sedang berada dalam sengketa hukum dengan pihak mana pun.
                          </li>
                          <li>
                            Kami bersedia dan sanggup memfasilitasi tim verifikator dinas PUPR Kabupaten Garut saat melakukan kunjungan survei fisik validasi lapangan serta menerima seluruh keputusan penilaian akhir kelaikan bangunan gedung resmi.
                          </li>
                          <li>
                            Apabila di kemudian hari ditemukan unsur manipulasi data, pemalsuan dokumen pendukung, atau ketidaksesuaian yang disengaja dalam berkas permohonan ini, kami bersedia dituntut sesuai dengan hukum pidana dan perdata yang berlaku di Negara Republik Indonesia.
                          </li>
                        </ol>
                        <p>
                          Demikian Surat Pernyataan Pertanggungjawaban Mutlak (SPTJM) ini kami buat dengan kesadaran penuh tanpa ada paksaan dari pihak mana pun untuk digunakan sebagaimana mestinya.
                        </p>
                      </div>

                      {/* Signatures with Meterai box */}
                      <div className="pt-8 flex justify-between items-end font-sans">
                        <div className="border border-dashed border-slate-300 w-28 h-20 flex items-center justify-center text-center text-[8px] text-slate-400 font-bold bg-slate-50/50 rounded-lg">
                          <span>TEMPEL MATERAI<br/>Rp 10.000<br/>dan Stempel Basah</span>
                        </div>
                        
                        <div className="text-center text-xs space-y-12 w-64">
                          <p>Garut, {new Date(propForm.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <div>
                            <p className="font-black border-b border-slate-900 pb-0.5 uppercase tracking-wide">{propForm.headmasterName}</p>
                            <p className="text-[10px] text-slate-500 font-bold">Kepala Sekolah / Instansi</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer (Controls) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDocPreview(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Mark the document as drafted / completed in checklist!
                      const targetId = showDocPreview;
                      setPropDocs(prev => prev.map(d => {
                        if (d.id === targetId) {
                          return { ...d, status: "Siap Dikirim", file: targetId === "sp" ? "surat_permohonan_terbentuk.pdf" : "sptjm_bermaterai_terbentuk.pdf" };
                        }
                        return d;
                      }));
                      setShowDocPreview(null);
                      alert(`🎉 Berhasil melengkapi draf! Status dokumen "${targetId === 'sp' ? 'Surat Permohonan' : 'SPTJM'}" kini telah berubah menjadi "Siap Dikirim".`);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Konfirmasi & Lengkapi Berkas</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (activeRole === "Pengelola_Bangunan") {
    // 1. Filter assessments by logged in user's ID
    const activeUserId = localStorage.getItem("activeUserId");
    const myAssessments = activeUserId 
      ? assessments.filter(a => String(a.idUserPengelola) === activeUserId)
      : [];
    const finalAssessments = myAssessments;
    
    // 2. Calculations
    const myTotalBuildings = finalAssessments.length;
    const myTotalDamage = finalAssessments.reduce((sum, a) => sum + (a.finalResult?.totalDamagePercentage || 0), 0);
    const myAverageDamage = myTotalBuildings > 0 ? (myTotalDamage / myTotalBuildings) : 0;
    
    // Base BHI
    const myBHI = 100 - myAverageDamage;
    
    // Cost estimation (luasBangunan * 2.500.000 * damageFraction)
    const myTotalCost = finalAssessments.reduce((sum, a) => {
      const damageFraction = (a.finalResult?.totalDamagePercentage || 0) / 100;
      const area = a.buildingArea || 380;
      return sum + (damageFraction * area * 2500000);
    }, 0);
    
    // Status counts
    const myWaitingCount = finalAssessments.filter(a => a.status === 'Menunggu_Validasi' || a.status === 'Survei_Lapangan').length;
    const myResolvedCount = finalAssessments.filter(a => a.status === 'Selesai_Dianalisis' || a.status === 'Arsip_Digital').length;

    // Dynamically calculate component damages from finalAssessments
    const componentStats: Record<string, { name: string, weight: number, sumDamage: number, count: number }> = {};
    
    finalAssessments.forEach(a => {
      a.components?.forEach((c: any) => {
        if (!componentStats[c.id]) {
          componentStats[c.id] = { name: c.name, weight: c.weight, sumDamage: 0, count: 0 };
        }
        
        let cDamage = 0;
        c.damageDetails?.forEach((d: any) => {
           cDamage += d.percentage;
        });
        
        componentStats[c.id].sumDamage += cDamage;
        componentStats[c.id].count += 1;
      });
    });

    const colors = ["#10B981", "#3B82F6", "#EAB308", "#F97316", "#EC4899", "#8B5CF6", "#14B8A6"];
    const componentsList = Object.keys(componentStats).map((id, idx) => {
      const st = componentStats[id];
      return {
        id,
        name: st.name,
        weight: st.weight,
        avgDamage: st.count > 0 ? (st.sumDamage / st.count) : 0,
        color: colors[idx % colors.length]
      };
    });

    const totalStructureWeight = componentsList.reduce((sum, c) => sum + c.weight, 0) || 100;

    // Simulated BHI based on simulatedRepairs toggles
    let simulatedAverageDamage = 0;
    
    componentsList.forEach(c => {
      const isRepaired = simulatedRepairs[c.id];
      const damage = isRepaired ? 0 : c.avgDamage;
      simulatedAverageDamage += (damage * (c.weight / totalStructureWeight));
    });
    
    const mySimulatedDamage = myAverageDamage - componentsList.reduce((sum, c) => {
      if (simulatedRepairs[c.id]) {
        return sum + (c.avgDamage * (c.weight / totalStructureWeight)); // contribution to average
      }
      return sum;
    }, 0);
    
    const mySimulatedBHI = Math.min(100, 100 - Math.max(0, mySimulatedDamage));
    const bhiDifference = mySimulatedBHI - myBHI;

    // Estimated saved cost if simulated repairs are done
    const estimatedSavedCost = componentsList.reduce((sum, c) => {
      if (simulatedRepairs[c.id]) {
        // save proportion
        return sum + (c.avgDamage / 100 * 380 * 2500000 * (c.weight / 58.5));
      }
      return 0;
    }, 0);

    const getMyBhiStatus = (val: number) => {
      if (val >= 85) return { label: "Sangat Baik (Aman)", color: "text-emerald-500", bg: "bg-emerald-500", lightBg: "bg-emerald-50", border: "border-emerald-200" };
      if (val >= 70) return { label: "Baik (Wajar)", color: "text-blue-500", bg: "bg-blue-500", lightBg: "bg-blue-50", border: "border-blue-200" };
      if (val >= 55) return { label: "Cukup (Butuh Atensi)", color: "text-yellow-500", bg: "bg-yellow-500", lightBg: "bg-yellow-50", border: "border-yellow-200" };
      if (val >= 40) return { label: "Buruk (Bahaya)", color: "text-orange-500", bg: "bg-orange-500", lightBg: "bg-orange-50", border: "border-orange-200" };
      return { label: "Kritis (Sangat Bahaya)", color: "text-red-500", bg: "bg-red-500", lightBg: "bg-red-50", border: "border-red-200" };
    };

    const currentStatusInfo = getMyBhiStatus(myBHI);
    const simulatedStatusInfo = getMyBhiStatus(mySimulatedBHI);

    const radarData = componentsList.map(c => ({
      subject: c.name,
      'Kerusakan (%)': c.avgDamage,
      'Simulasi (%)': simulatedRepairs[c.id] ? 0 : c.avgDamage,
      fullMark: 100,
    }));

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-5"
      >
        <AnimatePresence>
          {newReportsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 relative z-10 pt-0.5">
                <h3 className="text-sm font-bold text-rose-800">Peringatan Laporan Kerusakan Baru</h3>
                <p className="text-xs text-rose-600 mt-0.5 font-medium">Terdapat <strong>{newReportsCount} laporan kerusakan</strong> yang perlu segera ditindaklanjuti atau diverifikasi.</p>
              </div>
              <Link to="/list" className="relative z-10 shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all">
                Lihat Laporan
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Pengelola */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/20 w-fit mb-2 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" /> Dasbor Pengelola Bangunan
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2.5">
              Dinas PUPR Kabupaten Garut
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-2">
              <span>Pengguna: <strong>{localStorage.getItem("activeUserName") || "Pengelola Bangunan"}</strong></span>
              <span>•</span>
              <span>Penilaian Mandiri Fisik</span>
              <span>•</span>
              <span>Standar PUPR Cerdas</span>
            </p>
          </div>
          <Link
            to="/new"
            className="relative z-10 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Usulan Baru</span>
          </Link>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
            )}
          >
            <Activity className="w-4 h-4" />
            <span>Ikhtisar Analisis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={cn(
              "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === "recent"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
            )}
          >
            <Clock className="w-4 h-4" />
            <span>Aktivitas Terbaru</span>
            {auditTrails.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {auditTrails.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("consultation")}
            className={cn(
              "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === "consultation"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>Pusat Berkas & Pendampingan</span>
          </button>
        </div>

        {activeTab === "recent" ? (
          renderRecentActivity()
        ) : activeTab === "consultation" ? (
          renderConsultationCenter()
        ) : (
          <>
            {/* KPIs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Massa Bangunan */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-blue-500" /> Massa Bangunan Terdaftar
              </span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800">{myTotalBuildings}</span>
                <span className="text-xs font-semibold text-slate-400">Unit</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Selesai: <strong>{myResolvedCount}</strong></span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Proses: <strong>{myWaitingCount}</strong></span>
            </div>
          </div>

          {/* Card 2: BHI (Building Health Index) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> B.H.I Fasilitas (Kesehatan)
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800">{myBHI.toFixed(1)}</span>
                <span className="text-sm font-bold text-slate-400">/100</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentStatusInfo.bg}`}></div>
              <span className={`text-[11px] font-bold ${currentStatusInfo.color}`}>{currentStatusInfo.label}</span>
            </div>
          </div>

          {/* Card 3: Estimasi Kebutuhan Dana Rehabilitasi */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-rose-500" /> Estimasi Kebutuhan Anggaran
              </span>
              <div className="mt-3">
                <span className="text-2xl font-black text-rose-600">
                  Rp {myTotalCost > 0 ? (myTotalCost / 1000000).toFixed(0) : "0"} Jt
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5">Dihitung dari bobot kerusakan fisik bangunan</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Sifatnya estimasi mandiri awal</span>
            </div>
          </div>

          {/* Card 4: Status Usulan */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" /> Status Pengajuan Terakhir
              </span>
              <div className="mt-3">
                <span className="text-sm font-black text-emerald-400 block tracking-tight uppercase">
                  {myWaitingCount > 0 ? "SURVEI LAPANGAN" : "ANALISIS SELESAI"}
                </span>
                <p className="text-[9px] text-slate-400 mt-1">
                  {myWaitingCount > 0 
                    ? "Tim teknis dinas sedang menjadwalkan kunjungan verifikasi lapangan." 
                    : "Semua laporan kerusakan telah diverifikasi & dianalisis oleh dinas PUPR."}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-bold text-slate-300 flex justify-between items-center relative z-10">
              <span>PROGRES USULAN</span>
              <span className="text-emerald-400">{myWaitingCount > 0 ? "60%" : "100%"}</span>
            </div>
          </div>

        </div>

        {/* Main Grid: Left & Right Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column (lg:col-span-7): Alur Progres & Analisis Kerusakan */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Visual Workflow Tracker for Each Building */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Alur Progres & Verifikasi Berkas
              </h3>
              <div className="space-y-6">
                {finalAssessments.map((a) => {
                  // Get active step index based on status
                  let activeStep = 1; // Diajukan
                  if (a.status === 'Menunggu_Validasi') activeStep = 2; // Berkas Diverifikasi
                  else if (a.status === 'Survei_Lapangan') activeStep = 3; // Survei Lapangan
                  else if (a.status === 'Selesai_Dianalisis') activeStep = 4; // Analisis Teknis
                  else if (a.status === 'Arsip_Digital') activeStep = 5; // Hasil Terbit

                  const steps = [
                    { label: "Usulan Diajukan", desc: "Formulir mandiri dikirim" },
                    { label: "Validasi Berkas", desc: "Review awal administrasi" },
                    { label: "Survei Lapangan", desc: "Kunjungan Tim Teknis" },
                    { label: "Analisis Teknis", desc: "Perhitungan nilai kerusakan" },
                    { label: "Hasil Terbit", desc: "Dokumen rekomendasi keluar" },
                  ];

                  return (
                    <div key={a.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-3.5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{a.buildingName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tanggal Usulan: {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          activeStep >= 4 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {a.status?.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Timeline Nodes */}
                      <div className="relative pt-2 pb-6">
                        {/* Connecting Line */}
                        <div className="absolute top-5 left-3 right-3 h-0.5 bg-slate-200 -z-0">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
                          />
                        </div>

                        {/* Nodes */}
                        <div className="relative z-10 flex justify-between">
                          {steps.map((step, sIdx) => {
                            const isCompleted = sIdx + 1 < activeStep;
                            const isActive = sIdx + 1 === activeStep;
                            
                            return (
                              <div key={sIdx} className="flex flex-col items-center text-center max-w-[80px]">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300",
                                  isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                                  isActive ? "bg-white border-emerald-500 text-emerald-600 shadow-md ring-4 ring-emerald-50" :
                                  "bg-slate-100 border-slate-200 text-slate-400"
                                )}>
                                  {isCompleted ? "✓" : sIdx + 1}
                                </div>
                                <span className={cn(
                                  "text-[9px] font-bold mt-2 truncate w-full block",
                                  isActive ? "text-emerald-600" : isCompleted ? "text-slate-700" : "text-slate-400"
                                )}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Component Repair Simulator */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-500" /> Simulasi Pemeliharaan & Dampak BHI
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Lakukan simulasi perbaikan komponen untuk melihat kenaikan skor kesehatan bangunan Anda.</p>
                </div>
                <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">SIMULATOR</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4 pt-2">
                {/* Simulator Checklist Controls (col-span-7) */}
                <div className="md:col-span-7 space-y-2">
                  {componentsList.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setSimulatedRepairs(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                        simulatedRepairs[c.id] 
                          ? "bg-emerald-50/45 border-emerald-200/80 shadow-sm" 
                          : "bg-white border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={!!simulatedRepairs[c.id]} 
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{c.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Bobot: <strong>{c.weight}%</strong> • Rata-rata Kerusakan: <strong className="text-slate-600">{c.avgDamage}%</strong></p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        simulatedRepairs[c.id]
                          ? "bg-emerald-100/80 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {simulatedRepairs[c.id] ? "Disimulasikan Diperbaiki (0% Rusak)" : `Sesuai Keadaan (${c.avgDamage}%)`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Simulator Results Output (col-span-5) */}
                <div className="md:col-span-5 bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Output Hasil Simulasi</p>
                    
                    {/* BHI Comparison circle */}
                    <div className="flex justify-center items-center gap-3 py-1">
                      <div className="text-center">
                        <span className="text-xs text-slate-400 block font-bold">Asli</span>
                        <span className="text-lg font-black text-slate-600">{myBHI.toFixed(1)}</span>
                      </div>
                      <div className="w-0.5 h-8 bg-slate-200"></div>
                      <div className="text-center bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-2xl">
                        <span className="text-xs text-emerald-700 block font-bold">Simulasi</span>
                        <span className="text-2xl font-black text-emerald-600">{mySimulatedBHI.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                        <span>Peningkatan BHI:</span>
                        <span className={cn("font-bold", bhiDifference > 0 ? "text-emerald-600" : "text-slate-500")}>
                          {bhiDifference > 0 ? `+${bhiDifference.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                        <span>Predikat Baru:</span>
                        <span className={cn("font-bold", simulatedStatusInfo.color)}>
                          {simulatedStatusInfo.label.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                        <span>Terselamatkan:</span>
                        <span className="font-bold text-rose-600 font-mono">
                          {estimatedSavedCost > 0 ? `Rp ${(estimatedSavedCost / 1000000).toFixed(1)} Jt` : "Rp 0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {bhiDifference > 0 ? (
                    <div className="mt-4 p-2 bg-emerald-500 text-white rounded-xl text-center text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
                      <span>Efisiensi Pemeliharaan Tinggi</span>
                    </div>
                  ) : (
                    <div className="mt-4 p-2.5 bg-slate-100 text-slate-400 rounded-xl text-center text-[9px] font-bold">
                      Centang salah satu komponen di kiri untuk memulai simulasi perbaikan.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (lg:col-span-5): Component Chart & Buildings Cards & Guide */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Component Damage Radar Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 theme-transition">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Profil Kerusakan per Komponen
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke={theme === "dark" ? "#334155" : "#e2e8f0"} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: theme === "dark" ? "#94a3b8" : '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 8, fill: theme === "dark" ? "#64748b" : '#94a3b8' }} />
                    <Radar name="Asli" dataKey="Kerusakan (%)" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.25} />
                    <Radar name="Simulasi" dataKey="Simulasi (%)" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff", borderColor: theme === "dark" ? "#334155" : "#e2e8f0", color: theme === "dark" ? "#f8fafc" : "#0f172a" }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List of Managed Buildings */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-500" /> Massa Bangunan Saya
              </h3>
              <div className="space-y-3">
                {finalAssessments.map(a => {
                  const bhiVal = 100 - (a.finalResult?.totalDamagePercentage || 0);
                  return (
                    <div 
                      key={a.id} 
                      onClick={() => setSelectedAssessment(a)}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 flex justify-between items-center bg-slate-50/20 cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] group/item"
                      title="Klik untuk melihat rincian detail lengkap"
                    >
                      <div>
                        <h4 className="text-xs font-black text-slate-800 group-hover/item:text-emerald-600 transition-colors flex items-center gap-1">
                          <span>{a.buildingName}</span>
                          <span className="text-[9px] font-bold text-emerald-500 opacity-0 group-hover/item:opacity-100 transition-all font-mono shrink-0 ml-1">→ rincian</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                          <span>{a.buildingArea} m²</span>
                          <span>•</span>
                          <span>{a.floorCount} Lantai</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold block w-fit ml-auto mb-1",
                          a.finalResult?.category === "Berat" ? "bg-rose-100 text-rose-700" :
                          a.finalResult?.category === "Sedang" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {a.finalResult?.totalDamagePercentage || 0}% ({a.finalResult?.category || "Ringan"})
                        </span>
                        <span className="text-[9px] text-slate-400 block">BHI: <strong>{bhiVal.toFixed(1)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Guide & blank templates center */}
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-3.5 flex items-center gap-2 relative z-10">
                <BookOpen className="w-4 h-4" /> Pusat Panduan & Regulasi PUPR
              </h3>
              <p className="text-[11px] text-slate-300 relative z-10 leading-relaxed mb-4">
                Unduh formulir kosong resmi dari PUPR serta pelajari tata cara penilaian mandiri kerusakan bangunan gedung negara.
              </p>
              <div className="space-y-2 relative z-10">
                <a 
                  href="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Blanko Form PUPR (PDF)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a 
                  href="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Kriteria Kerusakan & Bobot</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Detailed Assessment Drawer Overlay */}
        
        <BuildingHistoryModal selectedAssessment={selectedAssessment} setSelectedAssessment={setSelectedAssessment} />
          </>
        )}

      </motion.div>
    );
  }

  if (activeRole === "Kadis") {
    const menungguPengesahan = assessments.filter(a => a.status === "Selesai_Dianalisis").length;
    const sudahDisahkan = assessments.filter(a => a.status === "Arsip_Digital").length;
    const totalPenilaian = assessments.length;
    const disahkanData = assessments.filter(a => a.status === "Arsip_Digital");
    const totalRusakBerat = disahkanData.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 45).length;
    const totalLuasPenanganan = disahkanData.reduce((sum, a) => sum + (a.buildingArea || 380), 0);
    const estAnggaran = disahkanData.reduce((sum, a) => sum + (((a.finalResult?.totalDamagePercentage || 0) / 100) * (a.buildingArea || 380) * 2500000), 0);
    const capaianKinerja = totalPenilaian > 0 ? Math.round((sudahDisahkan / totalPenilaian) * 100) : 0;

    // Data for charts
    const chartData = [
      { name: 'Triwulan I', selesai: Math.floor(sudahDisahkan * 0.2) },
      { name: 'Triwulan II', selesai: Math.floor(sudahDisahkan * 0.3) },
      { name: 'Triwulan III', selesai: Math.floor(sudahDisahkan * 0.4) },
      { name: 'Triwulan IV', selesai: Math.floor(sudahDisahkan * 0.1) },
    ];
    
    // Distribution for Pie Chart
    const berat = totalRusakBerat;
    const sedang = disahkanData.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 30 && (a.finalResult?.totalDamagePercentage || 0) <= 45).length;
    const ringan = disahkanData.filter(a => (a.finalResult?.totalDamagePercentage || 0) <= 30).length;
    
    const pieData = [
      { name: 'Rusak Ringan', value: ringan, fill: '#34d399' },
      { name: 'Rusak Sedang', value: sedang, fill: '#fbbf24' },
      { name: 'Rusak Berat', value: berat, fill: '#f43f5e' }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <h1 className="text-3xl font-black tracking-tight uppercase">
                  Executive Dashboard
                </h1>
              </div>
              <p className="text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
                Portal Indikator Kinerja Kunci (IKK) Kepala Dinas PUPR dalam Penyelenggaraan Pemantauan & Evaluasi Infrastruktur Bangunan Gedung (Permendagri No. 17/2007, PP 16/2021).
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 text-center min-w-[160px]">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Capaian Kinerja Layanan</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-black text-white">{capaianKinerja}</span>
                <span className="text-lg font-bold text-blue-300 mb-1">%</span>
              </div>
              <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${capaianKinerja}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation / Pintasan Kadis */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/disposisi" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Disposisi & Pengesahan</span>
          </Link>
          <Link to="/list" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Arsip Laporan Kerusakan</span>
          </Link>
          <Link to="/map" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full group-hover:scale-110 transition-transform">
              <MapIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Peta Persebaran Aset</span>
          </Link>
          <Link to="/ai" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Dashboard AI & Prediksi</span>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-blue-400/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Building className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">YTD</span>
            </div>
            <div>
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Aset Dievaluasi</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-white">{totalPenilaian}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 -rotate-45" /> +12% dari Triwulan lalu
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-amber-400/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              {menungguPengesahan > 0 ? (
                <span className="text-[10px] font-bold px-2 py-1 bg-rose-100 text-rose-600 rounded-lg animate-pulse">ACTION REQ</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg">CLEARED</span>
              )}
            </div>
            <div>
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Menunggu Pengesahan</h3>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{menungguPengesahan}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Dokumen siap Ditetapkan</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-rose-400/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Kondisi Rusak Berat</h3>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{totalRusakBerat}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Prioritas Penanganan APBD</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-emerald-400/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">SK Diterbitkan (Resmi)</h3>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{sudahDisahkan}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Total {totalLuasPenanganan.toLocaleString('id-ID')} m² Bangunan</p>
            </div>
          </div>
        </div>

        {/* Action Banner */}
        {menungguPengesahan > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-full shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900">Terdapat {menungguPengesahan} Dokumen Membutuhkan Pengesahan Pimpinan</h3>
                <p className="text-xs text-amber-700 mt-1 font-medium">Laporan Teknis dari Bidang Bangunan telah terverifikasi dan siap untuk ditetapkan sebagai Surat Keputusan Tingkat Kerusakan.</p>
              </div>
            </div>
            <Link to="/disposisi" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/30 flex items-center gap-2">
              Buka Kotak Masuk <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Charts & Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 theme-transition">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Tren Penyelesaian Evaluasi</h3>
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <BarChart className="w-4 h-4 text-slate-500" />
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#334155', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="selesai" name="Berkas Disahkan" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSelesai)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 theme-transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Distribusi Tingkat Kerusakan Aset</h3>
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <PieChart className="w-4 h-4 text-slate-500" />
                </div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-xs font-black" style={{ color: item.fill }}>{item.value} Unit ({totalPenilaian > 0 ? Math.round((item.value/disahkanData.length)*100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm theme-transition">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">Proyeksi Kebutuhan Anggaran Penanganan Fisik (APBD)</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left flex-1">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Total Estimasi Anggaran Rehabilitasi</p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                  {formatRupiah(estAnggaran)}
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Berdasarkan Harga Satuan Bangunan Gedung Negara (HSBGN) rata-rata Rp 2.500.000 / m²</p>
                </div>
              </div>
              <div className="shrink-0 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 w-full md:w-64 text-center">
                <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rata-rata Biaya Per Unit</p>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {disahkanData.length > 0 ? formatRupiah(estAnggaran / disahkanData.length) : "Rp 0"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm theme-transition mt-4">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" /> Profil & Rekam Jejak Aset Daerah
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Nama Bangunan</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">BHI</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {assessments.slice(0, 5).map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold block text-slate-800 dark:text-slate-200">{a.buildingName}</span>
                        <span className="text-[9px] text-slate-400">{a.schoolName}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded font-bold uppercase">{a.status?.replace('_', ' ') || 'Menunggu Validasi'}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        {(100 - (a.finalResult?.totalDamagePercentage || 0)).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedAssessment(a)} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-[10px] font-bold rounded-lg transition-all">
                          Lihat Detail & Riwayat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {assessments.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/list" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat Semua Aset →</Link>
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatusUpdatesWidget />
          <StaffPerformancePanel />
        </div>
        <BuildingHistoryModal selectedAssessment={selectedAssessment} setSelectedAssessment={setSelectedAssessment} />
      </motion.div>
    );
  }

  if (activeRole === "Operator") {
    const menungguValidasi = assessments.filter(a => (a.status || "Menunggu_Validasi") === "Menunggu_Validasi").length;
    const menungguDisposisi = assessments.filter(a => a.status === "Survei_Lapangan").length;
    const selesaiDianalisis = assessments.filter(a => a.status === "Selesai_Dianalisis").length;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
              <Activity className="w-7 h-7 text-emerald-400" />
              Dasbor Operator Dinas
            </h1>
            <p className="text-sm text-emerald-100/70 mt-1 font-mono">
              Portal Verifikasi Administrasi & Disposisi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Menunggu Verifikasi Administrasi</p>
              <h3 className="text-2xl font-black text-amber-600">{menungguValidasi}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl"><FileText className="w-6 h-6 text-amber-500" /></div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Siap Disposisi (Selesai Verifikasi)</p>
              <h3 className="text-2xl font-black text-blue-600">{menungguDisposisi}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl"><ClipboardList className="w-6 h-6 text-blue-500" /></div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Permohonan Diproses</p>
              <h3 className="text-2xl font-black text-slate-800">{assessments.length}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl"><Activity className="w-6 h-6 text-slate-500" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Jalan Pintas Operator</h3>
            <div className="space-y-3">
              <Link to="/admin-verifikasi" className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition-colors"><FileCheck className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-emerald-800">Verifikasi Berkas Administrasi Masuk</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/disposisi" className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors"><ClipboardList className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-blue-800">Buat & Terbitkan Kartu Disposisi</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/settings" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 rounded-lg text-slate-600 group-hover:bg-slate-300 transition-colors"><Users className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-slate-700">Daftarkan Akun Pengelola Baru</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Permohonan Baru Masuk</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {assessments.filter(a => (a.status || "Menunggu_Validasi") === "Menunggu_Validasi").slice(0, 5).map(a => (
                <div key={a.id} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{a.schoolName}</h4>
                    <p className="text-[10px] text-slate-500">{format(new Date(a.date), "dd MMM yyyy", { locale: id })}</p>
                  </div>
                  <Link to="/admin-verifikasi" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">Verifikasi</Link>
                </div>
              ))}
              {menungguValidasi === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">Semua permohonan telah diverifikasi</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatusUpdatesWidget />
          <StaffPerformancePanel />
        </div>
        <BuildingHistoryModal selectedAssessment={selectedAssessment} setSelectedAssessment={setSelectedAssessment} />
      </motion.div>
    );
  }


  if (activeRole === "Koordinator") {
    const menungguDisposisi = assessments.filter(a => a.status === "Survei_Lapangan").length;
    const dalamProses = assessments.filter(a => a.status === "Selesai_Dianalisis").length;

    // Simple calendar logic
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    
    // Create dummy schedules for visual
    const schedules = assessments.map(a => {
      const d = new Date(a.date);
      // arbitrarily add 3 days for deadline
      return { id: a.id, day: (d.getDate() + 3) % daysInMonth + 1, type: 'deadline', schoolName: a.schoolName };
    });

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-sky-900 to-blue-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
              <Calendar className="w-7 h-7 text-sky-400" />
              Dasbor Koordinator Survei
            </h1>
            <p className="text-sm text-sky-100/70 mt-1 font-mono">
              Manajemen Jadwal Inspeksi & Disposisi Tim Teknis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Siap Disposisi Ke Tim Teknis</p>
              <h3 className="text-2xl font-black text-blue-600">{menungguDisposisi}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl"><ClipboardList className="w-6 h-6 text-blue-500" /></div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Jadwal Inspeksi</p>
              <h3 className="text-2xl font-black text-emerald-600">{assessments.length}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl"><Calendar className="w-6 h-6 text-emerald-500" /></div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Analisis Dalam Proses</p>
              <h3 className="text-2xl font-black text-amber-600">{dalamProses}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl"><Activity className="w-6 h-6 text-amber-500" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Kalender Jadwal Inspeksi & Tenggat Waktu
              </h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Deadline Verifikasi</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Jadwal Inspeksi</span>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>
              ))}
              {Array.from({length: firstDay}).map((_, i) => (
                <div key={'empty-'+i} className="h-16 rounded-xl bg-slate-50/50 border border-slate-100/50"></div>
              ))}
              {days.map(d => {
                const daySchedules = schedules.filter(s => s.day === d);
                const isToday = d === today.getDate();
                return (
                  <div key={d} className={"h-16 rounded-xl border p-1 flex flex-col " + (isToday ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white")}>
                    <span className={"text-xs font-bold " + (isToday ? "text-blue-700" : "text-slate-600")}>{d}</span>
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {daySchedules.map((s, idx) => (
                        <div key={idx} className="w-full text-[8px] bg-rose-100 text-rose-700 px-1 py-0.5 rounded truncate font-medium">
                          {s.schoolName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Jalan Pintas Koordinator</h3>
            <div className="space-y-3">
              <Link to="/disposisi" className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors"><ClipboardList className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-blue-800">Tambahkan Tugas Disposisi ke Tim Teknis</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/list" className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition-colors"><Activity className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-emerald-800">Pantau Progres Penilaian</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mt-6 mb-4 border-b border-slate-100 pb-2">Notifikasi Tenggat Waktu</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {assessments.slice(0, 3).map(a => (
                <div key={a.id} className="p-3 border border-rose-100 rounded-xl flex justify-between items-center bg-rose-50/50">
                  <div>
                    <h4 className="text-xs font-bold text-rose-800 truncate max-w-[150px]">{a.schoolName}</h4>
                    <p className="text-[10px] text-rose-600 font-medium">Batas Waktu: Besok</p>
                  </div>
                  <Clock className="w-4 h-4 text-rose-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <BuildingHistoryModal selectedAssessment={selectedAssessment} setSelectedAssessment={setSelectedAssessment} />
      </motion.div>
    );
  }


  if (activeRole === "Tim_Teknis") {
    const tugasSurvei = assessments.filter(a => a.status === "Survei_Lapangan").length;
    const tugasSelesai = assessments.filter(a => a.status === "Selesai_Dianalisis").length;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-orange-900 to-amber-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
              <MapPin className="w-7 h-7 text-orange-400" />
              Dasbor Tim Teknis Lapangan
            </h1>
            <p className="text-sm text-orange-100/70 mt-1 font-mono">
              Manajemen Tugas Survei & Penilaian Kerusakan Bangunan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tugas Survei Aktif</p>
              <h3 className="text-2xl font-black text-rose-600">{tugasSurvei}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl"><MapPin className="w-6 h-6 text-rose-500" /></div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Survei Selesai (Bulan Ini)</p>
              <h3 className="text-2xl font-black text-emerald-600">{tugasSelesai}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Jalan Pintas Operasional</h3>
            <div className="space-y-3">
              <Link to="/list" className="flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors"><FileText className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-orange-800">Lihat Daftar Tugas Penilaian & Survei</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/map" className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors"><MapIcon className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-blue-800">Peta Lokasi Survei Bangunan</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/new" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 rounded-lg text-slate-600 group-hover:bg-slate-300 transition-colors"><PlusCircle className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-slate-700">Input Data Form Lapangan Manual</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Tugas Prioritas Hari Ini</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {assessments.filter(a => a.status === "Survei_Lapangan").slice(0, 5).map(a => (
                <div key={a.id} className="p-3 border border-rose-100 rounded-xl flex flex-col gap-2 bg-rose-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{a.schoolName}</h4>
                      <p className="text-[10px] text-slate-500">{a.address}</p>
                    </div>
                    <Link to={`/verifikasi?id=${a.id}`} className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded shadow-sm">Lihat Detail</Link>
                  </div>
                </div>
              ))}
              {tugasSurvei === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">Tidak ada tugas survei baru.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-indigo-600" /> Peta Interaktif Sebaran Tugas (Real-time)
              </h3>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">Live</span>
            </div>
            <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0">
              <DashboardMap filteredAssessments={filteredAssessments} setSelectedAssessment={setSelectedAssessment} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Jarak Tempuh Est.</p>
                <p className="text-lg font-black text-slate-700">{Math.round(tugasSurvei * 4.5)} <span className="text-xs font-normal">km</span></p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Waktu Est. Inspeksi</p>                <p className="text-lg font-black text-slate-700">{tugasSurvei * 2.5} <span className="text-xs font-normal">Jam</span></p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">SLA Pencapaian</p>
                <p className="text-lg font-black text-emerald-600">92%</p>
              </div>
            </div>
          </div>
        </div>
        <BuildingHistoryModal selectedAssessment={selectedAssessment} setSelectedAssessment={setSelectedAssessment} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <AnimatePresence>
        {newReportsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 relative z-10 pt-0.5">
              <h3 className="text-sm font-bold text-rose-800">Peringatan Laporan Kerusakan Baru</h3>
              <p className="text-xs text-rose-600 mt-0.5 font-medium">Terdapat <strong>{newReportsCount} laporan kerusakan</strong> yang perlu segera ditindaklanjuti atau diverifikasi oleh tim penilai.</p>
            </div>
            <Link to="/list" className="relative z-10 shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all">
              Lihat Laporan
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Executive Summary Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
            <Activity className="w-7 h-7 text-blue-400" />
            Dasbor Eksekutif SPKBG
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            Sistem Penilaian Kerusakan Bangunan Gedung • Nasional & Internasional Standard (ISO 55000, FEMA, ASCE 41-23)
          </p>
        </div>
        <button
          onClick={handleSeedSample}
          disabled={seeding}
          className="relative z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-400" />}
          <span className="text-xs">Sinkronisasi Data Nasional</span>
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
          )}
        >
          <Activity className="w-4 h-4" />
          <span>Ikhtisar Analisis</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={cn(
            "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
            activeTab === "recent"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Aktivitas Terbaru</span>
          {auditTrails.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {auditTrails.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "recent" ? (
        renderRecentActivity()
      ) : (
        <>
          <ExecutiveSummaryWidget />
          {/* 1.5. Filter Wilayah Terintegrasi */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Wilayah Terintegrasi</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Saring seluruh grafik bulanan, peta GIS, dan matriks risiko secara otomatis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="region-filter" className="text-xs font-bold text-slate-500 shrink-0">Wilayah / Kota:</label>
          <select
            id="region-filter"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {selectedCity !== "Semua" && (
            <button
              onClick={() => setSelectedCity("Semua")}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl transition-all whitespace-nowrap"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusUpdatesWidget />
        <StaffPerformancePanel />
      </div>
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-blue-500"/> Total Bangunan
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{targetTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500 flex justify-between items-center bg-slate-50 p-2 rounded-lg">
            <span>Telah Dinilai: <strong className="text-emerald-600">{targetAssessed.toLocaleString('id-ID')}</strong></span>
            <span>({targetPercent}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500"/> B.H.I (ISO 55000)
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{currentBHI.toFixed(1)}</span>
            <span className="text-sm font-bold text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${bhiStatus.bg}`}></div>
            <span className={`text-xs font-bold ${bhiStatus.color}`}>{bhiStatus.label}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-purple-500"/> Indeks Kondisi Fasilitas
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 font-mono">{fciValue.toFixed(1)}%</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500 flex justify-between items-center bg-slate-50 p-2 rounded-lg">
            <span>Status: <strong className={fciStatus.color}>{fciStatus.label}</strong></span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2 relative z-10">
            <ShieldCheck className="w-3.5 h-3.5"/> Skor Kerusakan Cerdas
          </span>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-white">{currentSBDS.toFixed(1)}</span>
          </div>
          <div className="mt-2 text-xs font-bold text-white flex justify-between items-center bg-white/10 p-2 rounded-lg relative z-10 backdrop-blur-sm border border-white/10">
            <span>Kategori: {sbdsStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Row 2: Charts & Matrix */}
        
        {/* Damage Severity Index */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Indeks Keparahan Kerusakan</h3>
            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">FEMA P-58</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dsiData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {dsiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff", borderColor: theme === "dark" ? "#334155" : "#e2e8f0", color: theme === "dark" ? "#f8fafc" : "#0f172a" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {dsiData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600 dark:text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="truncate">{d.name}: <strong className="text-slate-800 dark:text-slate-200">{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Building Health Index Distribution */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Distribusi Building Health Index</h3>
            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">ISO 55000</span>
          </div>
          <div className="h-56 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bhiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: theme === "dark" ? "#94a3b8" : '#64748b' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: theme === "dark" ? "#94a3b8" : '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: theme === "dark" ? "#334155" : '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff", color: theme === "dark" ? "#f8fafc" : "#0f172a", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {bhiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Matriks Penilaian Risiko</h3>
            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">ISO 31000</span>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 grid grid-cols-5 grid-rows-5 gap-1 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 relative">
              {/* Y Axis Label */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Kemungkinan</div>
              {/* X Axis Label */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Dampak</div>
              
              {/* Generate 5x5 grid cells */}
              {Array.from({ length: 25 }).map((_, i) => {
                const row = Math.floor(i / 5);
                const col = i % 5;
                const riskLevel = row + (4 - col); // simple mock risk gradient (top right is highest)
                
                let bgColor = "bg-emerald-100";
                if (riskLevel > 4) bgColor = "bg-red-500";
                else if (riskLevel > 3) bgColor = "bg-orange-400";
                else if (riskLevel > 2) bgColor = "bg-yellow-300";
                else if (riskLevel > 1) bgColor = "bg-emerald-300";

                return (
                  <div key={i} className={`rounded-sm ${bgColor} border border-black/5 flex items-center justify-center transition-all hover:scale-110 hover:shadow-md cursor-pointer z-10`}>
                    {riskLevel > 4 && col === 4 && row === 0 && extremeRiskCount > 0 && <span className="text-[8px] font-black text-white">{extremeRiskCount}</span>}
                    {riskLevel === 4 && col === 3 && row === 1 && highRiskCount > 0 && <span className="text-[8px] font-black text-white">{highRiskCount}</span>}
                    {riskLevel === 3 && col === 2 && row === 2 && medRiskCount > 0 && <span className="text-[8px] font-black text-white">{medRiskCount}</span>}
                    {riskLevel === 2 && col === 1 && row === 3 && lowRiskCount > 0 && <span className="text-[8px] font-black text-white">{lowRiskCount}</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-6 text-[9px] font-bold text-slate-500 uppercase">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-300 rounded-full"></div>Rendah ({lowRiskCount})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-300 rounded-full"></div>Sedang ({medRiskCount})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-400 rounded-full"></div>Tinggi ({highRiskCount})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Ekstrem ({extremeRiskCount})</span>
            </div>
          </div>
        </div>

        {/* Row 2.5: Monthly Damage Level Distribution Chart */}
        <div className="col-span-12 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                Distribusi Bulanan Tingkat Kerusakan Bangunan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visualisasi kumulatif sebaran tingkat kerusakan fisik (Sangat Ringan hingga Sangat Berat) per bulan.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 theme-transition">
              <button
                type="button"
                onClick={() => setTimeRange("6")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  timeRange === "6" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                6 Bulan Terakhir
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("12")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  timeRange === "12" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                12 Bulan Terakhir
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Recharts Stacked Bar Chart */}
            <div className="lg:col-span-8 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyDamageData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: theme === "dark" ? "#94a3b8" : '#64748b', fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: theme === "dark" ? "#94a3b8" : '#64748b', fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: theme === "dark" ? "#1e293b" : '#f8fafc' }}
                    contentStyle={{ 
                      backgroundColor: theme === "dark" ? "#1e293b" : '#ffffff', 
                      borderRadius: '12px', 
                      border: theme === "dark" ? '1px solid #334155' : '1px solid #e2e8f0', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                      fontSize: '12px',
                      padding: '12px',
                      color: theme === "dark" ? "#f8fafc" : "#0f172a"
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: theme === "dark" ? "#cbd5e1" : '#475569' }} 
                  />
                  <Bar dataKey="Sangat Ringan" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Ringan" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Sedang" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Berat" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Sangat Berat" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Insights Summary Panel */}
            <div className="lg:col-span-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 theme-transition">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest pb-2 border-b border-slate-200 dark:border-slate-800">
                Ikhtisar Distribusi
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Sangat Ringan
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {monthlyDamageData.reduce((sum, item) => sum + item["Sangat Ringan"], 0)} Unit
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span> Ringan
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {monthlyDamageData.reduce((sum, item) => sum + item["Ringan"], 0)} Unit
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Sedang
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {monthlyDamageData.reduce((sum, item) => sum + item["Sedang"], 0)} Unit
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span> Berat
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {monthlyDamageData.reduce((sum, item) => sum + item["Berat"], 0)} Unit
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Sangat Berat
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {monthlyDamageData.reduce((sum, item) => sum + item["Sangat Berat"], 0)} Unit
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Catatan Analitis:</span> Tren sebaran bulanan ini dirancang untuk mendeteksi lonjakan laporan kerusakan secara musiman dan mengestimasi ketersediaan alokasi anggaran PUPR secara proaktif.
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: GIS, AI, Maintenance/Cost */}
        
        {/* GIS Monitoring Dashboard */}
        <div className="col-span-12 md:col-span-7 bg-white p-0 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden min-h-[250px]">
          <div className="absolute inset-0 bg-slate-100 opacity-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-white/90 to-transparent">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-blue-500" /> Pemantauan GIS
            </h3>
            <p className="text-[9px] text-slate-500 font-mono mt-1">Overlay: Risiko Gempa, Banjir, Longsor</p>
          </div>
          
          <div className="absolute inset-0 z-0">
             {/* Mock map elements */}
             <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-xl border border-red-500/20"></div>
             <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-xl border border-blue-500/20"></div>
             
             {/* Pins */}
             <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-3 h-3 bg-red-500 rounded-full absolute top-1/3 left-1/3 border-2 border-white shadow-lg cursor-pointer"></motion.div>
             <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="w-2.5 h-2.5 bg-orange-500 rounded-full absolute top-[30%] left-[40%] border border-white shadow-lg cursor-pointer"></motion.div>
             <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} className="w-3 h-3 bg-emerald-500 rounded-full absolute bottom-1/3 right-1/4 border-2 border-white shadow-lg cursor-pointer"></motion.div>
             <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1.5 }} className="w-2 h-2 bg-yellow-500 rounded-full absolute bottom-[40%] right-[30%] border border-white shadow-lg cursor-pointer"></motion.div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2">
            <div className="bg-white/90 backdrop-blur text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex-1 text-center">
              <span className="text-red-600 block text-lg font-black">{highRiskCount}</span> Risiko Tinggi
            </div>
            <div className="bg-white/90 backdrop-blur text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex-1 text-center">
              <span className="text-orange-600 block text-lg font-black">{extremeRiskCount}</span> Perlu Evakuasi
            </div>
          </div>
        </div>

        {/* Cost & Maintenance Combined */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Wrench className="w-3 h-3 text-slate-400" /> SLA Pemeliharaan
              </h3>
              <p className="text-2xl font-black text-slate-800 font-mono">
                {assessments.length > 0 ? Math.round((resolvedCount / assessments.length) * 100) : 100}%
              </p>
              <p className="text-[9px] font-medium text-emerald-600 bg-emerald-50 inline-block px-1.5 py-0.5 rounded mt-1">
                Prev: {assessments.length > 0 ? Math.max(45, Math.round((resolvedCount / assessments.length) * 85)) : 80}% | Corr: {assessments.length > 0 ? Math.max(15, Math.round((resolvedCount / assessments.length) * 15)) : 20}%
              </p>
            </div>
            <div className="w-24 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={maintData}>
                  <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-center">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3 h-3 text-slate-400" /> Dampak Biaya & Anggaran
            </h3>
            <div className="flex justify-between items-end border-b border-slate-100 pb-2 mb-2">
              <span className="text-[10px] font-medium text-slate-600">Estimasi Perbaikan</span>
              <span className="text-sm font-black text-rose-600 font-mono">
                {formatRupiah(totalEstimatedBudget)}
              </span>
            </div>
            <div className="flex justify-between items-end pb-1">
              <span className="text-[10px] font-medium text-slate-600">ROI Retrofit</span>
              <span className="text-sm font-black text-emerald-600 font-mono">
                {dynamicROI}%
              </span>
            </div>
          </div>
        </div>

        {/* AI Engine Damage Assessment Visualization */}
        <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" /> Metrik AI Damage Assessment
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Status deteksi kerusakan visual (Keretakan, Korosi, Pelapukan) berbasis AI Engine</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3" /> AI Engine Aktif
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Status Cards */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keretakan (Cracks)</p>
                  <p className="text-lg font-black text-slate-800">
                    {getAiSeverityLabel(aiMetrics.cracks)}{" "}
                    <span className="text-xs font-bold text-rose-600 ml-1">{aiMetrics.cracks}% Terdeteksi</span>
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Korosi (Corrosion)</p>
                  <p className="text-lg font-black text-slate-800">
                    {getAiSeverityLabel(aiMetrics.corrosion)}{" "}
                    <span className="text-xs font-bold text-amber-600 ml-1">{aiMetrics.corrosion}% Terdeteksi</span>
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pelapukan (Weathering)</p>
                  <p className="text-lg font-black text-slate-800">
                    {getAiSeverityLabel(aiMetrics.weathering)}{" "}
                    <span className="text-xs font-bold text-blue-600 ml-1">{aiMetrics.weathering}% Terdeteksi</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Radar Chart for AI Metrics */}
            <div className="md:col-span-2 bg-slate-900 rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
              
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 z-10">Pola Kerusakan AI (Confidence Score)</h4>
              <div className="w-full h-48 z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Keretakan Struktur', A: aiMetrics.cracks, fullMark: 100 },
                    { subject: 'Korosi Tulangan', A: aiMetrics.corrosion, fullMark: 100 },
                    { subject: 'Pelapukan Kayu', A: aiMetrics.weathering, fullMark: 100 },
                    { subject: 'Spalling Beton', A: Math.round(aiMetrics.cracks * 0.85), fullMark: 100 },
                    { subject: 'Penurunan Tanah', A: Math.round(aiMetrics.cracks * 0.60), fullMark: 100 },
                  ]}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} />
                    <Radar name="AI Confidence" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.5} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Decision Support Dashboard (Priority Table) */}
        <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-blue-600" /> Pendukung Keputusan: Peringkat Prioritas
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Metode: AHP / Fuzzy AHP / TOPSIS / Kekritisan Aset</p>
            </div>
            {assessments.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg">Data Asli Aktif</span>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-100 bg-white">
                <tr>
                  <th className="px-6 py-3 text-center">Peringkat</th>
                  <th className="px-6 py-3">Nama Aset / Bangunan</th>
                  <th className="px-6 py-3">Kategori Kritis</th>
                  <th className="px-6 py-3 text-center">Skor BHI</th>
                  <th className="px-6 py-3 text-center">Tingkat Risiko</th>
                  <th className="px-6 py-3 text-right">Estimasi Biaya</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-slate-700">
                {criticalBuildings.length > 0 ? (
                  criticalBuildings.map((a, idx) => {
                    const bhiVal = 100 - (a.finalResult?.totalDamagePercentage || 0);
                    const getPriorityLabels = (val: number) => {
                      if (val < 50) {
                        return {
                          cat: "Sangat Kritis",
                          catClass: "bg-rose-100 text-rose-700",
                          risk: "Ekstrem",
                          riskClass: "border-rose-200 text-rose-600"
                        };
                      } else if (val < 70) {
                        return {
                          cat: "Kritis",
                          catClass: "bg-amber-100 text-amber-700",
                          risk: "Tinggi",
                          riskClass: "border-amber-200 text-amber-600"
                        };
                      } else if (val < 85) {
                        return {
                          cat: "Sedang",
                          catClass: "bg-blue-100 text-blue-700",
                          risk: "Sedang",
                          riskClass: "border-blue-200 text-blue-600"
                        };
                      } else {
                        return {
                          cat: "Rendah",
                          catClass: "bg-emerald-100 text-emerald-700",
                          risk: "Rendah",
                          riskClass: "border-emerald-200 text-emerald-600"
                        };
                      }
                    };
                    const labels = getPriorityLabels(bhiVal);
                    const costEst = ((a.finalResult?.totalDamagePercentage || 0) / 100) * (a.buildingArea || 380) * 2500000;

                    return (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 text-center"><span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 mx-auto">{idx + 1}</span></td>
                        <td className="px-6 py-3">
                          <span className="font-bold text-slate-800">{a.schoolName}</span>
                          <br/><span className="text-[10px] text-slate-500 font-normal">{a.buildingName}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", labels.catClass)}>{labels.cat}</span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="font-mono text-rose-600 font-bold">{bhiVal.toFixed(1)}</span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", labels.riskClass)}>{labels.risk}</span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-slate-700">{formatRupiah(costEst)}</td>
                        <td className="px-6 py-3 text-center">
                          <button onClick={() => setSelectedAssessment(a)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-all border border-slate-200">
                            Lihat Detail & Riwayat
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Belum ada data prioritas. Silakan lakukan asesmen terlebih dahulu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )}

    </motion.div>
  );
}
