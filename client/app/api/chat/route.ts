import { NextRequest } from "next/server";

// Server-side: API_URL (Docker). Fallback: NEXT_PUBLIC_* or localhost
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = body?.data ?? body;
  const question = typeof data?.question === "string" ? data.question : "";

  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { question, history: data?.history ?? [] } }),
  });

  if (!res.body) {
    return new Response("No response from backend", { status: 502 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
    },
  });
}
