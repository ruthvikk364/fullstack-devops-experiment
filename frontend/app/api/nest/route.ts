import { NextResponse } from "next/server";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API;

export async function GET() {
  if (!NEST_API_URL) {
    return NextResponse.json(
      { message: "Backend URL not configured" },
      { status: 503 }
    );
  }
  try {
    const res = await fetch(NEST_API_URL, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { message: "Backend unavailable" },
      { status: 502 }
    );
  }
}

