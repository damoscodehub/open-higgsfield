export async function uploadMedia(file: File): Promise<{ url: string }> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType: file.type }),
  });
  const payload = (await res.json().catch(() => null)) as {
    error?: unknown;
    uploadUrl?: unknown;
    uploadHeaders?: unknown;
    publicUrl?: unknown;
  } | null;
  if (!res.ok) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to prepare upload");
  }
  if (
    typeof payload?.uploadUrl !== "string" ||
    typeof payload.publicUrl !== "string" ||
    payload.uploadHeaders === null ||
    typeof payload.uploadHeaders !== "object" ||
    Array.isArray(payload.uploadHeaders)
  ) throw new Error("Invalid upload response");

  const upload = await fetch(payload.uploadUrl, {
    method: "PUT",
    headers: payload.uploadHeaders as Record<string, string>,
    body: file,
    credentials: "omit",
  });
  if (!upload.ok) throw new Error("Higgsfield rejected the file upload");
  return { url: payload.publicUrl };
}
