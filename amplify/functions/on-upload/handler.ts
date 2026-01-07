// amplify/functions/on-upload/handler.ts
import type { S3Event } from "aws-lambda";

export const handler = async (event: S3Event) => {
  for (const r of event.Records ?? []) {
    const bucket = r?.s3?.bucket?.name;
    const key = decodeURIComponent(r?.s3?.object?.key?.replace(/\+/g, " ") ?? "");
    const size = r?.s3?.object?.size;
    console.log("New upload:", { bucket, key, size });
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};