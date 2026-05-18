import type { CSSProperties } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  markdown: string;
  tone?: "detail" | "share";
}

const themeByTone = {
  detail: {
    text: "#111827",
    muted: "#6B7280",
    heading: "#0F172A",
    link: "#6D28D9",
    quoteBg: "rgba(109,40,217,0.08)",
    quoteBorder: "rgba(109,40,217,0.18)",
    codeBg: "rgba(15,23,42,0.06)",
  },
  share: {
    text: "#374151",
    muted: "#6B7280",
    heading: "#111827",
    link: "#BE7716",
    quoteBg: "rgba(190,119,22,0.08)",
    quoteBorder: "rgba(190,119,22,0.18)",
    codeBg: "rgba(190,119,22,0.08)",
  },
} as const;

export function MarkdownRenderer({ markdown, tone = "detail" }: MarkdownRendererProps) {
  const theme = themeByTone[tone];

  const rootStyle: CSSProperties = {
    color: theme.text,
    fontSize: 14.5,
    lineHeight: 1.75,
    overflowWrap: "anywhere",
  };

  const components: Components = {
    p: ({ children }) => <p style={{ margin: "0 0 12px" }}>{children}</p>,
    ul: ({ children }) => (
      <ul style={{ margin: "0 0 12px", paddingLeft: 20, display: "grid", gap: 6 }}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol style={{ margin: "0 0 12px", paddingLeft: 20, display: "grid", gap: 6 }}>
        {children}
      </ol>
    ),
    li: ({ children }) => <li style={{ margin: 0 }}>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote
        style={{
          margin: "0 0 12px",
          padding: "10px 12px",
          borderLeft: `3px solid ${theme.quoteBorder}`,
          background: theme.quoteBg,
          color: theme.muted,
          borderRadius: 10,
        }}
      >
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: theme.link, fontWeight: 700, textDecoration: "underline" }}
      >
        {children}
      </a>
    ),
    h1: ({ children }) => (
      <h1 style={{ margin: "0 0 12px", fontSize: 22, lineHeight: 1.2, color: theme.heading }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ margin: "0 0 10px", fontSize: 18, lineHeight: 1.25, color: theme.heading }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ margin: "0 0 10px", fontSize: 16, lineHeight: 1.3, color: theme.heading }}>
        {children}
      </h3>
    ),
    hr: () => <hr style={{ margin: "14px 0", border: 0, borderTop: `1px solid ${theme.quoteBorder}` }} />,
    code: ({ children }) => (
      <code
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "0.92em",
          padding: "0.12em 0.35em",
          borderRadius: 6,
          background: theme.codeBg,
        }}
      >
        {children}
      </code>
    ),
  };

  return (
    <div style={rootStyle}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}