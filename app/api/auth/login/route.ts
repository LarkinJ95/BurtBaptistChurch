import { authenticateStaff, createSession, sessionCookie } from "../../../auth";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const staffEmail = await authenticateStaff(email, password);
    if (!staffEmail) return Response.redirect(new URL("/admin?error=invalid-login", request.url), 303);
    const response = Response.redirect(new URL("/admin", request.url), 303);
    response.headers.set("Set-Cookie", sessionCookie(await createSession(staffEmail)));
    return response;
  } catch {
    return Response.redirect(new URL("/admin?error=setup", request.url), 303);
  }
}
