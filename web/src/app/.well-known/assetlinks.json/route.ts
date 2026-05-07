import { NextResponse } from "next/server";
import { assetLinks, associationHeaders } from "@/lib/app_link_association";

export function GET() {
  return NextResponse.json(assetLinks, {
    headers: associationHeaders("application/json"),
  });
}