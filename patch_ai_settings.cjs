const fs = require('fs');

// 1. PATCH settingsTypes.ts
let typesFile = 'src/pages/settings/settingsTypes.ts';
let typesContent = fs.readFileSync(typesFile, 'utf8');

typesContent = typesContent.replace(
  /export interface AiConfig \{[\s\S]*?\}/,
  `export interface AiConfig {
  provider: 'google' | 'openai' | 'anthropic' | 'ollama';
  apiKey: string; // Used for Google or generic
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaEndpoint?: string;
  model: string;
  autoAnalyze: boolean;
  confidenceThreshold: number;
  visionPrompt: string;
  documentPrompt: string;
}`
);

fs.writeFileSync(typesFile, typesContent);


// 2. PATCH configHelper.ts
let confFile = 'src/utils/configHelper.ts';
let confContent = fs.readFileSync(confFile, 'utf8');

confContent = confContent.replace(
  /let defaultVal: any = \{/,
  `let defaultVal: any = {
      provider: "google",
      openaiApiKey: "",
      anthropicApiKey: "",
      ollamaEndpoint: "http://localhost:11434",`
);

fs.writeFileSync(confFile, confContent);


// 3. PATCH SettingsAiTab.tsx
let tabFile = 'src/pages/settings/SettingsAiTab.tsx';
let tabContent = fs.readFileSync(tabFile, 'utf8');

// Ensure state has the new fields
tabContent = tabContent.replace(
  /const \[aiConfig, setAiConfig\] = useState<AiConfig>\(\{/,
  `const [aiConfig, setAiConfig] = useState<AiConfig>({
    provider: "google",
    openaiApiKey: "",
    anthropicApiKey: "",
    ollamaEndpoint: "http://localhost:11434",`
);

// We need to rewrite the main config div. Let's find the relevant chunk.
// It starts from `<div>` with "API Key Gemini" and ends after the "Model Visual Default" div.
const oldMainConfigRegex = /<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1">API Key Gemini<\/label>[\s\S]*?<\/select>\s*<\/div>/;

const newMainConfig = `
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Provider AI</label>
            <select 
              value={aiConfig.provider || "google"}
              onChange={(e) => setAiConfig({...aiConfig, provider: e.target.value as any})}
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            >
              <option value="google">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="ollama">Ollama (Lokal)</option>
            </select>
          </div>

          {aiConfig.provider === 'google' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">API Key Gemini</label>
              <input 
                type="password" 
                value={aiConfig.apiKey}
                onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                placeholder="Biarkan kosong untuk menggunakan .env (Server)"
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">Kredensial dari Google AI Studio.</p>
            </div>
          )}

          {aiConfig.provider === 'openai' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">API Key OpenAI</label>
              <input 
                type="password" 
                value={aiConfig.openaiApiKey || ""}
                onChange={(e) => setAiConfig({...aiConfig, openaiApiKey: e.target.value})}
                placeholder="sk-..."
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          )}

          {aiConfig.provider === 'anthropic' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">API Key Anthropic</label>
              <input 
                type="password" 
                value={aiConfig.anthropicApiKey || ""}
                onChange={(e) => setAiConfig({...aiConfig, anthropicApiKey: e.target.value})}
                placeholder="sk-ant-..."
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          )}

          {aiConfig.provider === 'ollama' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ollama Endpoint URL</label>
              <input 
                type="text" 
                value={aiConfig.ollamaEndpoint || "http://localhost:11434"}
                onChange={(e) => setAiConfig({...aiConfig, ollamaEndpoint: e.target.value})}
                placeholder="http://localhost:11434"
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Model AI Utama</label>
            {aiConfig.provider === 'google' ? (
              <select 
                value={aiConfig.model}
                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Sangat Cepat)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Akurat & Detail)</option>
              </select>
            ) : aiConfig.provider === 'openai' ? (
              <select 
                value={aiConfig.model}
                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              >
                <option value="gpt-4o">GPT-4o (Visual & Teks)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Cepat)</option>
              </select>
            ) : aiConfig.provider === 'anthropic' ? (
              <select 
                value={aiConfig.model}
                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              >
                <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              </select>
            ) : (
              <input 
                type="text" 
                value={aiConfig.model}
                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                placeholder="Ketik nama model (contoh: llava, llama3)"
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all outline-none"
              />
            )}
          </div>
`;

tabContent = tabContent.replace(oldMainConfigRegex, newMainConfig.trim());

fs.writeFileSync(tabFile, tabContent);

console.log("Patched config and types for AI settings");
