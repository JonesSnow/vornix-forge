import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ProgressClient from "./ProgressClient";

export default async function ProgressPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <ProgressClient userId={userId} />;
}
