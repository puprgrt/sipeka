import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Save, X, Info } from "lucide-react";
import type { ComponentConfig } from './settingsTypes';

// Sortable row for component table (tab Komponen)
export function SortableRow({ comp, editingId, editForm, setEditForm, handleSave, setIsAdding, setEditingId, handleInfoEdit, handleEdit, handleDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: comp.idKomponen });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className={"transition-colors " + (isDragging ? "bg-white shadow-xl opacity-80" : "hover:bg-white/40")}>
      <td className="px-2 py-3">
        <button className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      {editingId === comp.idKomponen ? (
        <>
          <td className="px-4 py-3">
            <select 
              value={editForm.kategoriKomponen || 'Struktur'} 
              onChange={(e) => setEditForm({...editForm, kategoriKomponen: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70"
            >
              <option value="Struktur">Struktur</option>
              <option value="Arsitektur">Arsitektur</option>
              <option value="Utilitas">Utilitas</option>
            </select>
          </td>
          <td className="px-4 py-3">
            <input 
              type="text" 
              value={editForm.namaKomponen || ''} 
              onChange={(e) => setEditForm({...editForm, namaKomponen: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="text" 
              value={editForm.satuan || ''} 
              onChange={(e) => setEditForm({...editForm, satuan: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-16"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="number" 
              step="0.01"
              value={editForm.bobotFormA || ''} 
              onChange={(e) => setEditForm({...editForm, bobotFormA: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="number"
              step="0.01"
              value={editForm.bobotFormB || ''} 
              onChange={(e) => setEditForm({...editForm, bobotFormB: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
            />
          </td>
          <td className="px-4 py-3">
            <input 
              type="number"
              step="0.01"
              value={editForm.bobotFormC || ''} 
              onChange={(e) => setEditForm({...editForm, bobotFormC: e.target.value})}
              className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20"
            />
          </td>
          <td className="px-4 py-3 text-right">
            <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1.5 rounded mr-1"><Save className="h-4 w-4" /></button>
            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded"><X className="h-4 w-4" /></button>
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">
            {comp.kategoriKomponen}
          </td>
          <td className="px-6 py-4 font-medium text-slate-800">
            {comp.namaKomponen}
          </td>
          <td className="px-6 py-4 text-xs text-slate-600 font-mono">
            {comp.satuan}
          </td>
          <td className="px-6 py-4 text-xs font-mono text-slate-600">
            {comp.bobotFormA}%
          </td>
          <td className="px-6 py-4 text-xs font-mono text-slate-600">
            {comp.bobotFormB}%
          </td>
          <td className="px-6 py-4 text-xs font-mono text-slate-600">
            {comp.bobotFormC}%
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end">
            <button onClick={() => handleInfoEdit(comp)} title="Atur Panduan Cara Menghitung Volume" className="text-slate-400 hover:text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors mr-1">
              <Info className="h-4 w-4" />
            </button>
            <button onClick={() => handleEdit(comp)} title="Edit Komponen" className="text-slate-400 hover:text-pu-blue hover:bg-blue-50 p-1.5 rounded transition-colors mr-1">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(comp.idKomponen)} title="Hapus" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </td>
        </>
      )}
    </tr>
  );
}


// Sortable row for building params table (tab Formulir)
export function SortableBuildingParamRow({ p, handleEditParam, handleDeleteParam }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className={"transition-colors " + (isDragging ? "bg-white shadow-xl opacity-80" : "hover:bg-white/40")}>
      <td className="px-2 py-4 w-8">
        <button className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{p.id}</td>
      <td className="px-6 py-4 font-bold text-slate-800">{p.label}</td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          {p.type}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-medium text-slate-500 italic">{p.placeholder || "-"}</td>
      <td className="px-6 py-4 text-center">
        <span className={p.required ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200"}>
          {p.required ? "WAJIB" : "OPSIONAL"}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={p.enabled ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200"}>
          {p.enabled ? "AKTIF" : "NONAKTIF"}
        </span>
      </td>
      <td className="px-6 py-4 text-right flex justify-end">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleEditParam(p)} className="p-1.5 hover:bg-blue-50 hover:text-pu-blue rounded-md transition-all text-slate-500" title="Edit Parameter">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDeleteParam(p.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all text-slate-500" title="Hapus Parameter">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}


// Sortable row for profile params table (tab Param Profil)
export function SortableProfileParamRow({ p, handleEditProfileParam, handleDeleteProfileParam }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className={"transition-colors " + (isDragging ? "bg-white shadow-xl opacity-80" : "hover:bg-white/40")}>
      <td className="px-2 py-4 w-8">
        <button className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{p.id}</td>
      <td className="px-6 py-4 font-bold text-slate-800">{p.label}</td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          {p.type}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-medium text-slate-500 italic">{p.placeholder || "-"}</td>
      <td className="px-6 py-4 text-center">
        <span className={p.required ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200"}>
          {p.required ? "WAJIB" : "OPSIONAL"}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={p.enabled ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200"}>
          {p.enabled ? "AKTIF" : "NONAKTIF"}
        </span>
      </td>
      <td className="px-6 py-4 text-right flex justify-end">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleEditProfileParam(p)} className="p-1.5 hover:bg-blue-50 hover:text-pu-blue rounded-md transition-all text-slate-500" title="Edit Parameter Profil">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDeleteProfileParam(p.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all text-slate-500" title="Hapus Parameter Profil">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
