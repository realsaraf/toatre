// Confetti burst — fires DOM particles from an optional anchor element.
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

export function fireConfetti(anchorEl?: HTMLElement | null) {
  const now = Date.now();
  if (now - lastConfettiTime < 2000) return;
  lastConfettiTime = now;

  const count = 28;
  const rect = anchorEl?.getBoundingClientRect();
  const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  // Default origin near the bottom of the screen where the Done button lives.
  const originY = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.82;

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
