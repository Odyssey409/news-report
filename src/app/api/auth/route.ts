import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminId = process.env.ADMIN_ID;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminId || !adminPassword) {
      return NextResponse.json(
        { error: "관리자 계정이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (username === adminId && password === adminPassword) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        message: "관리자 로그인 성공",
      });
    }

    return NextResponse.json(
      { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "인증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

