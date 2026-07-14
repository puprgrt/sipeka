import { useEffect, useState } from "react";
import { Assessment } from "../types";
import { Camera, Search, Filter, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";

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
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function MapBoundsFitter({ assessments }: { assessments: Assessment[] }) {
  const map = useMap();
  
  useEffect(() => {
    const coords = assessments
      .filter(a => a.coordinates)
      .map(a => [a.coordinates!.lat, a.coordinates!.lng] as [number, number]);
      
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [assessments, map]);

  return null;
}

function MarkerWithInfoWindow({ assessment }: { assessment: Assessment }) {
  const navigate = useNavigate();
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
      <Popup className="smart-popup">
        <div className="p-1 min-w-[240px]">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{assessment.schoolName}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{assessment.buildingName}</p>
          
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
            <div className="mt-2 mb-3 border-y py-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mb-1.5 mt-2">
                <Camera className="w-3 h-3" />
                <span>{assessment.photos.length} Foto Lampiran</span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1 mb-2">
                {assessment.photos.slice(0, 2).map((p, i) => (
                  <img key={i} src={p} alt="Lampiran" className="w-full h-14 object-cover rounded-md border border-slate-200 dark:border-slate-700" />
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => navigate(`/verification?id=${assessment.id}`)}
            className="w-full mt-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            Lihat Detail <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Smart Map States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        setAssessments(data);
        setLoading(false);
      });
  }, []);

  const validAssessments = assessments.filter(a => a.coordinates);

  const filteredAssessments = validAssessments.filter(a => {
    const matchSearch = (a.schoolName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                        (a.buildingName?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory ? a.finalResult.category === filterCategory : true;
    return matchSearch && matchCategory;
  });

  // Calculate statistics
  const countRingan = validAssessments.filter(a => a.finalResult.category === 'Ringan').length;
  const countSedang = validAssessments.filter(a => a.finalResult.category === 'Sedang').length;
  const countBerat = validAssessments.filter(a => a.finalResult.category === 'Berat').length;

  const mapCenter: [number, number] = validAssessments.length > 0
    ? [validAssessments[0].coordinates!.lat, validAssessments[0].coordinates!.lng]
    : [-7.227845, 107.908712];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl border border-white/50 dark:border-slate-800/80 shadow-lg flex flex-col h-[calc(100vh-8rem)] overflow-hidden theme-transition relative"
    >
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 dark:border-slate-800/50 flex justify-between items-center z-[1001] shadow-sm theme-transition">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 theme-transition">Dashboard Geospasial Cerdas</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest theme-transition">Menampilkan {filteredAssessments.length} laporan kerusakan</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari sekolah atau bangunan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pu-blue focus:border-pu-blue sm:text-sm transition-all shadow-sm"
          />
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
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapBoundsFitter assessments={filteredAssessments} />
          
          {filteredAssessments.map(a => (
            <MarkerWithInfoWindow key={a.id} assessment={a} />
          ))}
        </MapContainer>
        
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[2000] theme-transition">
            <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Statistics Dashboard Overlay */}
        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 dark:border-slate-800 w-56 theme-transition"
          >
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Filter Kategori</h4>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => setFilterCategory(filterCategory === 'Ringan' ? null : 'Ringan')}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-xl transition-all border",
                  filterCategory === 'Ringan' ? "bg-[#2E7D32]/10 border-[#2E7D32]" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#2E7D32] rounded-full shadow-sm"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ringan</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{countRingan}</span>
              </button>

              <button 
                onClick={() => setFilterCategory(filterCategory === 'Sedang' ? null : 'Sedang')}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-xl transition-all border",
                  filterCategory === 'Sedang' ? "bg-[#FFB300]/10 border-[#FFB300]" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#FFB300] rounded-full shadow-sm"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sedang</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{countSedang}</span>
              </button>

              <button 
                onClick={() => setFilterCategory(filterCategory === 'Berat' ? null : 'Berat')}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-xl transition-all border",
                  filterCategory === 'Berat' ? "bg-[#E65100]/10 border-[#E65100]" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#E65100] rounded-full shadow-sm"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Berat</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{countBerat}</span>
              </button>
            </div>
            
            <AnimatePresence>
              {filterCategory && (
                <motion.button 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  onClick={() => setFilterCategory(null)}
                  className="w-full text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase tracking-wider font-bold transition-colors"
                >
                  Tampilkan Semua
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 14px;
        }
        .dark .leaflet-popup-content-wrapper {
          background-color: #1e293b;
          color: #f8fafc;
        }
        .dark .leaflet-popup-tip {
          background-color: #1e293b;
        }
      `}</style>
    </motion.div>
  );
}
