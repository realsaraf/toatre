/**
 * ToatreMark — SVG wordmark component.
 * Renders "toatre" in a linear gradient matching the brand colours.
 * Use in headers, splash screens, and marketing surfaces.
 */

interface ToatreMarkProps {
  /** Width in pixels (height scales proportionally). Default: 120 */
  width?: number;
  /** CSS class names to add to the outer <svg> element */
  className?: string;
}

export function ToatreMark({ width = 120, className = "" }: ToatreMarkProps) {
  // Aspect ratio of the wordmark text (approximate)
  const height = Math.round(width * 0.28);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="toatre"
      role="img"
      className={className}
    >
      <defs>
        <linearGradient
          id="toatre-mark-gradient"
          x1="0"
          y1="0"
          x2="120"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* "toatre" rendered as a text element with Inter SemiBold */}
      <text
        x="0"
        y="27"
        fontFamily="Inter, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="28"
        fill="url(#toatre-mark-gradient)"
        letterSpacing="-0.5"
      >
        toatre
      </text>
    </svg>
  );
}
