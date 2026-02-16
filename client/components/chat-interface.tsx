"use client";

import { Bot, FileUp, Lightbulb, Loader2, Send, User } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ id: number; type: "user" | "ai"; content: string; timestamp: Date }[]>([
    {
      id: 1,
      type: "ai",
      content:
        "Hi! I'm your PDF assistant. Upload a PDF above and I'll answer questions about it using local AI (no API keys).",
      timestamp: new Date(),
    },
  ]);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions = [
    "What is this document about?",
    "Summarize the main points",
    "What are the key takeaways?",
    "Explain the main topic in simple terms",
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please choose a PDF file.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) {
        setPdfUploaded(true);
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, type: "ai", content: "PDF processed. You can now ask questions about it.", timestamp: new Date() },
        ]);
      } else {
        setUploadError(data.error || "Upload failed.");
      }
    } catch (err) {
      setUploadError("Upload failed. Is the server running on port 8000?");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAsk = async () => {
    console.log("handleAsk");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { question: message, history: messages.map((m) => m.content) },
      }),
    });
    console.log(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.detail?.[0]?.msg || err?.detail || err?.error || "Request failed.";
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, type: "ai", content: typeof msg === "string" ? msg : JSON.stringify(msg), timestamp: new Date() },
      ]);
      return;
    }
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let aiContent = "";
    setMessages((prev) => [...prev, { id: prev.length + 1, type: "ai", content: "", timestamp: new Date() }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      aiContent += decoder.decode(value);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.type === "ai") next[next.length - 1] = { ...last, content: aiContent };
        return next;
      });
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
      }, 0);
    }
    setMessage("");
  };

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { id: prev.length + 1, type: "user", content: message, timestamp: new Date() }]);
    setMessage("");
    handleAsk();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Upload & suggestions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="neomorphic-container p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="neomorphic-1 p-2 rounded-xl relative">
                <FileUp className="w-5 h-5 neomorphic-text" />
                <span className="accent-dot accent-dot-green absolute -top-1 -right-1" />
              </div>
              <h3 className="font-semibold neomorphic-text-title">PDF Upload</h3>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="neomorphic-button w-full"
            >
              {uploading ? "Processing…" : "Choose PDF"}
            </button>
            {pdfUploaded && <p className="text-sm neomorphic-text mt-2">PDF ready</p>}
            {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
          </div>
          <div className="neomorphic-container p-6">
            <h4 className="font-semibold flex items-center neomorphic-text-title mb-3">
              <Lightbulb className="w-4 h-4 mr-2" />
              Suggested questions
            </h4>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMessage(q)}
                  className="w-full text-left p-3 text-sm neomorphic-button rounded-2xl"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-3">
          <div className="neomorphic-container h-[calc(100dvh-140px)] flex flex-col">
            <div className="p-4 border-b border-gray-300/30 flex items-center gap-3">
              <div className="neomorphic-1 p-2 rounded-xl relative">
                <Bot className="w-5 h-5 neomorphic-text" />
                <span className="accent-dot accent-dot-green absolute -top-1 -right-1" />
              </div>
              <h2 className="text-lg font-bold neomorphic-text-title">PDF Q&A</h2>
              {pdfUploaded && <span className="neomorphic-badge-green text-xs font-medium">Ready</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-start gap-3 max-w-[85%]">
                      {msg.type === "ai" && (
                        <div className="neomorphic-1 p-2 rounded-xl flex-shrink-0">
                          <Bot className="w-4 h-4 neomorphic-text" />
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-2xl ${msg.type === "user" ? "neomorphic-inset-1" : "neomorphic-2"}`}
                      >
                        <span className="leading-relaxed neomorphic-text-dark block prose prose-sm max-w-none">
                          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                        </span>
                      </div>
                      {msg.type === "user" && (
                        <div className="neomorphic-1 p-2 rounded-xl flex-shrink-0">
                          <User className="w-4 h-4 neomorphic-text" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-300/30 flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about your PDF…"
                className="flex-1 neomorphic-input"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim()||uploading}
                className="neomorphic-button px-5 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
               
                 
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
