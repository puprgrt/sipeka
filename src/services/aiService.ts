import { readAiSettings } from "../utils/configHelper";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

export async function getAI() {
  const aiSettings = await readAiSettings();
  const apiKey = aiSettings?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in settings or environment variable");
  }
  
  if (!aiClient || currentApiKey !== apiKey) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
    currentApiKey = apiKey;
  }
  return { aiClient, aiSettings };
}

export async function analyzeDamageLogic(imageBase64: string, componentName: string) {
  const { aiClient, aiSettings } = await getAI();
  const mimeType = imageBase64.substring(5, imageBase64.indexOf(";"));
  const data = imageBase64.substring(imageBase64.indexOf(",") + 1);

  const prompt = (aiSettings.visionPrompt || `You are a civil engineering expert analyzing a building component for damage.
Component: ${componentName}

Please analyze the provided image of the component.
Determine the damage level classification based on these categories:
- "Rusak Sangat Ringan"
- "Rusak Ringan"
- "Rusak Sedang"
- "Rusak Berat"
- "Rusak Sangat Berat"
- "Tidak Rusak"

Also estimate the percentage of the volume/area of the component that is damaged (0 to 100).
Finally, provide a brief reasoning for your assessment.`) + `

Component: ${componentName}`;

  const response = await aiClient.models.generateContent({
    model: aiSettings.model || "gemini-3.1-pro-preview",
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data, mimeType } }
      ]
    },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, description: "The damage level classification." },
          percentage: { type: Type.NUMBER, description: "The estimated percentage of damage (0-100)." },
          reasoning: { type: Type.STRING, description: "Brief reasoning for the assessment." }
        },
        required: ["level", "percentage", "reasoning"]
      }
    }
  });

  return JSON.parse(response.text?.trim() || "{}");
}

export async function analyzeDocumentLogic(fileName: string, fileType: string, fileContent: string, imageBase64: string) {
  const { aiClient, aiSettings } = await getAI();
  let response;

  if (fileType === 'image' && imageBase64) {
    const mimeType = imageBase64.substring(5, imageBase64.indexOf(";"));
    const data = imageBase64.substring(imageBase64.indexOf(",") + 1);

    const prompt = (aiSettings.documentPrompt || `You are an expert PUPR Cipta Karya building structural inspector and civil engineer.
Please perform a highly detailed AI Crack & Defect Analysis on the provided image of a building element: "${fileName}".
Analyze the image for building structure defects such as concrete cracks, water leakage stains, exposed reinforcement bar, column deformities, corrosion, or material wear.
If you find any crack or defect, describe it technically and estimate the damage criteria according to PUPR standards (Rusak Ringan, Rusak Sedang, Rusak Berat).

Return a JSON response matching the following schema:
{
  "summary": "Analisis visual teknis yang mendalam terhadap kondisi dan integritas komponen bangunan.",
  "findings": [
    {
      "element": "Nama komponen spesifik (misal: Balok Beton Bertulang, Kolom Praktis, Rangka Baja Atap)",
      "defect": "Tipe cacat teknis (misal: Retak Geser, Spalling, Korosi Tulangan Utama, Lendutan)",
      "severity": "Rusak Ringan / Rusak Sedang / Rusak Berat (sesuai standar PUPR)",
      "remediation": "Saran penanganan teknis spesifik (misal: Injeksi epoxy resin, Grouting non-shrink, FRP Retrofitting)",
      "box": { "x": 10, "y": 20, "w": 30, "h": 40 }
    }
  ],
  "recommendations": ["Rekomendasi metode perbaikan struktural", "Estimasi Kriteria Kerusakan: Rusak Ringan/Sedang/Berat", "Estimasi Persentase Kerusakan Komponen (contoh: Estimasi 30%)"],
  "complianceStatus": "Sesuai Standar SNI / Perlu Audit Struktur / Tidak Laik Fungsi",
  "confidenceScore": 85
}`) + `

FileName: ${fileName}`;

    response = await aiClient.models.generateContent({
      model: aiSettings.model || "gemini-3.5-flash",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  element: { type: Type.STRING },
                  defect: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  remediation: { type: Type.STRING },
                  box: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      w: { type: Type.NUMBER },
                      h: { type: Type.NUMBER }
                    },
                    required: ["x", "y", "w", "h"]
                  }
                },
                required: ["element", "defect", "severity", "remediation", "box"]
              }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            complianceStatus: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER }
          },
          required: ["summary", "findings", "recommendations", "complianceStatus", "confidenceScore"]
        }
      }
    });
  } else {
    const prompt = `You are an expert civil engineer and PUPR Cipta Karya auditor inspecting building documents.
FileName: "${fileName}"
FileType: "${fileType}"
FileContent:
${fileContent || "No direct text content provided."}

Please analyze this file\'s administrative/technical content and assess whether there are any compliance discrepancies, missing information, or incorrect structural calculations. Keep your output in formal Indonesian suitable for a PUPR Dinas report.

Return a JSON response matching the following schema:
{
  "summary": "Ringkasan analisis dokumen secara mendalam.",
  "findings": [
    {
      "element": "Bagian dokumen atau item tabel yang disorot",
      "defect": "Masalah/Temuan kelaikan gedung",
      "severity": "Rendah / Sedang / Tinggi",
      "remediation": "Rekomendasi tindakan korektif"
    }
  ],
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2"],
  "complianceStatus": "Laik Fungsi dengan Catatan / Tidak Laik Fungsi / Memenuhi Standar",
  "confidenceScore": 90
}`;

    response = await aiClient.models.generateContent({
      model: aiSettings.model || "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  element: { type: Type.STRING },
                  defect: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  remediation: { type: Type.STRING }
                },
                required: ["element", "defect", "severity", "remediation"]
              }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            complianceStatus: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER }
          },
          required: ["summary", "findings", "recommendations", "complianceStatus", "confidenceScore"]
        }
      }
    });
  }

  return JSON.parse(response.text?.trim() || "{}");
}
