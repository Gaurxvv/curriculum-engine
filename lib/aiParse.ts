import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import { CurriculumNode, emptyNode } from "./types";
import { ParseEvent } from "./parseEvents";

// Provider defaults:
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENROUTER_MODEL = "qwen/qwen-2.5-72b-instruct";
const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";

type ProviderType = "groq" | "openrouter" | "anthropic";

function getProvider(): { provider: ProviderType; apiKey: string; model: string; baseURL?: string } {
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouterKey) {
    return {
      provider: "openrouter",
      apiKey: openrouterKey,
      model:
        process.env.OPENROUTER_MODEL?.trim() ||
        process.env.LLM_MODEL?.trim() ||
        DEFAULT_OPENROUTER_MODEL,
      baseURL: process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",
    };
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL?.trim() || process.env.LLM_MODEL?.trim() || DEFAULT_GROQ_MODEL,
    };
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    return {
      provider: "anthropic",
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
    };
  }

  throw new Error(
    "No LLM API key configured. Please set GROQ_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY in your .env.local file."
  );
}

// ---------------------------------------------------------------------------
// Schemas & Types
// ---------------------------------------------------------------------------

interface Pass1DiscoveredModule {
  title: string;
  description: string;
  inferred?: boolean;
  sectionHeading?: string;
  keyTopicsSummary?: string;
}

interface Pass1DiscoveryResult {
  programTitle?: string;
  programDescription?: string;
  unstructured?: boolean;
  modules: Pass1DiscoveredModule[];
}

interface Pass2RawLesson {
  title: string;
  description: string;
  inferred?: boolean;
}

interface Pass2RawTopic {
  title: string;
  description: string;
  inferred?: boolean;
  lessons: Pass2RawLesson[];
}

interface Pass2ModuleResult {
  topics: Pass2RawTopic[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Robust JSON parser that handles markdown codeblocks and embedded JSON objects */
function parseJsonFromOutput(text: string): any {
  if (!text || !text.trim()) return null;

  try {
    return JSON.parse(text.trim());
  } catch {}

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  return null;
}

/** Automatic retry helper with exponential backoff on rate limits (429/413) */
async function withRetry<T>(fn: (attempt: number) => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err: any) {
      attempt++;
      const isRateLimit =
        err?.status === 429 ||
        err?.status === 413 ||
        String(err?.message || "").includes("rate_limit") ||
        String(err?.message || "").includes("TPM") ||
        String(err?.message || "").includes("too large");

      if (attempt <= retries && isRateLimit) {
        console.warn(`[AI Pipeline] Rate limit hit. Backing off for ${delayMs}ms (Attempt ${attempt}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 1.8;
      } else {
        throw err;
      }
    }
  }
}

/** Extract a targeted text slice for a specific module from the complete document */
function getModuleTextSlice(fullText: string, mod: Pass1DiscoveredModule, nextMod?: Pass1DiscoveredModule): string {
  if (!fullText) return "";

  const cleanTitle = (mod.sectionHeading || mod.title || "")
    .replace(/^(modul\s*\d*|unit\s*\d*|\d+[\.\)]?)\s*[:\-–]?\s*/i, "")
    .trim()
    .slice(0, 30);

  if (cleanTitle.length > 3) {
    const idx = fullText.toLowerCase().indexOf(cleanTitle.toLowerCase());
    if (idx !== -1) {
      let endIdx = fullText.length;
      if (nextMod) {
        const nextClean = (nextMod.sectionHeading || nextMod.title || "")
          .replace(/^(modul\s*\d*|unit\s*\d*|\d+[\.\)]?)\s*[:\-–]?\s*/i, "")
          .trim()
          .slice(0, 30);
        if (nextClean.length > 3) {
          const nextPos = fullText.toLowerCase().indexOf(nextClean.toLowerCase(), idx + cleanTitle.length);
          if (nextPos !== -1) {
            endIdx = nextPos;
          }
        }
      }
      const slice = fullText.slice(idx, Math.min(idx + 10_000, endIdx)).trim();
      if (slice.length > 100) return slice;
    }
  }

  // Fallback: Use summary or front of text
  if (mod.keyTopicsSummary) {
    return `Module Focus & Topics: ${mod.keyTopicsSummary}\nDescription: ${mod.description}`;
  }
  return fullText.slice(0, 6_000);
}

// ---------------------------------------------------------------------------
// Prompts & Tool Schemas
// ---------------------------------------------------------------------------

const PASS1_SYSTEM_PROMPT = `You are an expert curriculum architect.
Your task is PASS 1 (Discovery): Analyze the document and discover the high-level curriculum outline:
1. Program Title & 1-2 sentence Program Description.
2. The complete list of distinct training Modules (titles + brief description of competencies).
3. EXCLUDE EDITORIAL SECTIONS: Ignore forewords ('Vorwort'), publication details ('Impressum'), bibliographies, table of contents repetitions.
4. NO DUPLICATE MODULES: Each training unit must appear only once.
5. If the document is unstructured or lacks explicit module titles, synthesize 1-4 sensible module titles from the content and set "unstructured": true.

Respond strictly in valid JSON matching this schema:
{
  "programTitle": "Overall program name",
  "programDescription": "1-2 sentence overview",
  "unstructured": false,
  "modules": [
    {
      "title": "Specific Module Title",
      "description": "1-2 sentence overview",
      "inferred": false,
      "sectionHeading": "Exact heading in text if found",
      "keyTopicsSummary": "Brief summary of topics mentioned"
    }
  ]
}`;

const PASS1_TOOL_SCHEMA = {
  type: "object",
  properties: {
    programTitle: { type: "string" },
    programDescription: { type: "string" },
    unstructured: { type: "boolean" },
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          inferred: { type: "boolean" },
          sectionHeading: { type: "string" },
          keyTopicsSummary: { type: "string" },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["modules"],
};

const PASS2_SYSTEM_PROMPT = `You are an expert curriculum architect.
Your task is PASS 2 (Module Detail Extraction & Inference):
Given a specific Module and its related document text, extract or infer the structured Topics and Lessons for that module.

RULES:
1. Hierarchy: Module -> Topic -> Lesson.
2. Each Topic must contain 1 or more specific Lessons.
3. INFERENCE: If the text lacks explicit topics or lessons, infer sensible domain-specific topics and lessons from the clinical context and set "inferred": true.
4. TITLES: Specific, meaningful titles (never "Topic 1" or "Lesson 1" without domain content).

Respond strictly in valid JSON matching this schema:
{
  "topics": [
    {
      "title": "Specific Topic Title",
      "description": "1 sentence description",
      "inferred": false,
      "lessons": [
        {
          "title": "Specific Lesson Title",
          "description": "1 sentence description",
          "inferred": false
        }
      ]
    }
  ]
}`;

const PASS2_TOOL_SCHEMA = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          inferred: { type: "boolean" },
          lessons: {
            type: "array",
            items: {
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
        required: ["title", "description", "inferred", "lessons"],
      },
    },
  },
  required: ["topics"],
};

// ---------------------------------------------------------------------------
// Pass 1: Discovery (Map)
// ---------------------------------------------------------------------------

async function discoverCurriculumBoundaries(fullText: string): Promise<Pass1DiscoveryResult> {
  const { provider, apiKey, model, baseURL } = getProvider();
  const cap = provider === "groq" ? 30_000 : 150_000;
  const documentSample = fullText.slice(0, cap);

  let rawResult: Pass1DiscoveryResult | null = null;

  await withRetry(async () => {
    if (provider === "groq" || provider === "openrouter") {
      const client = new Groq({ apiKey, baseURL });
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: PASS1_SYSTEM_PROMPT },
          { role: "user", content: `Document text for boundary discovery:\n${documentSample}` },
        ],
      });
      const content = completion.choices[0]?.message?.content || "";
      rawResult = parseJsonFromOutput(content);
    } else {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: PASS1_SYSTEM_PROMPT,
        tools: [
          {
            name: "emit_discovered_curriculum",
            description: "Emit discovered program title and module boundaries.",
            input_schema: PASS1_TOOL_SCHEMA as any,
          },
        ],
        tool_choice: { type: "tool", name: "emit_discovered_curriculum" },
        messages: [{ role: "user", content: `Document text:\n${documentSample}` }],
      });

      const toolUse = response.content.find((b) => b.type === "tool_use");
      if (toolUse && "input" in toolUse) {
        rawResult = toolUse.input as Pass1DiscoveryResult;
      }
    }
  });

  const result = rawResult as Pass1DiscoveryResult | null;
  if (!result || !Array.isArray(result.modules) || result.modules.length === 0) {
    return {
      unstructured: true,
      programTitle: "Curriculum Program",
      programDescription: "Extracted training structure.",
      modules: [
        {
          title: "Core Training & Competencies",
          description: "Foundational concepts and practical applications.",
          inferred: true,
        },
      ],
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Pass 2: Per-Module Extraction & Inference (Reduce / Stream)
// ---------------------------------------------------------------------------

async function extractModuleDetails(
  moduleInfo: Pass1DiscoveredModule,
  moduleContextText: string
): Promise<Pass2ModuleResult> {
  const { provider, apiKey, model, baseURL } = getProvider();

  let rawResult: Pass2ModuleResult | null = null;

  await withRetry(async () => {
    const userPrompt = `MODULE TO PROCESS:
Title: "${moduleInfo.title}"
Description: "${moduleInfo.description}"

RELEVANT DOCUMENT TEXT / CONTEXT:
${moduleContextText.slice(0, 8_000)}`;

    if (provider === "groq" || provider === "openrouter") {
      const client = new Groq({ apiKey, baseURL });
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: PASS2_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });
      const content = completion.choices[0]?.message?.content || "";
      rawResult = parseJsonFromOutput(content);
    } else {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: PASS2_SYSTEM_PROMPT,
        tools: [
          {
            name: "emit_module_details",
            description: "Emit extracted topics and lessons for this module.",
            input_schema: PASS2_TOOL_SCHEMA as any,
          },
        ],
        tool_choice: { type: "tool", name: "emit_module_details" },
        messages: [{ role: "user", content: userPrompt }],
      });

      const toolUse = response.content.find((b) => b.type === "tool_use");
      if (toolUse && "input" in toolUse) {
        rawResult = toolUse.input as Pass2ModuleResult;
      }
    }
  });

  const result = rawResult as Pass2ModuleResult | null;
  if (!result || !Array.isArray(result.topics) || result.topics.length === 0) {
    return {
      topics: [
        {
          title: "Core Fundamentals & Theory",
          description: "Essential knowledge and concepts.",
          inferred: true,
          lessons: [
            {
              title: "Orientation and Practical Application",
              description: "Hands-on application and guidelines.",
              inferred: true,
            },
          ],
        },
      ],
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Node Transformation
// ---------------------------------------------------------------------------

function buildModuleNode(
  rawModule: Pass1DiscoveredModule,
  details: Pass2ModuleResult,
  index: number
): CurriculumNode {
  const title = rawModule.title?.trim() || `Module ${index + 1}: Core Training`;
  const moduleNode = emptyNode("module", title);
  moduleNode.description = rawModule.description || "";
  moduleNode.aiInferred = !!rawModule.inferred;

  const rawTopics = details.topics && details.topics.length > 0 ? details.topics : [
    {
      title: "Core Competency Area",
      description: "Key themes and practices.",
      inferred: true,
      lessons: [
        {
          title: "Fundamental Skills and Implementation",
          description: "Step-by-step training and practice.",
          inferred: true,
        },
      ],
    },
  ];

  moduleNode.children = rawTopics.map((t, tIdx) => {
    const topicTitle = t.title?.trim() || `Topic ${tIdx + 1}`;
    const topicNode = emptyNode("topic", topicTitle);
    topicNode.description = t.description || "";
    topicNode.aiInferred = moduleNode.aiInferred || !!t.inferred;

    const rawLessons = t.lessons && t.lessons.length > 0 ? t.lessons : [
      {
        title: "Practical Application",
        description: "Standard procedures and review.",
        inferred: true,
      },
    ];

    topicNode.children = rawLessons.map((l, lIdx) => {
      const lessonTitle = l.title?.trim() || `Lesson ${lIdx + 1}`;
      const lessonNode = emptyNode("lesson", lessonTitle);
      lessonNode.description = l.description || "";
      lessonNode.aiInferred = topicNode.aiInferred || !!l.inferred;
      return lessonNode;
    });

    return topicNode;
  });

  return moduleNode;
}

// ---------------------------------------------------------------------------
// Orchestrator: 2-Pass Chunked Pipeline
// ---------------------------------------------------------------------------

export async function* parseCurriculumPdf(fullText: string): AsyncGenerator<ParseEvent> {
  if (!fullText.trim()) {
    yield {
      type: "error",
      message:
        "No extractable text was found in this PDF. It may be scanned, image-only, password-protected, or empty.",
    };
    return;
  }

  // --- PASS 1: Boundary Discovery ---
  yield { type: "status", message: "Pass 1: Discovering program outline & module boundaries…" };

  let discovery: Pass1DiscoveryResult;
  try {
    discovery = await discoverCurriculumBoundaries(fullText);
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Curriculum outline discovery failed.",
    };
    return;
  }

  if (discovery.programTitle || discovery.programDescription) {
    yield {
      type: "program_info",
      title: discovery.programTitle,
      description: discovery.programDescription,
    };
  }

  // Deduplicate discovered modules by normalized title
  const seenNorms = new Set<string>();
  const uniqueModules: Pass1DiscoveredModule[] = [];
  for (const m of discovery.modules) {
    const norm = (m.title || "")
      .toLowerCase()
      .replace(/^(modul\s*\d*|unit\s*\d*|\d+[\.\)]?)\s*[:\-–]?\s*/i, "")
      .replace(/[^a-z0-9]/g, "");
    if (norm.length > 2 && seenNorms.has(norm)) continue;
    if (norm.length > 2) seenNorms.add(norm);
    uniqueModules.push(m);
  }

  const moduleList = uniqueModules.length > 0 ? uniqueModules : discovery.modules;

  yield {
    type: "boundaries_found",
    count: moduleList.length,
    unstructured: !!discovery.unstructured,
  };

  // --- PASS 2: Per-Module Extraction & Streaming ---
  for (let i = 0; i < moduleList.length; i++) {
    const rawMod = moduleList[i];
    const nextMod = moduleList[i + 1];

    yield {
      type: "module_progress",
      index: i,
      total: moduleList.length,
      title: rawMod.title,
    };

    try {
      const moduleSlice = getModuleTextSlice(fullText, rawMod, nextMod);
      const details = await extractModuleDetails(rawMod, moduleSlice);
      const moduleNode = buildModuleNode(rawMod, details, i);

      yield {
        type: "module_done",
        module: moduleNode,
      };
    } catch (err) {
      // Graceful degradation per module: don't abort entire parse if a single module call fails
      console.error(`[AI Pipeline] Failed to extract details for module "${rawMod.title}":`, err);
      const fallbackNode = buildModuleNode(
        rawMod,
        {
          topics: [
            {
              title: "Core Topics & Objectives",
              description: rawMod.description || "Training competencies.",
              inferred: true,
              lessons: [
                {
                  title: "Fundamental Skills and Implementation",
                  description: "Practical exercises and clinical application.",
                  inferred: true,
                },
              ],
            },
          ],
        },
        i
      );

      yield {
        type: "module_done",
        module: fallbackNode,
      };
    }

    if (i + 1 < moduleList.length) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  yield {
    type: "complete",
    moduleCount: moduleList.length,
    warning: discovery.unstructured
      ? "No explicit module headings were found — this curriculum structure was inferred entirely from the document's content. Review it closely."
      : undefined,
  };
}
