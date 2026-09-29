/** A marca do ZeroSpend: monograma na cor primária e o nome. */
export function Brand() {
  return (
    <span className="flex items-center gap-2 font-semibold">
      <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        Z
      </span>
      ZeroSpend
    </span>
  );
}
