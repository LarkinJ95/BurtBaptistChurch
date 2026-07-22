import { headers } from "next/headers";
export async function requireAdmin() { const email = (await headers()).get("cf-access-authenticated-user-email"); if (!email) throw new Error("Unauthorized"); return email; }
