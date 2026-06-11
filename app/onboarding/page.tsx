import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OnboardingClient from "./OnboardingClient";

export default function Page() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return <OnboardingClient />;
}
