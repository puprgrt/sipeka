import { getAccessToken } from './firebaseAuth';
import { makeFilePublic } from './driveService';

export const OFFICIAL_PUPR_SHEET_TEMPLATES = {
  TIPE_A: '1pe2d-T7KzkGqIrXq6bUYoevYI3alXxosT5RBTljvIiE', // 1 Lantai
  TIPE_B: '1sTjY-dIEJI7cDezMpVnb25mcbyHcNrRBe7AFZarz7IA', // 2 Lantai
  TIPE_C: '1bza5jDXLNYtOTyjEsju8e4cv0rZTskBjxsqewIh4dhk', // 3 Lantai / Lebih
};

const DAMAGE_MULTIPLIERS: Record<string, number> = {
  "Tidak Rusak": 0,
  "Rusak Sangat Ringan": 0.1,
  "Rusak Ringan": 0.3,
  "Rusak Sedang": 0.5,
  "Rusak Berat": 0.8,
  "Rusak Sangat Berat": 1.0,
  "Komponen Tidak Sesuai": 1.0
};

export async function copySpreadsheetTemplate(templateId: string, newTitle: string, accessTokenOverride?: string | null): Promise<string | null> {
  const token = accessTokenOverride ?? await getAccessToken();
  if (!token || token === 'mock' || token === 'test' || token.length < 20) {
    return null;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newTitle
      })
    });

    if (!res.ok) {
      console.warn(`[TemplateEngine] Failed to copy official Google Sheet template (${res.status}). Falling back to full spreadsheet generation.`);
      return null;
    }

    const data = await res.json();
    if (data && data.id) {
      await makeFilePublic(data.id).catch(console.warn);
      return data.id;
    }
    return null;
  } catch (err) {
    console.warn("[TemplateEngine] Error copying spreadsheet template:", err);
    return null;
  }
}

export async function populatePuprSpreadsheetData(
  spreadsheetId: string,
  assessment: any,
  floorCount: number,
  accessTokenOverride?: string | null
): Promise<boolean> {
  const token = accessTokenOverride ?? await getAccessToken();
  if (!token || token === 'mock' || token === 'test' || token.length < 20) {
    return false;
  }

  try {
    const weights: Record<string, number> = floorCount === 1 ? {
      "Pondasi": 12, "Kolom": 10, "Balok": 8, "Pelat Lantai": 0, "Atap": 10,
      "Dinding / Partisi": 10, "Plafond": 8, "Lantai": 10, "Kusen": 4, "Pintu": 4,
      "Jendela": 4, "Finishing Plafond": 4, "Finishing Dinding": 8,
      "Finishing Kusen & Pintu": 4, "Instalasi Listrik": 2,
      "Instalasi Air Bersih": 1, "Drainase Limbah": 1
    } : floorCount === 2 ? {
      "Pondasi": 10, "Kolom": 12, "Balok": 10, "Pelat Lantai": 8, "Atap": 8,
      "Dinding / Partisi": 8, "Plafond": 6, "Lantai": 8, "Kusen": 3, "Pintu": 3,
      "Jendela": 3, "Finishing Plafond": 4, "Finishing Dinding": 8,
      "Finishing Kusen & Pintu": 4, "Instalasi Listrik": 3,
      "Instalasi Air Bersih": 1, "Drainase Limbah": 1
    } : {
      "Pondasi": 10, "Kolom": 14, "Balok": 10, "Pelat Lantai": 10, "Atap": 6,
      "Dinding / Partisi": 8, "Plafond": 6, "Lantai": 8, "Kusen": 3, "Pintu": 3,
      "Jendela": 3, "Finishing Plafond": 4, "Finishing Dinding": 6,
      "Finishing Kusen & Pintu": 4, "Instalasi Listrik": 3,
      "Instalasi Air Bersih": 1, "Drainase Limbah": 1
    };

    const valueRangeData = [
      {
        range: "Sheet1!C3:C10",
        values: [
          [assessment.schoolName || "-"],
          [assessment.npsn || "-"],
          [assessment.buildingName || "-"],
          [assessment.nup || "-"],
          [assessment.address || "-"],
          ["Garut"],
          [`${assessment.buildingArea || 0} m²`],
          [`${floorCount} Lantai (Tipe ${floorCount === 1 ? 'A' : floorCount === 2 ? 'B' : 'C'})`]
        ]
      }
    ];

    let rowIdx = 14;
    Object.keys(weights).forEach(name => {
      const weight = weights[name];
      const compData = assessment.components?.find((c: any) => c.name === name);

      const getDetailPct = (lvl: string) => {
        if (!compData) return 0;
        const detail = compData.damageDetails?.find((d: any) => d.level === lvl);
        return detail ? (detail.percentage || 0) : 0;
      };

      const sangatRingan = getDetailPct("Rusak Sangat Ringan");
      const ringan = getDetailPct("Rusak Ringan");
      const sedang = getDetailPct("Rusak Sedang");
      const berat = getDetailPct("Rusak Berat");
      const sangatBerat = getDetailPct("Rusak Sangat Berat");
      const tdkSesuai = getDetailPct("Komponen Tidak Sesuai");

      let componentDamageFraction = 0;
      compData?.damageDetails?.forEach((detail: any) => {
        const multiplier = DAMAGE_MULTIPLIERS[detail.level] || 0;
        const volumeFraction = (detail.percentage || 0) / 100;
        componentDamageFraction += volumeFraction * multiplier;
      });
      componentDamageFraction = Math.min(componentDamageFraction, 1.0);
      const totalCompDamagePct = componentDamageFraction * 100;
      const tdkRusak = Math.max(0, 100 - totalCompDamagePct);
      const nilaiKerusakanThdMassa = componentDamageFraction * weight;

      valueRangeData.push({
        range: `Sheet1!E${rowIdx}:N${rowIdx}`,
        values: [
          [
            tdkRusak.toFixed(2),
            sangatRingan.toFixed(2),
            ringan.toFixed(2),
            sedang.toFixed(2),
            berat.toFixed(2),
            sangatBerat.toFixed(2),
            tdkSesuai.toFixed(2),
            totalCompDamagePct.toFixed(2),
            weight.toFixed(2),
            nilaiKerusakanThdMassa.toFixed(2)
          ]
        ]
      });

      rowIdx++;
    });

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRangeData
      })
    });

    return res.ok;
  } catch (err) {
    console.warn("[TemplateEngine] Error populating spreadsheet data:", err);
    return false;
  }
}

export async function generatePuprSpreadsheetFromTemplate(
  assessment: any,
  floorCount: number,
  accessTokenOverride?: string | null
): Promise<{ url: string; spreadsheetId: string; templateUsed: string; copiedFromDrive: boolean }> {
  const templateId = floorCount === 1 
    ? OFFICIAL_PUPR_SHEET_TEMPLATES.TIPE_A 
    : floorCount === 2 
    ? OFFICIAL_PUPR_SHEET_TEMPLATES.TIPE_B 
    : OFFICIAL_PUPR_SHEET_TEMPLATES.TIPE_C;

  const title = `Format Analisis PUPR (Tipe ${floorCount === 1 ? 'A' : floorCount === 2 ? 'B' : 'C'}) - ${assessment.schoolName} - ${assessment.buildingName}`;
  const copiedSheetId = await copySpreadsheetTemplate(templateId, title, accessTokenOverride);

  if (copiedSheetId) {
    await populatePuprSpreadsheetData(copiedSheetId, assessment, floorCount, accessTokenOverride);
    return {
      url: `https://docs.google.com/spreadsheets/d/${copiedSheetId}/edit`,
      spreadsheetId: copiedSheetId,
      templateUsed: `Tipe ${floorCount === 1 ? 'A' : floorCount === 2 ? 'B' : 'C'} (${templateId})`,
      copiedFromDrive: true
    };
  }

  // Fallback if copy fails or offline
  const fallbackId = `local_pupr_${Date.now()}`;
  return {
    url: `https://docs.google.com/spreadsheets/d/${templateId}/edit?gid=756257354#gid=756257354`,
    spreadsheetId: fallbackId,
    templateUsed: `Tipe ${floorCount === 1 ? 'A' : floorCount === 2 ? 'B' : 'C'} (Official Reference)`,
    copiedFromDrive: false
  };
}
