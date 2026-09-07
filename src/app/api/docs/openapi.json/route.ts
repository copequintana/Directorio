import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi-spec";

export function GET() {
  return NextResponse.json(openApiSpec);
}
