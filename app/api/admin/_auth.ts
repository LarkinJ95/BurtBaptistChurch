import { getCurrentAdmin } from "../../auth";
export async function requireAdmin() { const email = await getCurrentAdmin(); if (!email) throw new Error("Unauthorized"); return email; }
