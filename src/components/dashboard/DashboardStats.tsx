import React from 'react';
import { Assessment } from '../../types';

interface DashboardStatsProps {
  filteredAssessments: Assessment[];
  waitingCount: number;
  resolvedCount: number;
  averageDamage: number;
}

export default function DashboardStats({ filteredAssessments, waitingCount, resolvedCount, averageDamage }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* TODO: Move the KPI cards here from Dashboard.tsx */}
      <div className="p-4 bg-white rounded shadow text-center">
        <h3 className="text-gray-500 text-sm">Menunggu Validasi</h3>
        <p className="text-2xl font-bold">{waitingCount}</p>
      </div>
      <div className="p-4 bg-white rounded shadow text-center">
        <h3 className="text-gray-500 text-sm">Selesai Dianalisis</h3>
        <p className="text-2xl font-bold">{resolvedCount}</p>
      </div>
    </div>
  );
}
