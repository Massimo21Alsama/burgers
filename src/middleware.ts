import { NextResponse, type NextRequest } from "next/server";
import { VOTER_COOKIE } from "@/lib/burgers";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Give every browser a random voter_id on its first visit.
export function middleware(request: NextRequest) {
  if (request.cookies.has(VOTER_COOKIE)) return NextResponse.next();

  const voterId = crypto.randomUUID();
  // Make the cookie visible to this same request's server components too.
  request.cookies.set(VOTER_COOKIE, voterId);
  const response = NextResponse.next({ request });
  response.cookies.set(VOTER_COOKIE, voterId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
