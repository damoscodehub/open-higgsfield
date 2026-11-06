import { cookies } from "next/headers";

import { MissingCredentialsError, PLATFORM_KEY_COOKIE, decodeCredentials } from "./credentials";

/** Resolve the current visitor's platform credentials without exposing the API
    key to client code. Routes and server actions share this boundary. */
export async function readPlatformCredentials() {
  const jar = await cookies();
  const stored = decodeCredentials(jar.get(PLATFORM_KEY_COOKIE)?.value);
  if (!stored) throw new MissingCredentialsError();

  const baseUrl = process.env.HF_API_BASE_URL;
  if (!baseUrl) throw new Error("Missing HF_API_BASE_URL");
  return { ...stored, baseUrl };
}
