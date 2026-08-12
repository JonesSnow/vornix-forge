import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import CommunityClient from "./CommunityClient";

export default async function CommunityPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <CommunityClient userId={userId} />;
}
