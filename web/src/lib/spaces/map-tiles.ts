import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import { spacesClient, BUCKET } from "./client";

function keyFor(location: string): string {
  const hash = createHash("sha256").update(location).digest("hex");
  return `map-tiles/${hash}.png`;
}

export async function getMapTile(location: string): Promise<ArrayBuffer | null> {
  const key = keyFor(location);
  try {
    const res = await spacesClient.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    if (!res.Body) return null;
    // Body is a Readable stream in Node.js
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const total = chunks.reduce((n, c) => n + c.byteLength, 0);
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buf.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return buf.buffer;
  } catch {
    // NoSuchKey or any other error → cache miss
    return null;
  }
}

export async function putMapTile(
  location: string,
  data: ArrayBuffer
): Promise<void> {
  const key = keyFor(location);
  await spacesClient.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(data),
      ContentType: "image/png",
      // Public read so a CDN edge could serve it directly in future
      ACL: "public-read",
      CacheControl: "public, max-age=2592000", // 30 days in Spaces metadata
    })
  );
}
