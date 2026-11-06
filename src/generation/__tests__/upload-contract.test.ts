import { describe, expect, it } from "vitest";

import { isUploadContentType, parseSignedUpload } from "../upload-contract";

describe("Higgsfield signed upload contract", () => {
  it("allows only media formats the studio can attach to a model", () => {
    expect(isUploadContentType("image/png")).toBe(true);
    expect(isUploadContentType("video/mp4")).toBe(true);
    expect(isUploadContentType("text/html")).toBe(false);
    expect(isUploadContentType(42)).toBe(false);
  });

  it("maps the documented signed-upload response", () => {
    expect(
      parseSignedUpload({
        upload_url: "https://uploads.example/one-time-url",
        upload_headers: { "content-type": "image/png", "x-upload-token": "temporary" },
        public_url: "https://media.example/reference.png",
      }),
    ).toEqual({
      uploadUrl: "https://uploads.example/one-time-url",
      uploadHeaders: { "content-type": "image/png", "x-upload-token": "temporary" },
      publicUrl: "https://media.example/reference.png",
    });
  });

  it("rejects incomplete or unsafe response shapes", () => {
    expect(parseSignedUpload({ upload_url: "https://uploads.example", public_url: "https://media.example" })).toBeNull();
    expect(parseSignedUpload({ upload_url: "https://uploads.example", upload_headers: ["not-a-map"], public_url: "https://media.example" })).toBeNull();
    expect(parseSignedUpload({ upload_url: "https://uploads.example", upload_headers: { x: 1 }, public_url: "https://media.example" })).toBeNull();
    expect(parseSignedUpload({ upload_url: "http://uploads.example", upload_headers: {}, public_url: "https://media.example" })).toBeNull();
  });
});
