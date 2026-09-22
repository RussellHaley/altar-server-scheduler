"use server";

import { signIn, signOut } from "@/auth";

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/" });
}

export async function googleEnrollmentSignIn(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) throw new Error("Enrollment token is required");
  await signIn("google", { redirectTo: `/enroll/${encodeURIComponent(token)}` });
}

export async function devSignIn(formData: FormData) {
  await signIn("dev-login", { email: formData.get("email"), redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
