import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
  }
  return aiClient;
}

export async function analyzeDamageLogic(imageBase64: string, componentName: string) {
  const ai = getAI();
  const mimeType = imageBase64.substring(5, imageBase64.indexOf(";"));
  const data = imageBase64.substring(imageBase64.indexOf(",") + 1);

  const prompt = `You are a civil engineering expert analyzing a building component for damage.
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
Finally, provide a brief reasoning for your assessment.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
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
  const ai = getAI();
  let response;

  if (fileType === 'image' && imageBase64) {
    const mimeType = imageBase64.substring(5, imageBase64.indexOf(";"));
    const data = imageBase64.substring(imageBase64.indexOf(",") + 1);

    const prompt = `You are a PUPR Cipta Karya building structural inspector. 
Please perform an AI Crack & Defect Analysis on the provided image of a building element: "${fileName}".
Analyze the image for building structure defects such as concrete cracks, water leakage stains, exposed reinforcement bar, column deformities, or material wear.
If you find any crack or defect, describe it.

Return a JSON response matching the following schema:
{
  "summary": "Analisis visual terhadap komponen bangunan.",
  "findings": [
    {
      "element": "Nama komponen (misal: Balok, Kolom, Atap)",
      "defect": "Tipe cacat (misal: Retak Rambut, Korosi Baja Tulangan, Kebocoran Plafon)",
      "severity": "Rendah / Sedang / Tinggi",
      "remediation": "Saran penanganan teknis",
      "box": { "x": 10, "y": 20, "w": 30, "h": 40 }
    }
  ],
  "recommendations": ["Rekomendasi teknis 1", "Rekomendasi teknis 2"],
  "complianceStatus": "Sesuai regulasi / Perlu perbaikan segera",
  "confidenceScore": 85
}`;

    response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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

Please analyze this file's administrative/technical content and assess whether there are any compliance discrepancies, missing information, or incorrect structural calculations. Keep your output in formal Indonesian suitable for a PUPR Dinas report.

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

    response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
