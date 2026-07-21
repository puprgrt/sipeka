import { apiFetch } from "../lib/api";
import React, { useEffect, useState } from "react";
import AdminDashboard from "./dashboard/AdminDashboard";
import PengelolaDashboard from "./dashboard/PengelolaDashboard";
import KadisDashboard from "./dashboard/KadisDashboard";
import OperatorDashboard from "./dashboard/OperatorDashboard";
import KoordinatorDashboard from "./dashboard/KoordinatorDashboard";
import TimTeknisDashboard from "./dashboard/TimTeknisDashboard";
import { Assessment } from "../types";

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
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const [auditTrails, setAuditTrails] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAssessments = () => {
    setLoading(true);
    apiFetch("/api/assessments")
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
    apiFetch("/api/audit-trails")
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
      const res = await apiFetch("/api/seed-sample-building", { method: "POST" });
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

  // Calculate new reports count
  const newReportsCount = assessments.filter(a => a.status === "Menunggu_Validasi").length;

  if (activeRole === "Pengelola_Bangunan") {
    return (
      <PengelolaDashboard 
        assessments={assessments} 
        setSelectedAssessment={setSelectedAssessment}
        newReportsCount={newReportsCount}
        theme={theme}
      />
    );
  }

  if (activeRole === "Kadis") {
    return (
      <KadisDashboard 
        assessments={assessments}
        setSelectedAssessment={setSelectedAssessment}
      />
    );
  }

  if (activeRole === "Operator") {
    return (
      <OperatorDashboard 
        assessments={assessments}
      />
    );
  }

  if (activeRole === "Koordinator") {
    return (
      <KoordinatorDashboard 
        assessments={assessments}
        setSelectedAssessment={setSelectedAssessment}
      />
    );
  }

  if (activeRole === "Tim_Teknis") {
    return (
      <TimTeknisDashboard 
        assessments={assessments}
        setSelectedAssessment={setSelectedAssessment}
      />
    );
  }

  // Default to Admin Dashboard
  return (
    <AdminDashboard 
      assessments={assessments}
      auditTrails={auditTrails}
      newReportsCount={newReportsCount}
      seeding={seeding}
      handleSeedSample={handleSeedSample}
      theme={theme}
      setSelectedAssessment={setSelectedAssessment}
      loadingAudit={loadingAudit}
    />
  );
}
