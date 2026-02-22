"use client";

import { useState } from "react";
import type { Message as MessageType } from "@/lib/types";

interface MessageProps {
  message: MessageType;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-orange-300 text-sm font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-gray-100 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-gray-100 mt-4 mb-2">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-300">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br/>");
}

export default function Message({ message }: MessageProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  if (message.isLoading) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="bg-orange-600 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    );
  }

  // Assistant message
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 mt-1">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
          <div
            className="text-sm text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: `<p class="mt-0">${formatMarkdown(message.content)}</p>`,
            }}
          />
        </div>

        {/* Sources section */}
        {hasSources && (
          <div className="ml-1">
            <button
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${sourcesExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>
                {message.sources!.length} source{message.sources!.length !== 1 ? "s" : ""}
              </span>
            </button>

            {sourcesExpanded && (
              <div className="mt-2 flex flex-col gap-1.5">
                {message.sources!.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors group"
                  >
                    <div className="w-4 h-4 flex-shrink-0">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(source.url).hostname; } catch { return ""; } })()}&sz=16`}
                        alt=""
                        className="w-4 h-4 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors truncate">
                        {source.title}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {(() => { try { return new URL(source.url).hostname; } catch { return source.url; } })()}
                      </p>
                    </div>
                    <svg
                      className="w-3 h-3 text-gray-600 group-hover:text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
