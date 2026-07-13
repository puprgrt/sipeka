/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AssessmentForm from "./pages/AssessmentForm";
import AssessmentList from "./pages/AssessmentList";
import DisposisiList from "./pages/DisposisiList";
import VerifikasiAdministrasi from "./pages/VerifikasiAdministrasi";
import VerificationList from "./pages/VerificationList";
import SuratReports from "./pages/SuratReports";
import MapView from "./pages/MapView";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import FileManager from "./pages/FileManager";
import AiDashboard from "./pages/AiDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ai" element={<AiDashboard />} />
          <Route path="new" element={<AssessmentForm />} />
          <Route path="list" element={<AssessmentList />} />
          <Route path="disposisi" element={<DisposisiList />} />
          <Route path="verifikasi" element={<VerificationList />} />
          <Route path="admin-verifikasi" element={<VerifikasiAdministrasi />} />
          <Route path="surat-reports" element={<SuratReports />} />
          <Route path="map" element={<MapView />} />
          <Route path="file-manager" element={<FileManager />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

