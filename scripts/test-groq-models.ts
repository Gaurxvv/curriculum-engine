import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) process.env[match[1]] = match[2].trim();
  });
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function checkModels() {
  console.log("Listing available models from Groq API...");
  try {
    const list = await groq.models.list();
    const qwenModels = list.data.filter((m) => m.id.toLowerCase().includes("qwen") || m.id.toLowerCase().includes("llama"));
    console.log("Found models on Groq:");
    list.data.forEach((m) => console.log(" -", m.id));
  } catch (err: any) {
    console.error("Failed to list models:", err.message);
  }
}

checkModels().catch(console.error);
