import { S3Client } from "@aws-sdk/client-s3";

const DEFAULT_REGION = "nyc3";

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  return undefined;
}

function isLikelySpacesRegion(value: string | undefined): value is string {
  return Boolean(value && /^(ams|blr|fra|lon|nyc|sfo|sgp|syd|tor)\d$/i.test(value));
}

function normalizeEndpoint(value: string | undefined, region: string): string {
  if (!value) return `https://${region}.digitaloceanspaces.com`;

  const trimmed = value.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.endsWith(".digitaloceanspaces.com")) return `https://${trimmed}`;
  return `https://${region}.digitaloceanspaces.com`;
}

function regionFromEndpoint(endpoint: string): string | undefined {
  try {
    const hostname = new URL(endpoint).hostname;
    const candidate = hostname.split(".")[0];
    return isLikelySpacesRegion(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}

const rawEndpoint = readEnv("DO_SPACES_ENDPOINT", "SPACES_ENDPOINT");
const rawRegion = readEnv("DO_SPACES_REGION", "SPACES_REGION");
const endpointHint = normalizeEndpoint(rawEndpoint, DEFAULT_REGION);
const region = isLikelySpacesRegion(rawRegion)
  ? rawRegion
  : regionFromEndpoint(endpointHint) ?? DEFAULT_REGION;
const endpoint = normalizeEndpoint(rawEndpoint, region);
const bucket = readEnv("DO_SPACES_BUCKET", "SPACES_BUCKET") ?? "toatre-bucket";

export const spacesConfig = {
  bucket,
  endpoint,
  region,
};

export const spacesClient = new S3Client({
  region: spacesConfig.region,
  endpoint: spacesConfig.endpoint,
  credentials: {
    accessKeyId: readEnv("DO_SPACES_KEY", "SPACES_KEY") ?? "",
    secretAccessKey: readEnv("DO_SPACES_SECRET", "SPACES_SECRET") ?? "",
  },
  forcePathStyle: false,
});

export const BUCKET = spacesConfig.bucket;
