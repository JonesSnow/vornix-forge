import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import SimulatorClient from "./SimulatorClient";

export default async function SimulatorPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <SimulatorClient userId={userId} />;
}
