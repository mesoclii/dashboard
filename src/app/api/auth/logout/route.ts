import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_OAUTH_STATE_COOKIE, DASHBOARD_SESSION_COOKIE } from "@/lib/session";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));
  response.cookies.delete(DASHBOARD_SESSION_COOKIE);
  response.cookies.delete(DASHBOARD_OAUTH_STATE_COOKIE);
  return response;
}
