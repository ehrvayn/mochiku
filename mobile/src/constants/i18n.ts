export type MascotLang = "en" | "tl";

export const MASCOT_LANGS: { code: MascotLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "tl", label: "Tagalog" },
];

export function isMascotLang(value: unknown): value is MascotLang {
  return value === "en" || value === "tl";
}

export type MascotMessages = {
  greet: (text: string) => string;
  heroToday: string;
  heroTomorrow: string;
  overdue: (count: number) => string;
  pending: (count: number) => string;
  week: (count: number) => string;
  heroIdle: (days: number) => string;
  empty: () => string;
  profileGreeting: (name: string) => string;
};

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const EN: Omit<MascotMessages, "greet"> = {
  heroToday: "clock's ticking! Something needs your attention today.",
  heroTomorrow: "heads up! You have a deadline landing tomorrow.",
  overdue: (count) =>
    count === 1
      ? "one item slipped past. Let's clear it out first!"
      : `${count} items slipped past. Let's clear them out first!`,
  pending: (count) =>
    count === 1
      ? "I spotted one photo with fuzzy details. Mind double-checking?"
      : `I spotted ${count} photos with fuzzy details. Mind double-checking?`,
  week: (count) =>
    count === 1
      ? "looking solid! One item scheduled for this week."
      : `looking solid! ${count} items scheduled for this week.`,
  heroIdle: (days) =>
    `smooth sailing! Nothing urgent until ${days} ${
      days === 1 ? "day" : "days"
    } from now.`,
  empty: () => "no deadlines coming up. Snap a photo and I'll catch the dates!",
  profileGreeting: (name) =>
    `Hi, ${name}. I'm Mochiku and I keep your shelf tidy.`,
};

const TL: Omit<MascotMessages, "greet"> = {
  heroToday: `Hello paalala! May kailangan kang asikasuhin ngayong araw.`,
  heroTomorrow: "paalala: may deadline ka bukas.",
  overdue: (count) =>
    count === 1
      ? "may isang item ka nalampasan. Linisin na natin 'yan!"
      : `may ${count} item ka nalampasan. Linisin na natin ang mga 'yan!`,
  pending: (count) =>
    count === 1
      ? "may isang larawan akong di masyadong maintindihan. Pwede pa double check?"
      : `may ${count} larawan akong di masyadong maintindihan. Pwede pa double check?`,
  week: (count) =>
    count === 1
      ? "maganda ngayun ang takbo! May isang item ka na nakatakda ngayong linggo."
      : `maganda ngayun ang takbo! May ${count} item ka na nakatakda ngayong linggo.`,
  heroIdle: (days) =>
    `relax ka lang! Walang kailangang asikasuhin hanggang ${days} ${
      days === 1 ? "araw" : "araw"
    } mula ngayon.`,
  empty: () =>
    "walang paparating na deadline. Mag take ka ng picture, ako na ang bahala kung may deadline!",
  profileGreeting: (name) =>
    `Kumusta, ${name}. Ako si Mochiku, ako bahala sa mga importanting bagay sa photos mo.`,
};

const BODY: Record<MascotLang, Omit<MascotMessages, "greet">> = {
  en: EN,
  tl: TL,
};

export function mascotMessages(
  lang: MascotLang,
  name: string | null | undefined,
): MascotMessages {
  const body = BODY[lang] ?? EN;
  const hasName = !!name?.trim();

  const greet = (text: string) => {
    if (!hasName) return cap(text);
    if (lang === "tl") return `Kumusta, ${name!.trim()}. ${cap(text)}`;
    return `Hey ${name!.trim()}, ${text}`;
  };

  return { ...body, greet };
}
