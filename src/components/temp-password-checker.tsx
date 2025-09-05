"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PasswordResetModal } from "./password-reset-modal";

export function TempPasswordChecker() {
  const { data: session, status } = useSession();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Create a unique key for this user's password change status
      const userPasswordKey = `passwordChanged_${session.user.id}`;
      const hasChangedPassword = localStorage.getItem(userPasswordKey) === "true";
      const requiresPasswordReset = session.user.requiresPasswordReset;
      
      console.log("🔍 TempPasswordChecker:", {
        userEmail: session.user.email,
        requiresPasswordReset,
        hasChangedPassword,
        userPasswordKey
      });
      
      // Show modal if user requires password reset AND hasn't changed it yet
      if (requiresPasswordReset && !hasChangedPassword) {
        console.log("🚨 Showing password reset modal for user:", session.user.email);
        setShowPasswordModal(true);
      }
    }
  }, [session, status]);

  const handleCloseModal = () => {
    if (session?.user?.id) {
      const userPasswordKey = `passwordChanged_${session.user.id}`;
      localStorage.setItem(userPasswordKey, "true");
      console.log("✅ Marked password as changed for user:", session.user.email);
    }
    setShowPasswordModal(false);
  };

  if (status !== "authenticated" || !session?.user || !showPasswordModal) {
    return null;
  }

  return (
    <PasswordResetModal
      isOpen={showPasswordModal}
      onClose={handleCloseModal}
      userEmail={session.user.email}
    />
  );
}
