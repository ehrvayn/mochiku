export type Tone = {
  key: "urgent" | "soon" | "calm";
  label: string;
  box: string; 
  text: string; 
  bar: string; 
  hero: string; 
  heroText: string;
  heroSub: string;
};

const STYLES = {
  urgent: {
    key: "urgent",
    box: "bg-urgent-soft",
    text: "text-urgent-ink",
    bar: "bg-urgent",
    hero: "bg-urgent",
    heroText: "text-white",
    heroSub: "text-white",
  },
  soon: {
    key: "soon",
    box: "bg-soon-soft",
    text: "text-soon-ink",
    bar: "bg-soon",
    hero: "bg-soon",
    heroText: "text-ink",
    heroSub: "text-ink",
  },
  calm: {
    key: "calm",
    box: "bg-calm-soft",
    text: "text-ink",
    bar: "bg-calm",
    hero: "bg-calm",
    heroText: "text-ink",
    heroSub: "text-ink",
  },
} as const;

export function getTone(days: number): Tone {
  const label =
    days < 0
      ? `Overdue by ${-days} ${-days === 1 ? "day" : "days"}`
      : days === 0
        ? "Due today"
        : days === 1
          ? "Due tomorrow"
          : `${days} days left`;

  const style = days <= 1 ? STYLES.urgent : days <= 7 ? STYLES.soon : STYLES.calm;
  return { ...style, label };
}

export const softShadow = {
  shadowColor: "#2B2438",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;