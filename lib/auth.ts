import { createClient } from "./supabase/server";
export async function authenticated() {
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  return { db, user: error ? null : user };
}
