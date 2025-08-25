import { whopSdk } from "@/lib/whop";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Verify Whop token for experiences path
  if (req.nextUrl.pathname.startsWith("/experiences/")) {
    try {
      await whopSdk.verifyUserToken(req.headers);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/experiences/:path*"],
};


