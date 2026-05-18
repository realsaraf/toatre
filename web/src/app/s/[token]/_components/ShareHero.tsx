import { s } from "./_styles";

interface ShareHeroProps {
  ownerName: string;
}

export function ShareHero({ ownerName }: ShareHeroProps) {
  return (
    <div style={s.sharedByBar}>
      <span style={s.sharedByAvatar} aria-hidden>
        {ownerName.charAt(0).toUpperCase()}
      </span>
      <span style={s.sharedByText}>{ownerName} shared this with you</span>
    </div>
  );
}
