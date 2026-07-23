import { authenticateStaff, createSession, sessionCookie } from "../../../auth";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const staff = await authenticateStaff(email, password);
    if (!staff) return Response.redirect(new URL("/admin?error=invalid-login", request.url), 303);
    const response = Response.redirect(new URL("/admin", request.url), 303);
    response.headers.set("Set-Cookie", sessionCookie(await createSession(staff.email, staff.sessionKey)));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const problem = message.includes("binding `DB`") ? "d1-binding" : "database";
    return Response.redirect(new URL(`/admin?error=${problem}`, request.url), 303);
  }
}
