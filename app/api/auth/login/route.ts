import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username && password) {
      return NextResponse.json({
        access_token: `mock_jwt_${Buffer.from(username).toString("base64")}_${Date.now()}`,
        user: { username },
      });
    }

    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
