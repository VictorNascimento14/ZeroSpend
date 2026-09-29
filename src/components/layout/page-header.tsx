/** O topo de cada página: o título (H4 do kit) e a frase que diz para que ela serve. */
export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </header>
  );
}
