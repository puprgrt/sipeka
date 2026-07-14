import React, { memo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Assessment } from '../../types';
import { ArrowRight } from 'lucide-react';

// Fix for default marker icons in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function createCustomIcon(color: string) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapBoundsFitter({ assessments }: { assessments: Assessment[] }) {
  const map = useMap();
  
  useEffect(() => {
    // Only map those waiting for survey if that's what dashboard wants
    const targetAssessments = assessments.filter(a => a.coordinates && a.status === "Survei_Lapangan");
    const coords = targetAssessments.map(a => [a.coordinates!.lat, a.coordinates!.lng] as [number, number]);
      
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [assessments, map]);

  return null;
}

interface DashboardMapProps {
  filteredAssessments: Assessment[];
  setSelectedAssessment: (val: Assessment | null) => void;
}

const DashboardMap = memo(({ filteredAssessments, setSelectedAssessment }: DashboardMapProps) => {
  const mapCenter: [number, number] = [-7.227845, 107.908712]; // Fallback to Garut

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={12} 
      style={{ width: '100%', height: '100%' }}
      className="z-0 rounded-b-xl overflow-hidden"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      <MapBoundsFitter assessments={filteredAssessments} />

      {filteredAssessments.filter(a => a.coordinates && a.status === "Survei_Lapangan").map(a => {
        const category = a.finalResult?.category || 'Ringan';
        const isLight = category === 'Ringan';
        const isMedium = category === 'Sedang';
        const bgColor = isLight ? '#2E7D32' : isMedium ? '#FFB300' : '#E65100';

        return (
          <Marker 
            key={a.id} 
            position={[a.coordinates!.lat, a.coordinates!.lng]}
            icon={createCustomIcon(bgColor)}
          >
            <Popup className="smart-popup">
              <div className="p-1 min-w-[200px]">
                <strong className="block text-sm text-slate-800 dark:text-slate-100">{a.schoolName}</strong>
                <span className="text-xs text-slate-500 block mb-2">{a.buildingName}</span>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700">
                    Menunggu Survei
                  </span>
                </div>

                <Link 
                  to={`/new?edit=${a.id}`} 
                  className="w-full mt-2 bg-pu-blue hover:bg-blue-700 text-white py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Mulai Survei <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
});

export default DashboardMap;
