"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { SignupCard } from "@/components/account-gate";

function LoginInner() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("redirect") ?? "/account";

  useEffect(() => {
    if (user) router.push(next.startsWith("/") ? next : "/account");
  }, [user, next, router]);

  return (
    <section className="section container" style={{ maxWidth: 960 }}>
      <SignupCard tool="shoes" initialMode="sign-in" unlocks="every tool's full results" />
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
