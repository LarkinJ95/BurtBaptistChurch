import { authenticateStaff, createSession, sessionCookie } from "../../../auth";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const staff = await authenticateStaff(email, password);
    if (!staff) return Response.redirect(new URL("/admin?error=invalid-login", request.url), 303);
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/admin", request.url).toString(),
        "Set-Cookie": sessionCookie(await createSession(staff.email, staff.sessionKey)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const problem = message.includes("binding `DB`") ? "d1-binding" : "database";
    const url = new URL(`/admin?error=${problem}`, request.url);
    if (message) url.searchParams.set("reason", message.slice(0, 180));
    return Response.redirect(url, 303);
  }
}
