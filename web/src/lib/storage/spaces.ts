import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { spacesClient, BUCKET } from "@/lib/spaces/client";

export async function uploadToSpaces(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  await spacesClient.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

export async function deleteFromSpaces(key: string): Promise<void> {
  await spacesClient.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

export async function getBytesFromSpaces(
  key: string
): Promise<{ bytes: Uint8Array; contentType: string | undefined }> {
  const obj = await spacesClient.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  if (!obj.Body) throw new Error("Empty body from Spaces");
  // AWS SDK v3 SdkStreamMixin provides transformToByteArray()
  const bytes = await (
    obj.Body as unknown as { transformToByteArray(): Promise<Uint8Array> }
  ).transformToByteArray();
  return { bytes, contentType: obj.ContentType };
}
