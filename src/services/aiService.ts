import { readAiSettings } from "../utils/configHelper";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

let googleClient: GoogleGenAI | null = null;
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

let currentGoogleKey: string | null = null;
let currentOpenaiKey: string | null = null;
let currentAnthropicKey: string | null = null;

export async function getAI() {
  const aiSettings = await readAiSettings();
  const provider = aiSettings.provider || "google";

  if (provider === "google") {
    const apiKey = aiSettings.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set in settings or environment variable");
    if (!googleClient || currentGoogleKey !== apiKey) {
      googleClient = new GoogleGenAI({ apiKey: apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      currentGoogleKey = apiKey;
    }
    return { client: googleClient, aiSettings, provider };
  } else if (provider === "openai") {
    const apiKey = aiSettings.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set in settings");
    if (!openaiClient || currentOpenaiKey !== apiKey) {
      openaiClient = new OpenAI({ apiKey: apiKey });
      currentOpenaiKey = apiKey;
    }
    return { client: openaiClient, aiSettings, provider };
  } else if (provider === "anthropic") {
    const apiKey = aiSettings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in settings");
    if (!anthropicClient || currentAnthropicKey !== apiKey) {
      anthropicClient = new Anthropic({ apiKey: apiKey });
      currentAnthropicKey = apiKey;
    }
    return { client: anthropicClient, aiSettings, provider };
  } else if (provider === "ollama") {
    // Ollama just uses fetch, no persistent client needed
    return { client: null, aiSettings, provider };
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

async function runOllama(endpoint: string, model: string, system: string, user: string, imagesBase64?: string[], expectJson: boolean = false) {
  const body: any = {
    model: model || "llava",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    stream: false
  };
  
  if (expectJson) {
    body.format = "json";
  }

  if (imagesBase64 && imagesBase64.length > 0) {
    body.messages[1].images = imagesBase64;
  }

  const url = endpoint.endsWith('/') ? `${endpoint}api/chat` : `${endpoint}/api/chat`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Error: ${errText}`);
  }

  const data = await res.json();
  return data.message.content;
}

export async function analyzeDamageLogic(imageBase64: string, componentName: string) {
  const { client, aiSettings, provider } = await getAI();
  const mimeType = imageBase64.substring(5, imageBase64.indexOf(";"));
  const data = imageBase64.substring(imageBase64.indexOf(",") + 1);

  const prompt = (aiSettings.visionPrompt || `You are a civil engineering expert analyzing a building component for damage.\n\nPlease analyze the provided image of the component.\nDetermine the damage level classification based on these categories:\n- "Rusak Sangat Ringan"\n- "Rusak Ringan"\n- "Rusak Sedang"\n- "Rusak Berat"\n- "Rusak Sangat Berat"\n- "Tidak Rusak"\n\nAlso estimate the percentage of the volume/area of the component that is damaged (0 to 100).\nFinally, provide a brief reasoning for your assessment.`) + `\n\nComponent: ${componentName}`;
  const model = aiSettings.model || "gemini-3.5-flash";

  let responseText = "";

  if (provider === "google") {
    const response = await (client as GoogleGenAI).models.generateContent({
      model: model,
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
            level: { type: Type.STRING },
            percentage: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["level", "percentage", "reasoning"]
        }
      }
    });
    responseText = response.text?.trim() || "{}";
  } else if (provider === "openai") {
    const response = await (client as OpenAI).chat.completions.create({
      model: model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt + "\\n\\nRespond in JSON format with keys: level (string), percentage (number), reasoning (string)." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${data}` } }
          ]
        }
      ]
    });
    responseText = response.choices[0].message.content || "{}";
  } else if (provider === "anthropic") {
    const response = await (client as Anthropic).messages.create({
      model: model,
      max_tokens: 1024,
      system: "Respond ONLY with valid JSON containing keys: level (string), percentage (number), reasoning (string).",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", source: { type: "base64", media_type: mimeType as any, data: data } }
          ]
        }
      ]
    });
    responseText = (response.content[0] as any).text || "{}";
  } else if (provider === "ollama") {
    const endpoint = aiSettings.ollamaEndpoint || "http://localhost:11434";
    responseText = await runOllama(endpoint, model, "Respond ONLY with valid JSON.", prompt + "\\n\\nRespond in JSON format with keys: level (string), percentage (number), reasoning (string).", [data], true);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse JSON", responseText);
    return { level: "Error", percentage: 0, reasoning: "Gagal memproses respon AI (Non-JSON)" };
  }
}

export async function analyzeDocumentLogic(fileName: string, fileType: string, fileContent: string, imageBase64: string) {
  const { client, aiSettings, provider } = await getAI();
  const model = aiSettings.model || "gemini-3.5-flash";
  let responseText = "";
  
  if (fileType === 'image' && imageBase64) {
    const mimeType = imageBase64.substring(5, imageBase64.indexOf(";"));
    const data = imageBase64.substring(imageBase64.indexOf(",") + 1);

    const prompt = (aiSettings.documentPrompt || `You are an expert PUPR Cipta Karya building structural inspector and civil engineer.\nPlease perform a highly detailed AI Crack & Defect Analysis on the provided image of a building element: "${fileName}".\nAnalyze the image for building structure defects such as concrete cracks, water leakage stains, exposed reinforcement bar, column deformities, corrosion, or material wear.\nIf you find any crack or defect, describe it technically and estimate the damage criteria according to PUPR standards (Rusak Ringan, Rusak Sedang, Rusak Berat).\n\nReturn a JSON response matching the following schema:\n{\n  "summary": "Analisis visual teknis yang mendalam terhadap kondisi dan integritas komponen bangunan.",\n  "findings": [\n    {\n      "element": "Nama komponen spesifik (misal: Balok Beton Bertulang, Kolom Praktis, Rangka Baja Atap)",\n      "defect": "Tipe cacat teknis (misal: Retak Geser, Spalling, Korosi Tulangan Utama, Lendutan)",\n      "severity": "Rusak Ringan / Rusak Sedang / Rusak Berat (sesuai standar PUPR)",\n      "remediation": "Saran penanganan teknis spesifik (misal: Injeksi epoxy resin, Grouting non-shrink, FRP Retrofitting)",\n      "box": { "x": 10, "y": 20, "w": 30, "h": 40 }\n    }\n  ],\n  "recommendations": ["Rekomendasi metode perbaikan struktural", "Estimasi Kriteria Kerusakan: Rusak Ringan/Sedang/Berat", "Estimasi Persentase Kerusakan Komponen (contoh: Estimasi 30%)"],\n  "complianceStatus": "Sesuai Standar SNI / Perlu Audit Struktur / Tidak Laik Fungsi",\n  "confidenceScore": 85\n}`) + `\n\nFileName: ${fileName}`;

    if (provider === "google") {
      const response = await (client as GoogleGenAI).models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }, { inlineData: { data, mimeType } }] },
        config: { responseMimeType: "application/json" }
      });
      responseText = response.text?.trim() || "{}";
    } else if (provider === "openai") {
      const response = await (client as OpenAI).chat.completions.create({
        model: model,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${data}` } }] }]
      });
      responseText = response.choices[0].message.content || "{}";
    } else if (provider === "anthropic") {
      const response = await (client as Anthropic).messages.create({
        model: model,
        max_tokens: 1024,
        system: "Respond ONLY with valid JSON.",
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image", source: { type: "base64", media_type: mimeType as any, data: data } }] }]
      });
      responseText = (response.content[0] as any).text || "{}";
    } else if (provider === "ollama") {
      const endpoint = aiSettings.ollamaEndpoint || "http://localhost:11434";
      responseText = await runOllama(endpoint, model, "Respond ONLY with valid JSON.", prompt, [data], true);
    }
  } else {
    // Text based document analysis
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

    if (provider === "google") {
      const response = await (client as GoogleGenAI).models.generateContent({
        model: model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      responseText = response.text?.trim() || "{}";
    } else if (provider === "openai") {
      const response = await (client as OpenAI).chat.completions.create({
        model: model,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      });
      responseText = response.choices[0].message.content || "{}";
    } else if (provider === "anthropic") {
      const response = await (client as Anthropic).messages.create({
        model: model,
        max_tokens: 1500,
        system: "Respond ONLY with valid JSON.",
        messages: [{ role: "user", content: prompt }]
      });
      responseText = (response.content[0] as any).text || "{}";
    } else if (provider === "ollama") {
      const endpoint = aiSettings.ollamaEndpoint || "http://localhost:11434";
      responseText = await runOllama(endpoint, model, "Respond ONLY with valid JSON.", prompt, [], true);
    }
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse JSON", responseText);
    return { summary: "Error processing document", findings: [], recommendations: [], complianceStatus: "Error", confidenceScore: 0 };
  }
}

export async function analyzeIkmLogic(stats: any, responses: any[], questionsConfig: any[]) {
  const { client, aiSettings, provider } = await getAI();

  const prompt = `Anda adalah seorang Auditor Utama dan Analis Kebijakan Publik Senior dari instansi pemerintah.
Tugas Anda adalah menyusun dokumen "Analisis, Evaluasi, dan Rekomendasi Hasil Indeks Kepuasan Masyarakat (IKM)" berdasarkan data statistik berikut. Laporan ini akan ditujukan kepada Kepala Dinas.

Statistik:
- Total Responden: ${stats?.totalResponses || 0}
- Nilai Rata-rata IKM: ${stats?.averageIKM || 0} / 100
- Distribusi Mutu Pelayanan: ${JSON.stringify(stats?.distribution || {})}

Data Nilai per Unsur Pelayanan (Skala 1-4):
${Object.entries(stats?.averages || {}).map(([key, val]) => {
  const q = questionsConfig.find(q => q.key === key);
  return `- ${q ? q.label : key}: ${val}`;
}).join('\n')}

Testimoni/Keluhan Responden Terpilih:
${responses.slice(0, 8).map(r => `"${r.testimoni}"`).join('\n')}

Buatkan laporan komprehensif dengan struktur format kedinasan berikut (gunakan HANYA teks biasa dan huruf kapital untuk judul bagian, JANGAN gunakan simbol markdown seperti ** atau #):

A. PENDAHULUAN
(Tuliskan 1 paragraf pembuka yang formal mengenai hasil capaian IKM secara umum berdasarkan total responden dan nilai rata-rata)

B. ANALISIS DAN EVALUASI PER UNSUR
(Evaluasi secara spesifik unsur-unsur yang mendapatkan nilai tertinggi sebagai kekuatan, dan unsur-unsur dengan nilai terendah sebagai area kelemahan pelayanan. Jelaskan korelasi keluhan responden dengan unsur yang lemah tersebut)

C. KESIMPULAN DAN REKOMENDASI TINDAK LANJUT
(Tuliskan kesimpulan akhir dan berikan minimal 3 rekomendasi strategis dan taktis kepada pimpinan untuk perbaikan layanan di periode berikutnya)

Pastikan gaya bahasa sangat profesional, analitis, dan khas laporan pemerintahan resmi. Pisahkan antar bagian dengan baris kosong (enter).`;

  const model = aiSettings.model || "gemini-3.5-flash";
  let responseText = "";

  if (provider === "google") {
    const response = await (client as GoogleGenAI).models.generateContent({
      model: model,
      contents: prompt
    });
    responseText = response.text?.trim() || "";
  } else if (provider === "openai") {
    const response = await (client as OpenAI).chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }]
    });
    responseText = response.choices[0].message.content || "";
  } else if (provider === "anthropic") {
    const response = await (client as Anthropic).messages.create({
      model: model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });
    responseText = (response.content[0] as any).text || "";
  } else if (provider === "ollama") {
    const endpoint = aiSettings.ollamaEndpoint || "http://localhost:11434";
    responseText = await runOllama(endpoint, model, "Berikan hanya narasi formal tanpa tag markdown.", prompt, []);
  }

  return responseText;
}
