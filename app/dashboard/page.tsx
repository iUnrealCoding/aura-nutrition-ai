import Dashboard from "@/components/Dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function Page() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data } = await db
    .from("profiles")
    .select(
      "phase,target_calories,target_protein_g,target_carbs_g,target_fats_g",
    )
    .eq("id", user.id)
    .single();
  return (
    <Dashboard
      profile={
        data ?? {
          phase: "Recomp",
          target_calories: 2400,
          target_protein_g: 180,
          target_carbs_g: 240,
          target_fats_g: 80,
        }
      }
    />
  );
}
