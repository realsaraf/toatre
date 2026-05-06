// Confetti burst — fires DOM particles from a pre-captured screen position.
// Throttled to once per 2 seconds globally via module-level ref.
let lastConfettiTime = 0;
const CONFETTI_COLORS = [
  "#6366F1",
  "#A78BFA",
  "#34D399",
  "#FCD34D",
  "#F472B6",
  "#60A5FA",
  "#FB923C",
];

export type ConfettiOrigin = HTMLElement | { x: number; y: number } | null | undefined;

/** Capture the center of an element synchronously. Call this at click time,
 *  before any async work, so the element is still in the DOM and laid out. */
export function captureOrigin(el: HTMLElement | null | undefined): { x: number; y: number } | undefined {
  if (!el) return undefined;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return undefined;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function fireConfetti(origin?: ConfettiOrigin) {
  const now = Date.now();
  if (now - lastConfettiTime < 2000) return;
  lastConfettiTime = now;

  const count = 28;
  let originX: number;
  let originY: number;

  if (origin && "x" in origin) {
    // Pre-captured position — most reliable, use directly.
    originX = origin.x;
    originY = origin.y;
  } else if (origin) {
    const rect = (origin as HTMLElement).getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) {
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    } else {
      // Element removed from DOM — fall back to screen bottom.
      originX = window.innerWidth / 2;
      originY = window.innerHeight * 0.82;
    }
  } else {
    originX = window.innerWidth / 2;
    originY = window.innerHeight * 0.82;
  }

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - 60;
    const size = 5 + Math.random() * 5;
    const rotation = Math.random() * 720 - 360;
    el.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      width:${size}px;height:${size}px;background:${color};
      left:${originX}px;top:${originY}px;
      transform-origin:center;
      animation:toatre-confetti 0.8s cubic-bezier(0.2,0.8,0.4,1) forwards;
      --dx:${dx}px;--dy:${dy}px;--rot:${rotation}deg;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  if (!document.getElementById("toatre-confetti-style")) {
    const styleEl = document.createElement("style");
    styleEl.id = "toatre-confetti-style";
    styleEl.textContent = `
      @keyframes toatre-confetti {
        0%   { transform: translate(0,0) rotate(0deg); opacity:1; }
        100% { transform: translate(var(--dx),calc(var(--dy) + 60px)) rotate(var(--rot)); opacity:0; }
      }
    `;
    document.head.appendChild(styleEl);
  }
}
