"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/data/auth";
import { currentSession } from "@/lib/data/repository";
import { DEMO_CREDENTIALS, DEMO_USER_ID } from "@/lib/data/seed";
import { getRepository, useDatabase } from "@/lib/data/store";

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const database = useDatabase();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Quem já está com sessão não precisa desta tela.
  useEffect(() => {
    if (database && currentSession(database)) router.replace(redirectTo);
  }, [database, redirectTo, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await signIn(getRepository(), String(form.get("email") ?? ""), String(form.get("password") ?? ""));
      router.replace(redirectTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar.");
      setPending(false);
    }
  }

  function enterDemo() {
    getRepository().startSession(DEMO_USER_ID);
    router.replace(redirectTo);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Card>
        <CardHeader>
          <h1 className="text-2xl">Entrar</h1>
          <CardDescription>Use o e-mail da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          <Button type="button" variant="outline" onClick={enterDemo}>
            Entrar na conta de demonstração
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Ou use {DEMO_CREDENTIALS.email} com a senha &quot;{DEMO_CREDENTIALS.password}&quot;.
          </p>
        </CardFooter>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Nesta versão, a conta fica guardada só neste navegador. Não use uma senha que você usa em outro
        lugar.
      </p>
    </div>
  );
}
