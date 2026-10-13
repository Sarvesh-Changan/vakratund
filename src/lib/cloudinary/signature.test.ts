import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "test-key",
    CLOUDINARY_API_SECRET: "test-secret",
  },
}));
vi.mock("server-only", () => ({}));

import { serializeCloudinarySignatureParameters, signUploadParameters } from "@/lib/cloudinary/signature";

describe("Cloudinary upload signatures", () => {
  it("signs exactly the non-excluded fields sent by the browser", () => {
    const signed = signUploadParameters("projects", "IMAGE", 1_700_000_000_000);
    const uploadFields = {
      allowed_formats: signed.allowedFormats,
      folder: signed.folder,
      timestamp: signed.timestamp,
      ...(signed.transformation ? { transformation: signed.transformation } : {}),
    };
    const serialized = serializeCloudinarySignatureParameters(uploadFields);
    const expected = createHash("sha1").update(`${serialized}test-secret`).digest("hex");

    expect(signed.resourceType).toBe("image");
    expect(signed.signedParameterNames).toEqual(["allowed_formats", "folder", "timestamp", "transformation"]);
    expect(signed.signature).toBe(expected);
    expect(uploadFields).toEqual({
      allowed_formats: "jpg,jpeg,png,webp,avif",
      folder: "vakratund/projects",
      timestamp: 1_700_000_000,
      transformation: "fl_strip_profile",
    });
  });
});
