import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import JournalClient from "./JournalClient";

export default async function JournalPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <JournalClient userId={userId} />;
}
