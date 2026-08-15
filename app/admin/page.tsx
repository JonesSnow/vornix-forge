import { auth } from "@clerk/nextjs/server";
import { ADMIN_CLERK_IDS } from "@/lib/constants";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
    redirect("/dashboard");
  }

  return <AdminClient />;
}
