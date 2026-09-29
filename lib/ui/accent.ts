export type AccentId = "amber" | "cyan" | "violet" | "emerald";

export const accentClasses: Record<
  AccentId,
  {
    text: string;
    border: string;
    muted: string;
    soft: string;
    solid: string;
    ring: string;
    chip: string;
    userBubble: string;
  }
> = {
  amber: {
    text: "text-accent-amber",
    border: "border-accent-amber/30",
    muted: "bg-accent-amber/10",
    soft: "hover:border-accent-amber/30 hover:bg-accent-amber/5",
    solid: "bg-accent-amber text-white hover:brightness-110",
    ring: "focus-visible:ring-accent-amber/30 focus:border-accent-amber/50",
    chip: "hover:border-accent-amber/30 hover:text-accent-amber",
    userBubble: "bg-accent-amber text-white",
  },
  cyan: {
    text: "text-accent-cyan",
    border: "border-accent-cyan/30",
    muted: "bg-accent-cyan/10",
    soft: "hover:border-accent-cyan/30 hover:bg-accent-cyan/5",
    solid: "bg-accent-cyan text-white hover:brightness-110",
    ring: "focus-visible:ring-accent-cyan/30 focus:border-accent-cyan/50",
    chip: "hover:border-accent-cyan/30 hover:text-accent-cyan",
    userBubble: "bg-accent-cyan text-white",
  },
  violet: {
    text: "text-accent-violet",
    border: "border-accent-violet/30",
    muted: "bg-accent-violet/10",
    soft: "hover:border-accent-violet/30 hover:bg-accent-violet/5",
    solid: "bg-accent-violet text-white hover:brightness-110",
    ring: "focus-visible:ring-accent-violet/30 focus:border-accent-violet/50",
    chip: "hover:border-accent-violet/30 hover:text-accent-violet",
    userBubble: "bg-accent-violet text-white",
  },
  emerald: {
    text: "text-accent-emerald",
    border: "border-accent-emerald/30",
    muted: "bg-accent-emerald/10",
    soft: "hover:border-accent-emerald/30 hover:bg-accent-emerald/5",
    solid: "bg-accent-emerald text-white hover:brightness-110",
    ring: "focus-visible:ring-accent-emerald/30 focus:border-accent-emerald/50",
    chip: "hover:border-accent-emerald/30 hover:text-accent-emerald",
    userBubble: "bg-accent-emerald text-white",
  },
};
