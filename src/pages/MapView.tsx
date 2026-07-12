import { useEffect, useState } from "react";
import { Assessment } from "../types";
import { Camera } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MarkerWithInfoWindow({ assessment }: { assessment: Assessment }) {
  if (!assessment.coordinates) return null;

  const category = assessment.finalResult.category;
  const isLight = category === 'Ringan';
  const isMedium = category === 'Sedang';
  
  const bgColor = isLight ? '#2E7D32' : isMedium ? '#FFB300' : '#E65100';

  return (
    <Marker 
      position={[assessment.coordinates.lat, assessment.coordinates.lng]} 
      icon={createCustomIcon(bgColor)}
    >
      <Popup>
        <div className="p-1 max-w-[240px]">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{assessment.schoolName}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{assessment.buildingName}</p>
          
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              isLight ? 'bg-[#2E7D32]/10 text-[#2E7D32] dark:bg-[#2E7D32]/20 dark:text-emerald-400' : 
              isMedium ? 'bg-[#FFB300]/20 text-[#B78100] dark:text-[#FFB300] dark:bg-[#FFB300]/10' : 
              'bg-[#E65100]/10 text-[#E65100] dark:bg-[#E65100]/20 dark:text-orange-400'
            )}>
              Rusak {category} ({assessment.finalResult.totalDamagePercentage.toFixed(1)}%)
            </span>
          </div>

          {assessment.photos && assessment.photos.length > 0 && (
            <div className="mt-2 border-t pt-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Camera className="w-3 h-3" />
                <span>{assessment.photos.length} Foto Lampiran</span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {assessment.photos.slice(0, 2).map((p, i) => (
                  <img key={i} src={p} alt="Lampiran" className="w-full h-16 object-cover rounded-sm border border-slate-200 dark:border-slate-700" />
                ))}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        setAssessments(data);
        setLoading(false);
      });
  }, []);

  // Calculate center to fit markers or default to Garut (PUPR Garut region)
  const mapCenter: [number, number] = assessments.find(a => a.coordinates)
    ? [assessments.find(a => a.coordinates)!.coordinates.lat, assessments.find(a => a.coordinates)!.coordinates.lng]
    : [-7.227845, 107.908712];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl border border-white/50 dark:border-slate-800/80 shadow-lg flex flex-col h-[calc(100vh-8rem)] overflow-hidden theme-transition"
    >
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 dark:border-slate-800/50 flex justify-between items-center z-10 shadow-sm theme-transition">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 theme-transition">Peta Lokasi Bangunan</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest theme-transition">Distribusi laporan kerusakan berbasis geospasial</p>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-200/50 dark:bg-slate-950/50 relative z-0 theme-transition">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ width: '100%', height: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {assessments.filter(a => a.coordinates).map(a => (
            <MarkerWithInfoWindow key={a.id} assessment={a} />
          ))}
        </MapContainer>
        
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-10 theme-transition">
            <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="absolute bottom-6 left-6 z-[1000]">
          <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-md px-5 py-4 rounded-xl shadow-lg border border-white/50 dark:border-slate-800 pointer-events-auto theme-transition">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200/50 dark:border-slate-800 pb-2">Legenda</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 bg-garut-green rounded-full border border-green-800 shadow-sm"></div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rusak Ringan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 bg-pu-yellow rounded-full border border-yellow-600 shadow-sm"></div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rusak Sedang</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 bg-garut-orange rounded-full border border-orange-800 shadow-sm"></div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rusak Berat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
