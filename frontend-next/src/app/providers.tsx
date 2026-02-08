"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TenantConfigProvider } from "@/context/TenantConfigContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TenantConfigProvider>{children}</TenantConfigProvider>
    </AuthProvider>
  );
}
