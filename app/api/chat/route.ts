import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import type { Source } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a knowledgeable AI investment assistant specializing in Indian stock markets (NSE/BSE). You help investors research and track their portfolio companies.

**Your core behaviors:**

1. **First interaction**: If no portfolio companies have been established, warmly greet the user and ask them to list all their portfolio companies (e.g., "TCS, Reliance Industries, HDFC Bank").

2. **Portfolio detection**: When the user lists their portfolio companies, acknowledge them enthusiastically, then at the END of your text response add this exact tag:
   <portfolio>Company1, Company2, Company3</portfolio>
   Use the actual company names as provided. Do this ONLY when the user first shares their portfolio list.

3. **Answering stock queries**: When asked about companies:
   - Use the web_search tool to fetch the LATEST news, prices, and data
   - Search for both company name AND NSE/BSE ticker when useful
   - Provide a concise but informative answer with specific numbers and data

4. **Tone**: Professional yet approachable. Use markdown formatting (bold for key numbers, bullet points for lists). Keep responses focused and actionable.`;

function extractSourcesFromContent(content: Anthropic.ContentBlock[]): Source[] {
  const sources: Source[] = [];
  const seenUrls = new Set<string>();

  for (const block of content) {
    if (block.type === "web_search_tool_result") {
      const webBlock = block as Anthropic.WebSearchToolResultBlock;
      const blockContent = webBlock.content;
      if (Array.isArray(blockContent)) {
        for (const result of blockContent as Anthropic.WebSearchResultBlock[]) {
          if (result.type === "web_search_result" && !seenUrls.has(result.url)) {
            seenUrls.add(result.url);
            sources.push({ title: result.title, url: result.url });
          }
        }
      }
    }
  }

  return sources;
}

function extractPortfolio(text: string): string[] | null {
  const match = text.match(/<portfolio>([\s\S]*?)<\/portfolio>/);
  if (!match) return null;
  return match[1]
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function cleanText(text: string): string {
  return text.replace(/<portfolio>[\s\S]*?<\/portfolio>/g, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { messages, portfolio } = await req.json();

    const systemWithPortfolio =
      portfolio && portfolio.length > 0
        ? `${SYSTEM_PROMPT}\n\n**User's tracked portfolio**: ${portfolio.join(", ")}\n\nPrioritize information about these companies when relevant.`
        : SYSTEM_PROMPT;

    const claudeMessages: Anthropic.MessageParam[] = messages.map(
      (m: { role: "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      })
    );

    // web_search_20250305 is a server-side tool — Anthropic handles it automatically
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemWithPortfolio,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
          allowed_domains: [
            "moneycontrol.com",
            "economictimes.indiatimes.com",
            "livemint.com",
            "nseindia.com",
            "bseindia.com",
            "businessstandard.com",
            "financialexpress.com",
            "ndtvprofit.com",
            "reuters.com",
            "bloomberg.com",
            "cnbctv18.com",
            "zeebiz.com",
          ],
        },
      ],
      messages: claudeMessages,
    });

    // Extract text content
    const rawText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Extract sources directly from web_search_tool_result blocks
    const sources = extractSourcesFromContent(response.content);

    const extractedPortfolio = extractPortfolio(rawText);
    const message = cleanText(rawText);

    return Response.json({ message, sources, extractedPortfolio });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return Response.json({ error: message }, { status: 500 });
  }
}
