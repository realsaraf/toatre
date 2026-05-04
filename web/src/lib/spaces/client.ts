import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.DO_SPACES_REGION ?? "sfo3";

export const spacesClient = new S3Client({
  region,
  endpoint: `https://${region}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY ?? "",
    secretAccessKey: process.env.DO_SPACES_SECRET ?? "",
  },
  forcePathStyle: false,
});

export const BUCKET = process.env.DO_SPACES_BUCKET ?? "toatre-bucket";
