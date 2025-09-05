"use client";

import { useSession } from "next-auth/react";

export function SessionEnforcer() {
  const { data: session, status } = useSession();

  // Placeholder component - session enforcement disabled
  // This will be reimplemented later with a better approach
  if (status === "authenticated" && session?.user?.id) {
    console.log("�️ SessionEnforcer: Session monitoring disabled - allowing multiple sessions");
  }

  return null;
}
