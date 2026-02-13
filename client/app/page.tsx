import { ChatInterface } from "@/components/chat-interface";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--neomorphic-bg)" }}>
      <header className="neomorphic-1 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold neomorphic-text-title">PDF Q&A Bot</h1>
          <p className="text-sm neomorphic-text">Upload a PDF and ask questions — local AI, no API keys</p>
        </div>
      </header>
      <main className="pt-4">
        <ChatInterface />
      </main>
    </div>
  );
}
