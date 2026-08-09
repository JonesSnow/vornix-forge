import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import LearnClient from "./LearnClient";

export default async function LearnPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <LearnClient />;
}
