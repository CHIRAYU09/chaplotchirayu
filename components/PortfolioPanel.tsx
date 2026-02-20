"use client";

import { useState } from "react";

interface PortfolioPanelProps {
  companies: string[];
  onAdd: (company: string) => void;
  onRemove: (company: string) => void;
}

export default function PortfolioPanel({
  companies,
  onAdd,
  onRemove,
}: PortfolioPanelProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !companies.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
          My Portfolio
        </h2>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed">
        Companies are added automatically when you chat, or add manually below.
      </p>

      {/* Companies list */}
      <div className="flex-1 min-h-0">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-center">
            <svg
              className="w-8 h-8 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-xs text-gray-600">No companies yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {companies.map((company) => (
              <span
                key={company}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs font-medium text-orange-300 hover:bg-orange-500/20 transition-colors"
              >
                {company}
                <button
                  onClick={() => onRemove(company)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 hover:text-orange-200"
                  aria-label={`Remove ${company}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add company input */}
      <div className="flex gap-2 pt-2 border-t border-gray-800">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. TCS, Reliance..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
