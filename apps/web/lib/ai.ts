import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function summarizeDiaryContent(content: string) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const modelName = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
    const { text } = await generateText({
      model: openai(modelName),
      prompt: `请将这段日记总结为一句话（不超过30字）:\n${content}`,
    });
    return text;
  } catch (error) {
    console.warn("AI summarize failed:", error);
    return null;
  }
}
