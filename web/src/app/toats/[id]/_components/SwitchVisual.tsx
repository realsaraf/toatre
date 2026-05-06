import { toggleStyles } from "../_styles";

export function SwitchVisual({ on }: { on: boolean }) {
  return (
    <span
      style={{
        ...toggleStyles.switchBase,
        background: on ? "linear-gradient(135deg, #7C3AED, #5B3DF5)" : "rgba(209,213,219,0.8)",
      }}
    >
      <span
        style={{
          ...toggleStyles.switchThumb,
          transform: on ? "translateX(19px)" : "translateX(0)",
        }}
      />
    </span>
  );
}
