import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API;

export async function GET() {
  if (!FASTAPI_URL) {
    return NextResponse.json(
      { message: "Backend URL not configured" },
      { status: 503 }
    );
  }
  try {
    const res = await fetch(`${FASTAPI_URL}/api`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { message: "Backend unavailable" },
      { status: 502 }
    );
  }
}

