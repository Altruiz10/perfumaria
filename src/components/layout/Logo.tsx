export function Logo({
  sub,
  inverted = false,
  compact = false,
}: {
  sub?: string;
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <span className={`flex flex-col items-center leading-none ${inverted ? "text-on-dark" : "text-ink"}`}>
      <span className={`font-serif tracking-[0.18em] uppercase ${compact ? "text-lg" : "text-[1.35rem] md:text-[1.75rem]"}`}>
        Homem <span className="text-gold italic">&amp;</span> Mulher
      </span>
      {!compact && sub && (
        <span className="mt-1.5 text-[0.52rem] tracking-[0.5em] uppercase opacity-70 md:text-[0.58rem]">
          {sub}
        </span>
      )}
    </span>
  );
}
