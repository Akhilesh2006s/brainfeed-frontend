export type CategoryTheme = {
  pillBg: string;
  pillText: string;
  listBg: string;
  listText: string;
  overlayBg: string;
  overlayText: string;
  metaBg: string;
  metaText: string;
  imageWrap: string;
  imageBorder: string;
};

function normalizeCategory(category: string) {
  return (category || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DEFAULT_THEME: CategoryTheme = {
  pillBg: "bg-accent/10",
  pillText: "text-accent",
  listBg: "bg-accent/5",
  listText: "text-accent",
  overlayBg: "bg-accent/15",
  overlayText: "text-accent",
  metaBg: "bg-accent/10",
  metaText: "text-accent",
  imageWrap: "bg-gradient-to-br from-accent/15 via-transparent to-accent/0",
  imageBorder: "border-border/60",
};

export function getCategoryTheme(category: string): CategoryTheme {
  const key = normalizeCategory(category);

  if (key === "all") {
    return {
      ...DEFAULT_THEME,
      pillBg: "bg-accent",
      pillText: "text-accent-foreground",
    };
  }
  if (key.includes("expert")) {
    return {
      pillBg: "bg-sky-100",
      pillText: "text-sky-800",
      listBg: "bg-sky-50",
      listText: "text-sky-800",
      overlayBg: "bg-sky-100/90",
      overlayText: "text-sky-800",
      metaBg: "bg-sky-100",
      metaText: "text-sky-800",
      imageWrap: "bg-gradient-to-br from-sky-500/10 via-transparent to-sky-500/0",
      imageBorder: "border-sky-200/70",
    };
  }
  if (key.includes("technology") || key.includes("tech")) {
    return {
      pillBg: "bg-emerald-100",
      pillText: "text-emerald-800",
      listBg: "bg-emerald-50",
      listText: "text-emerald-800",
      overlayBg: "bg-emerald-100/90",
      overlayText: "text-emerald-800",
      metaBg: "bg-emerald-100",
      metaText: "text-emerald-800",
      imageWrap: "bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/0",
      imageBorder: "border-emerald-200/70",
    };
  }
  if (key.includes("parent")) {
    return {
      pillBg: "bg-rose-100",
      pillText: "text-rose-800",
      listBg: "bg-rose-50",
      listText: "text-rose-800",
      overlayBg: "bg-rose-100/90",
      overlayText: "text-rose-800",
      metaBg: "bg-rose-100",
      metaText: "text-rose-800",
      imageWrap: "bg-gradient-to-br from-rose-500/10 via-transparent to-rose-500/0",
      imageBorder: "border-rose-200/70",
    };
  }
  if (key.includes("press")) {
    return {
      pillBg: "bg-teal-100",
      pillText: "text-teal-800",
      listBg: "bg-teal-50",
      listText: "text-teal-800",
      overlayBg: "bg-teal-100/90",
      overlayText: "text-teal-800",
      metaBg: "bg-teal-100",
      metaText: "text-teal-800",
      imageWrap: "bg-gradient-to-br from-teal-500/10 via-transparent to-teal-500/0",
      imageBorder: "border-teal-200/70",
    };
  }
  if (key.includes("policy")) {
    return {
      pillBg: "bg-violet-100",
      pillText: "text-violet-800",
      listBg: "bg-violet-50",
      listText: "text-violet-800",
      overlayBg: "bg-violet-100/90",
      overlayText: "text-violet-800",
      metaBg: "bg-violet-100",
      metaText: "text-violet-800",
      imageWrap: "bg-gradient-to-br from-violet-500/10 via-transparent to-violet-500/0",
      imageBorder: "border-violet-200/70",
    };
  }
  if (key.includes("education") || key.includes("edu")) {
    return {
      pillBg: "bg-amber-100",
      pillText: "text-amber-800",
      listBg: "bg-amber-50",
      listText: "text-amber-800",
      overlayBg: "bg-amber-100/90",
      overlayText: "text-amber-800",
      metaBg: "bg-amber-100",
      metaText: "text-amber-800",
      imageWrap: "bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/0",
      imageBorder: "border-amber-200/70",
    };
  }
  if (key.includes("achievement")) {
    return {
      pillBg: "bg-orange-100",
      pillText: "text-orange-900",
      listBg: "bg-orange-50",
      listText: "text-orange-900",
      overlayBg: "bg-orange-100/90",
      overlayText: "text-orange-900",
      metaBg: "bg-orange-100",
      metaText: "text-orange-900",
      imageWrap: "bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/0",
      imageBorder: "border-orange-200/70",
    };
  }
  if (key.includes("science") || key.includes("environment")) {
    return {
      pillBg: "bg-lime-100",
      pillText: "text-lime-900",
      listBg: "bg-lime-50",
      listText: "text-lime-900",
      overlayBg: "bg-lime-100/90",
      overlayText: "text-lime-900",
      metaBg: "bg-lime-100",
      metaText: "text-lime-900",
      imageWrap: "bg-gradient-to-br from-lime-500/10 via-transparent to-lime-500/0",
      imageBorder: "border-lime-200/70",
    };
  }
  if (key.includes("career") || key.includes("internship") || key.includes("job")) {
    return {
      pillBg: "bg-cyan-100",
      pillText: "text-cyan-900",
      listBg: "bg-cyan-50",
      listText: "text-cyan-900",
      overlayBg: "bg-cyan-100/90",
      overlayText: "text-cyan-900",
      metaBg: "bg-cyan-100",
      metaText: "text-cyan-900",
      imageWrap: "bg-gradient-to-br from-cyan-500/10 via-transparent to-cyan-500/0",
      imageBorder: "border-cyan-200/70",
    };
  }
  if (key.includes("institutional")) {
    return {
      pillBg: "bg-indigo-100",
      pillText: "text-indigo-900",
      listBg: "bg-indigo-50",
      listText: "text-indigo-900",
      overlayBg: "bg-indigo-100/90",
      overlayText: "text-indigo-900",
      metaBg: "bg-indigo-100",
      metaText: "text-indigo-900",
      imageWrap: "bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/0",
      imageBorder: "border-indigo-200/70",
    };
  }

  return DEFAULT_THEME;
}

export function getCategoryPillClass(category: string) {
  const t = getCategoryTheme(category);
  return `${t.pillBg} ${t.pillText}`;
}

/** Date / read-time pills — same palette as category (metaBg + metaText). */
export function getCategoryMetaPillClass(category: string) {
  const t = getCategoryTheme(category);
  return `${t.metaBg} ${t.metaText}`;
}
