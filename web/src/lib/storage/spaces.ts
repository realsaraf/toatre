import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  type GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { spacesClient, BUCKET } from "@/lib/spaces/client";

type SignedSpacesUrlOptions = {
  expiresIn?: number;
  contentType?: string;
  contentDisposition?: "inline" | "attachment";
  filename?: string;
};

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

export async function getSignedSpacesUrl(
  key: string,
  options: SignedSpacesUrlOptions = {}
): Promise<string> {
  const signerClient = spacesClient as unknown as Parameters<typeof getSignedUrl>[0];
  const input: GetObjectCommandInput = {
    Bucket: BUCKET,
    Key: key,
  };

  if (options.contentType) {
    input.ResponseContentType = options.contentType;
  }

  if (options.contentDisposition || options.filename) {
    const disposition = options.contentDisposition ?? "inline";
    const safeFilename =
      options.filename?.replace(/[^\w\s.-]/g, "_").trim() || "attachment";
    input.ResponseContentDisposition = `${disposition}; filename="${safeFilename}"`;
  }

  return getSignedUrl(signerClient, new GetObjectCommand(input), {
    expiresIn: options.expiresIn ?? 900,
  });
}
