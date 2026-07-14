import React, { memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Assessment } from '../../types';

interface DashboardMapProps {
  filteredAssessments: Assessment[];
  setSelectedAssessment: (val: Assessment | null) => void;
}

const DashboardMap = memo(({ filteredAssessments, setSelectedAssessment }: DashboardMapProps) => {
  return (
    <MapContainer 
                center={[-7.227845, 107.908712]} 
                zoom={12} 
                style={{ width: '100%', height: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredAssessments.filter(a => a.coordinates && a.status === "Survei_Lapangan").map(a => (
                  <Marker 
                    key={a.id} 
                    position={[a.coordinates.lat, a.coordinates.lng]}
                  >
                    <Popup>
                      <div className="text-xs">
                        <strong className="block">{a.schoolName}</strong>
                        <span className="text-slate-500">{a.buildingName}</span><br/>
                        <Link to={`/new?edit=${a.id}`} className="mt-2 inline-block bg-orange-600 text-white px-2 py-1 rounded font-bold uppercase text-[10px]">Isi Survei</Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
  );
});

export default DashboardMap;
