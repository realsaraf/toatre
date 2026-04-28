import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifySecretHash(value: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashSecret(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function encryptSecret(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, ivValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function getEncryptionKey(): Buffer {
  const raw = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("CALENDAR_TOKEN_ENCRYPTION_KEY is required for calendar sync.");
  }

  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 32) {
    return decoded;
  }

  throw new Error("CALENDAR_TOKEN_ENCRYPTION_KEY must be 32 bytes as hex or base64.");
}
