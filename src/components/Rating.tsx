/**
 * A drawn five-mark rating, halves included.
 *
 * Authored SVG rather than a glyph or an emoji: the marks sit inside a printed
 * band and have to carry one consistent weight with the rest of the ink.
 */
export function Rating({
  value,
  tone,
}: Readonly<{
  /** 0.5 to 5, in half steps. */
  value: number;
  /** Foreground colour of the band this sits on. */
  tone: string;
}>) {
  const marks = [1, 2, 3, 4, 5];

  return (
    <span
      className="inline-flex items-center gap-[3px]"
      role="img"
      aria-label={`${value} out of 5`}
    >
      {marks.map((mark) => {
        const fill = Math.min(Math.max(value - (mark - 1), 0), 1);
        return <Mark key={mark} fill={fill} tone={tone} />;
      })}
    </span>
  );
}

function Mark({ fill, tone }: Readonly<{ fill: number; tone: string }>) {
  const id = `m${Math.round(fill * 100)}`;
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      {/* The empty state is the same shape at 30% — never a different mark. */}
      <path
        d="M6 0.75 L7.6 4.4 L11.4 4.8 L8.5 7.4 L9.4 11.2 L6 9.2 L2.6 11.2 L3.5 7.4 L0.6 4.8 L4.4 4.4 Z"
        fill={tone}
        opacity="0.3"
      />
      {fill > 0 && (
        <>
          <defs>
            <clipPath id={id}>
              <rect x="0" y="0" width={12 * fill} height="12" />
            </clipPath>
          </defs>
          <path
            d="M6 0.75 L7.6 4.4 L11.4 4.8 L8.5 7.4 L9.4 11.2 L6 9.2 L2.6 11.2 L3.5 7.4 L0.6 4.8 L4.4 4.4 Z"
            fill={tone}
            clipPath={`url(#${id})`}
          />
        </>
      )}
    </svg>
  );
}
