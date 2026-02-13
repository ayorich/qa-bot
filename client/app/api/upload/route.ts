import { NextRequest } from "next/server";

// Server-side: API_URL (Docker). Fallback: NEXT_PUBLIC_* or localhost
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ ok: false, error: "No file uploaded." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ ok: false, error: "Please upload a PDF file." }, { status: 400 });
  }

  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return Response.json(
      { ok: false, error: data.error || "Upload failed." },
      { status: res.status }
    );
  }
  return Response.json(data);
}
