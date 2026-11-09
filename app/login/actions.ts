 "use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email.endsWith("@nuvantglobal.com")) redirect("/login?error=domain");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credentials");
  redirect("/app");
}