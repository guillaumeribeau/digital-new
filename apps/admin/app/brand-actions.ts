"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../lib/access";
import { brandOf } from "@nova/shared/brands";

export async function switchBrand(form: FormData) {
  await requireAdmin();
  const brand = brandOf(form.get("brand"));
  (await cookies()).set("admin-brand", brand, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 86400 });
  revalidatePath("/", "layout");
  redirect("/");
}
