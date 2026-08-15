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

async function testQwen() {
  console.log("Testing Groq model: qwen/qwen3.6-27b ...");
  const response = await groq.chat.completions.create({
    model: "qwen/qwen3.6-27b",
    messages: [
      {
        role: "system",
        content: "You are a nursing curriculum engine helper. Respond in JSON format.",
      },
      {
        role: "user",
        content: "Extract 1 module and 1 topic for 'Basic Nursing Care'.",
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "emit_curriculum_module",
          description: "Report the structured module.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              inferred: { type: "boolean" },
            },
            required: ["title", "description", "inferred"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "emit_curriculum_module" } },
  });

  console.log("Tool call response:", JSON.stringify(response.choices[0]?.message?.tool_calls));
}

testQwen().catch(console.error);
