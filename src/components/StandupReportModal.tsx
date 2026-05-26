import React, { useState, useEffect } from "react";
import { X, Sparkles, Loader2, RefreshCw, Layers, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";

interface StandupReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StandupReportModal({ isOpen, onClose }: StandupReportModalProps) {
  const [reportText, setReportText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStandupReport = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/gemini/standup-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error("Could not retrieve AI standup summary. Double check your Gemini API key in Settings > Secrets.");
      }

      const data = await response.json();
      setReportText(data.summary || "No active milestones available to outline.");
    } catch (e: any) {
      setError(e.message || "Failed connecting to Gemini AI services.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStandupReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Simple, highly stylized Markdown-to-HTML lines renderer.
  // It handles headers (###, ##, #), bullet items (*, -), blockquotes (>), bold, and empty spacers.
  const renderStyledContent = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2 border-b border-slate-100 pb-1.5 font-sans uppercase tracking-wider">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-base font-bold text-slate-950 mt-6 mb-3 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-slate-950 mt-6 mb-3">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
      }

      // Bullet points
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        const text = trimmed.substring(1).trim();
        // Parse quick bold segments **text** inside bullet
        const parts = text.split("**");
        return (
          <li key={idx} className="list-none pl-6 relative text-xs text-slate-600 leading-relaxed mb-1.5">
            <span className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-violet-500" />
            {parts.map((p, i) => (
              <span key={i} className={i % 2 === 1 ? "font-bold text-slate-800" : ""}>
                {p}
              </span>
            ))}
          </li>
        );
      }

      // Blockquotes / Warnings
      if (trimmed.startsWith(">")) {
        return (
          <div key={idx} className="border-l-4 border-violet-400 bg-violet-50/40 p-3 rounded-r-lg text-xs leading-relaxed italic text-slate-600 my-4">
            {trimmed.substring(1).trim()}
          </div>
        );
      }

      // Empty Lines
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Regular paragraph text
      const parts = trimmed.split("**");
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2">
          {parts.map((p, i) => (
            <span key={i} className={i % 2 === 1 ? "font-bold text-slate-800" : ""}>
              {p}
            </span>
          ))}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs font-sans p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                Daily Standup Summary
                <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Gemini AI</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated progress reports & roadmaps parsed directly from active workloads.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Content scroll body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-white select-text">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 border-4 border-violet-100 rounded-full animate-ping" />
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Scrum Master AI is compiling...</p>
                <p className="text-xs text-slate-400 max-w-sm">Fetching team data, analyzing categories, tracking due date metrics & formatting Standup summary.</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 p-6 border border-rose-100 bg-rose-50/50 rounded-2xl">
              <span className="text-3xl">🔑</span>
              <p className="text-sm font-bold text-slate-800">Gemini Key Missing or Invalid</p>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                We couldn't connect to Gemini. Make sure to paste a valid Google Gemini API Key inside the <strong>Settings &gt; Secrets</strong> panel of your Google AI Studio UI.
              </p>
              <button 
                onClick={fetchStandupReport}
                className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Reconnecting
              </button>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none space-y-2">
              {renderStyledContent(reportText)}
            </div>
          )}
        </div>

        {/* Footer menu */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <span className="font-semibold text-slate-600">Dynamic Daily Analysis Mode</span>
          </div>

          <button
            onClick={fetchStandupReport}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Summary
          </button>
        </div>
      </div>
    </div>
  );
}
