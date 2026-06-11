import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OnboardingClient from "./OnboardingClient";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return <OnboardingClient />;
}
