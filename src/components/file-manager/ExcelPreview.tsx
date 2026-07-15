import React from "react";
import { cn } from "../../lib/utils";

interface ExcelPreviewProps {
  selectedFile: any;
  selectedSheet: number;
  setSelectedSheet: (val: number) => void;
  handleExcelCellChange: (sheetIdx: number, rowIdx: number, colIdx: number, val: string) => void;
}

export default function ExcelPreview({
  selectedFile,
  selectedSheet,
  setSelectedSheet,
  handleExcelCellChange
}: ExcelPreviewProps) {
  return (
    <div className="w-full h-full flex flex-col bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-md">
      {/* Excel Header - Sheets Tab */}
      <div className="flex bg-emerald-50 border-b border-emerald-200">
        {selectedFile.excelData?.sheets.map((sheet: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setSelectedSheet(idx)}
            className={cn(
              "px-4 py-2 text-xs font-bold transition-all border-b-2",
              selectedSheet === idx 
                ? "bg-white text-emerald-700 border-emerald-500" 
                : "text-slate-500 border-transparent hover:bg-emerald-100/50"
            )}
          >
            {sheet.name}
          </button>
        ))}
      </div>
      
      {/* Excel Body - Grid */}
      <div className="flex-1 overflow-auto bg-slate-50 p-2 custom-scrollbar">
        {selectedFile.excelData && (
          <div className="bg-white border border-slate-200 shadow-xs inline-block min-w-full">
            <table className="w-full text-left border-collapse select-text">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-1.5 border-r border-slate-200 text-center w-8 bg-slate-200/60"></th>
                  {["A", "B", "C", "D", "E", "F"].map((col) => (
                    <th key={col} className="p-1.5 border-r border-slate-200 text-center font-mono text-[10px]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedFile.excelData.sheets[selectedSheet].rows.map((row: any, rIdx: number) => {
                  const isHeader = rIdx === 0;
                  const isTotalRow = rIdx === selectedFile.excelData!.sheets[selectedSheet].rows.length - 1;
                  return (
                    <tr 
                      key={rIdx} 
                      className={cn(
                        "border-b border-slate-100 hover:bg-slate-50/50",
                        isHeader ? "bg-slate-50/70 font-semibold" : "",
                        isTotalRow ? "bg-amber-50/40 font-bold border-t-2 border-slate-300" : ""
                      )}
                    >
                      <td className="p-1.5 border-r border-slate-200 text-center bg-slate-100/50 text-[10px] font-mono text-slate-400 select-none">
                        {rIdx + 1}
                      </td>
                      {row.map((cell: any, cIdx: number) => {
                        const isEditable = !isHeader && cIdx > 0 && !isTotalRow;
                        return (
                          <td 
                            key={cIdx} 
                            className={cn(
                              "p-1.5 border-r border-slate-200 max-w-[150px] truncate",
                              cIdx === 4 || cIdx === 5 ? "text-right font-mono text-[11px]" : "",
                              isTotalRow && cIdx === 5 ? "text-emerald-700 font-bold" : ""
                            )}
                          >
                            {isEditable ? (
                              <input 
                                type="text" 
                                value={cell} 
                                onChange={(e) => handleExcelCellChange(selectedSheet, rIdx, cIdx, e.target.value)}
                                className="w-full bg-transparent border-0 focus:bg-amber-50/60 focus:ring-1 focus:ring-emerald-500 p-0 text-slate-800 text-xs focus:outline-none"
                              />
                            ) : (
                              cIdx === 4 || cIdx === 5 ? (
                                cell ? "Rp " + parseFloat(cell).toLocaleString('id-ID') : "--"
                              ) : cell
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
