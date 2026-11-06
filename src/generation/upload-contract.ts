export const UPLOAD_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "audio/wav",
  "audio/x-wav",
] as const;

const CONTENT_TYPES = new Set<string>(UPLOAD_CONTENT_TYPES);

export type SignedUpload = {
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  publicUrl: string;
};

export function isUploadContentType(value: unknown): value is (typeof UPLOAD_CONTENT_TYPES)[number] {
  return typeof value === "string" && CONTENT_TYPES.has(value);
}

export function parseSignedUpload(value: unknown): SignedUpload | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.upload_url !== "string" ||
    typeof record.public_url !== "string" ||
    record.upload_headers === null ||
    typeof record.upload_headers !== "object" ||
    Array.isArray(record.upload_headers)
  ) return null;

  const headers = Object.entries(record.upload_headers);
  if (!headers.every(([key, entry]) => key && typeof entry === "string")) return null;
  if (!isHttpsUrl(record.upload_url) || !isHttpsUrl(record.public_url)) return null;
  return {
    uploadUrl: record.upload_url,
    uploadHeaders: Object.fromEntries(headers) as Record<string, string>,
    publicUrl: record.public_url,
  };
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
