"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAccount } from "@/lib/data/auth";
import { currentSession, ValidationError } from "@/lib/data/repository";
import { getRepository, useDatabase } from "@/lib/data/store";
import type { AccountDraft, FieldErrors } from "@/lib/domain/validation";

const FIELDS: { name: keyof AccountDraft; label: string; type: string; autoComplete: string; hint?: string }[] = [
  { name: "name", label: "Seu nome", type: "text", autoComplete: "name" },
  { name: "email", label: "E-mail da empresa", type: "email", autoComplete: "email" },
  { name: "password", label: "Senha", type: "password", autoComplete: "new-password", hint: "Pelo menos 8 caracteres." },
  { name: "organizationName", label: "Nome da empresa", type: "text", autoComplete: "organization" },
];

export function SignUpForm() {
  const router = useRouter();
  const database = useDatabase();
  const [errors, setErrors] = useState<FieldErrors<AccountDraft>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (database && currentSession(database)) router.replace("/dashboard");
  }, [database, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const read = (name: keyof AccountDraft) => String(form.get(name) ?? "");
    setPending(true);
    setErrors({});
    setFailure(null);
    try {
      await createAccount(getRepository(), {
        name: read("name"),
        email: read("email"),
        password: read("password"),
        organizationName: read("organizationName"),
      });
      router.replace("/dashboard");
    } catch (reason) {
      if (reason instanceof ValidationError) setErrors(reason.fields as FieldErrors<AccountDraft>);
      else setFailure(reason instanceof Error ? reason.message : "Não foi possível criar a conta.");
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Card>
        <CardHeader>
          <h1 className="text-2xl">Criar conta</h1>
          <CardDescription>Com o e-mail da empresa. Você entra direto nela, com acesso de administração.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            {FIELDS.map(({ name, label, type, autoComplete, hint }) => {
              const error = errors[name];
              const describedBy = [error && `${name}-erro`, hint && `${name}-dica`].filter(Boolean).join(" ");
              return (
                <div key={name} className="grid gap-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy || undefined}
                  />
                  {hint && !error && (
                    <p id={`${name}-dica`} className="text-xs text-muted-foreground">
                      {hint}
                    </p>
                  )}
                  {error && (
                    <p id={`${name}-erro`} className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
            {failure && (
              <p role="alert" className="text-sm text-destructive">
                {failure}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Já tem conta?&nbsp;
          <Link href="/entrar" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </CardFooter>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Nesta versão, a conta fica guardada só neste navegador. Não use uma senha que você usa em outro
        lugar.
      </p>
    </div>
  );
}
