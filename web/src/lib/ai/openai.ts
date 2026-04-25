import OpenAI from "openai";

// Singleton — reuse across requests in the same server process.
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export const MODELS = {
  extract: process.env.OPENAI_MODEL ?? "gpt-4o",
  extractFast: process.env.OPENAI_MODEL_FAST ?? "gpt-4o-mini",
  whisper: process.env.OPENAI_WHISPER_MODEL ?? "whisper-1",
} as const;
