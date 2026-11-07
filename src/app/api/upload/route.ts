import { NextResponse } from "next/server";

import { toAuthorizationHeader } from "@/generation/credentials";
import { readPlatformCredentials } from "@/generation/server-credentials";
import { isUploadContentType, parseSignedUpload } from "@/generation/upload-contract";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { contentType?: unknown } | null;
  if (!isUploadContentType(body?.contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  try {
    const { apiKey, baseUrl } = await readPlatformCredentials();
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/files/generate-upload-url`, {
      method: "POST",
      headers: {
        Authorization: toAuthorizationHeader(apiKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content_type: body.contentType }),
    });
    const payload = await readJson(response);
    if (!response.ok) {
      return NextResponse.json({ error: messageForHiggsfieldStatus(response.status) }, { status: response.status });
    }

    const signedUpload = parseSignedUpload(payload);
    if (!signedUpload) {
      return NextResponse.json({ error: "Higgsfield returned an invalid upload response" }, { status: 502 });
    }

    // The signed URL is returned only to perform this one upload. Never log it.
    return NextResponse.json(signedUpload);
  } catch (error) {
    const message = messageForSetupError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function messageForHiggsfieldStatus(status: number): string {
  if (status === 401 || status === 403) return "Higgsfield rejected your API key";
  if (status === 429) return "Higgsfield is rate limiting uploads; try again shortly";
  return `Higgsfield could not prepare this upload (HTTP ${status})`;
}

function messageForSetupError(error: unknown): string {
  if (!(error instanceof Error)) return "Unable to prepare the upload";
  if (error.message === "Missing platform key") return "Add your Higgsfield API key before uploading";
  if (error.message === "Missing HF_API_BASE_URL") {
    return "Set HF_API_BASE_URL to https://api.higgsfield.ai in .env.local, then restart the app";
  }
  return "Unable to prepare the upload";
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
