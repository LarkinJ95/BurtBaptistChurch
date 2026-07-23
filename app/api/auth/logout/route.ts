import { clearedSessionCookie } from "../../../auth";

export async function POST(request: Request) {
  const response = Response.redirect(new URL("/admin", request.url), 303);
  response.headers.set("Set-Cookie", clearedSessionCookie);
  return response;
}
