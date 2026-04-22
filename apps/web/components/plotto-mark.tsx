type PlottoMarkProps = {
  className?: string;
  title?: string;
};

export default function PlottoMark({
  className = 'h-8 w-8',
  title,
}: PlottoMarkProps) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? 'img' : 'presentation'}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      {labelled ? <title>{title}</title> : null}
      <rect
        x="5"
        y="5"
        width="54"
        height="54"
        rx="17"
        fill="#fbf8f4"
        stroke="#0e0c0b"
        strokeWidth="2.5"
      />
      <path
        d="M23.5 14.5V49.5"
        stroke="#ef4a27"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M23.5 18.5H34C40.351 18.5 45 23.149 45 30C45 36.851 40.351 41.5 34 41.5H23.5"
        stroke="#ef4a27"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.5" cy="14.5" r="4.5" fill="#ef4a27" />
      <circle cx="23.5" cy="49.5" r="4.5" fill="#0e0c0b" />
    </svg>
  );
}