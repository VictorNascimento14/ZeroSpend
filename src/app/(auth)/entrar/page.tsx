import type { Metadata } from "next";
import { safeRedirectPath } from "@/components/auth/safe-redirect";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const { para } = await searchParams;
  return <SignInForm redirectTo={safeRedirectPath(para)} />;
}
