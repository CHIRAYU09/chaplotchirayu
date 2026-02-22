"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Message from "./Message";
import PortfolioPanel from "./PortfolioPanel";
import type { Message as MessageType, ChatApiResponse } from "@/lib/types";

let messageIdCounter = 0;
function generateId() {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

const INITIAL_MESSAGE: MessageType = {
  id: generateId(),
  role: "assistant",
  content:
    "Namaste! I'm your AI stock market assistant for Indian equities (NSE/BSE).\n\nTo get started, please **list your portfolio companies** — for example:\n\n*\"My portfolio: Reliance Industries, TCS, HDFC Bank, Infosys, Wipro\"*\n\nOnce I know your holdings, I can answer any questions about them with real-time data and sources.",
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addCompany = useCallback((company: string) => {
    setPortfolio((prev) => (prev.includes(company) ? prev : [...prev, company]));
  }, []);

  const removeCompany = useCallback((company: string) => {
    setPortfolio((prev) => prev.filter((c) => c !== company));
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: MessageType = {
      id: generateId(),
      role: "user",
      content: trimmed,
    };

    const loadingMessage: MessageType = {
      id: generateId(),
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history for the API (exclude initial greeting)
      const historyMessages = messages
        .filter((m) => !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }));

      historyMessages.push({ role: "user", content: trimmed });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyMessages,
          portfolio,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Request failed");
      }

      const data: ChatApiResponse = await res.json();

      // Handle portfolio extraction
      if (data.extractedPortfolio && data.extractedPortfolio.length > 0) {
        setPortfolio((prev) => {
          const newSet = new Set([...prev, ...data.extractedPortfolio!]);
          return Array.from(newSet);
        });
      }

      // Replace loading message with actual response
      const assistantMessage: MessageType = {
        id: generateId(),
        role: "assistant",
        content: data.message,
        sources: data.sources,
      };

      setMessages((prev) => [...prev.slice(0, -1), assistantMessage]);
    } catch (error) {
      const errorMessage: MessageType = {
        id: generateId(),
        role: "assistant",
        content:
          error instanceof Error && error.message.includes("API key")
            ? "**API key not configured.** Please add your `ANTHROPIC_API_KEY` environment variable. Get one at [console.anthropic.com](https://console.anthropic.com)."
            : `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, portfolio]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }, []);

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        <div className="w-72 h-full p-4 border-r border-gray-800 flex flex-col gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Portfolio AI</h1>
              <p className="text-xs text-gray-500">Indian Stock Assistant</p>
            </div>
          </div>

          {/* NSE/BSE badge */}
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400 font-medium">
              NSE
            </span>
            <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-medium">
              BSE
            </span>
            <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 font-medium">
              Live Data
            </span>
          </div>

          {/* Portfolio Panel */}
          <div className="flex-1 min-h-0">
            <PortfolioPanel
              companies={portfolio}
              onAdd={addCompany}
              onRemove={removeCompany}
            />
          </div>

          {/* Quick prompts */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">
              Quick queries
            </p>
            {[
              "Latest news about my holdings",
              "Which stocks are up today?",
              "Show Q3 earnings results",
              "Any FII activity in my stocks?",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt);
                  inputRef.current?.focus();
                }}
                className="text-left text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-200">
              Indian Stock Portfolio Assistant
            </h2>
            <p className="text-xs text-gray-600">
              Powered by Claude with real-time web search
            </p>
          </div>
          {portfolio.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-xs text-orange-400 font-medium">
                {portfolio.length} stocks tracked
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-800 px-4 py-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your portfolio stocks... (e.g. 'What's the latest news about TCS?')"
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm text-gray-200 placeholder-gray-600 focus:outline-none leading-relaxed min-h-[24px] max-h-40"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white flex items-center justify-center transition-colors"
                aria-label="Send message"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-gray-700 mt-2">
              Fetches real-time data from NSE, BSE, Moneycontrol, ET Markets & more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
