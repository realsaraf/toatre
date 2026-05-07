import { NextResponse } from "next/server";
import {
  appleAppSiteAssociation,
  associationHeaders,
} from "@/lib/app_link_association";

export function GET() {
  return NextResponse.json(appleAppSiteAssociation, {
    headers: associationHeaders("application/json"),
  });
}