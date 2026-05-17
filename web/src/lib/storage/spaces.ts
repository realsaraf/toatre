import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

function getSpacesClient(): S3Client {
  if (_client) return _client;
  const key = process.env.SPACES_KEY;
  const secret = process.env.SPACES_SECRET;
  const region = process.env.SPACES_REGION;
  const endpoint = process.env.SPACES_ENDPOINT;
  if (!key || !secret || !region || !endpoint) {
    throw new Error("DigitalOcean Spaces environment variables are missing");
  }
  _client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: key, secretAccessKey: secret },
    forcePathStyle: false,
  });
  return _client;
}

function getBucket(): string {
  const bucket = process.env.SPACES_BUCKET;
  if (!bucket) throw new Error("SPACES_BUCKET is not set");
  return bucket;
}

export async function uploadToSpaces(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  await getSpacesClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: "private",
    })
  );
}

export async function deleteFromSpaces(key: string): Promise<void> {
  await getSpacesClient().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

export async function getBytesFromSpaces(
  key: string
): Promise<{ bytes: Uint8Array; contentType: string | undefined }> {
  const obj = await getSpacesClient().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key })
  );
  if (!obj.Body) throw new Error("Empty body from Spaces");
  // AWS SDK v3 SdkStreamMixin provides transformToByteArray()
  const bytes = await (
    obj.Body as unknown as { transformToByteArray(): Promise<Uint8Array> }
  ).transformToByteArray();
  return { bytes, contentType: obj.ContentType };
}
