import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type Advertisement = {
  id: string;
  title: string;
  subtitle: string | null;
  badge_text: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  placement: "hero_carousel" | "sidebar_banner" | "inline_card" | "floating_bar";
  is_external: boolean;
  is_active: boolean;
  banner_type: "standard" | "direct_image";
  gradient_theme: "blue_glow" | "purple_magic" | "sunset_amber" | "emerald_pro";
  display_order: number;
  created_at: string;
};

export const DEFAULT_ADVERTISEMENTS: Advertisement[] = [
  {
    id: "default-series",
    title: "Build your rank before exam day",
    subtitle: "Full-length papers, percentile tracking, and instant analysis in one focused practice loop.",
    badge_text: "Rankdon exclusive",
    image_url: "",
    cta_text: "Explore Test Series",
    cta_link: "/?tab=packages",
    placement: "hero_carousel",
    is_external: false,
    is_active: true,
    banner_type: "standard",
    gradient_theme: "blue_glow",
    display_order: 0,
    created_at: "",
  },
  {
    id: "default-masterclass",
    title: "Exam Prep Masterclass",
    subtitle: "Turn every attempt into a smarter next attempt.",
    badge_text: "Trending",
    image_url: "",
    cta_text: "Start practicing",
    cta_link: "/?tab=free",
    placement: "sidebar_banner",
    is_external: false,
    is_active: true,
    banner_type: "standard",
    gradient_theme: "emerald_pro",
    display_order: 1,
    created_at: "",
  },
  {
    id: "default-combo",
    title: "Combo pass discounts",
    subtitle: "Unlock your next set of mock tests for less.",
    badge_text: "Special offer",
    image_url: "",
    cta_text: "View combos",
    cta_link: "/?tab=packages",
    placement: "sidebar_banner",
    is_external: false,
    is_active: true,
    banner_type: "standard",
    gradient_theme: "sunset_amber",
    display_order: 2,
    created_at: "",
  },
];

const themeStyles: Record<Advertisement["gradient_theme"], string> = {
  blue_glow: "from-[#102a43] via-[#075985] to-[#0891b2]",
  purple_magic: "from-[#271348] via-[#5b21b6] to-[#c026d3]",
  sunset_amber: "from-[#451a03] via-[#c2410c] to-[#f59e0b]",
  emerald_pro: "from-[#052e2b] via-[#047857] to-[#14b8a6]",
};

function isRenderableImageUrl(value: string | null | undefined) {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "data:";
  } catch {
    return false;
  }
}

function SafeAdImage({
  src,
  alt,
  className,
  fallbackClassName = "",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(!isRenderableImageUrl(src));

  useEffect(() => {
    setFailed(!isRenderableImageUrl(src));
  }, [src]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-950/45 text-center text-xs font-medium text-white/60 ${fallbackClassName}`}>
        Promotion image unavailable
      </div>
    );
  }

  return <img src={src!.trim()} alt={alt} className={className} onError={() => setFailed(true)} />;
}

function followAd(ad?: Advertisement) {
  const link = ad?.cta_link || "/";
  if (ad?.is_external) window.open(link, "_blank", "noopener,noreferrer");
  else window.location.href = link;
}

export function AdVisual({ ad, className = "" }: { ad: Advertisement; className?: string }) {
  if (!ad) return null;

  if (ad.banner_type === "direct_image") {
    return (
      <div className={`group/direct relative overflow-hidden bg-slate-950 ${className}`}>
        <a href={ad.cta_link || "/"} target={ad.is_external ? "_blank" : "_self"} rel="noreferrer" className="block h-full w-full">
          <SafeAdImage
            src={ad.image_url}
            alt={ad.title || "Promotion"}
            className="h-full w-full object-contain transition duration-700 ease-out group-hover/direct:scale-[1.03]"
            fallbackClassName="h-full min-h-[inherit] w-full p-8"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-white/10 opacity-80 transition-opacity duration-300 group-hover/direct:opacity-100" />
        </a>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${themeStyles[ad?.gradient_theme] ?? themeStyles.blue_glow} ${className}`}>
      {isRenderableImageUrl(ad?.image_url) && (
        <SafeAdImage src={ad.image_url} alt="" className="absolute inset-0 size-full object-cover opacity-30 mix-blend-screen" fallbackClassName="hidden" />
      )}
      <div className="absolute -right-10 -top-10 size-48 rounded-full border border-white/15 bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute bottom-0 left-1/3 size-28 rounded-full bg-cyan-300/15 blur-2xl transition-transform duration-700 group-hover:translate-x-8" />
      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white">
        <div>
          <Badge className="border-white/20 bg-white/15 text-white shadow-lg shadow-black/10 backdrop-blur-md hover:bg-white/20">{ad?.badge_text ?? "Rankdon picks"}</Badge>
          <h2 className="mt-5 max-w-xl font-display text-3xl font-extrabold tracking-tight leading-tight md:text-5xl">{ad?.title ?? "Rankdon Mock Series"}</h2>
          {ad?.subtitle && <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 md:text-base">{ad.subtitle}</p>}
        </div>
        <Button onClick={() => followAd(ad)} className="group/cta mt-8 w-fit gap-2 bg-white text-slate-950 shadow-xl shadow-black/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-50">
          {ad?.cta_text ?? "Explore now"} {ad?.is_external ? <ExternalLink className="size-4 transition-transform group-hover/cta:translate-x-0.5" /> : <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" />}
        </Button>
      </div>
    </div>
  );
}

export function HeroCarousel({ ads }: { ads: Advertisement[] }) {
  const slides = (ads ?? []).filter((ad) => ad?.placement === "hero_carousel" && ad?.is_active).sort((a, b) => (a?.display_order ?? 0) - (b?.display_order ?? 0));
  const items = slides.length ? slides : DEFAULT_ADVERTISEMENTS.filter((ad) => ad.placement === "hero_carousel");
  const [active, setActive] = useState(0);
  const pointerStart = useRef<number | null>(null);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), 6000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const move = (direction: number) => setActive((current) => (current + direction + items.length) % items.length);
const current = items[active] ?? items[0] ?? DEFAULT_ADVERTISEMENTS[0];

  return (
    <section className="group relative overflow-hidden rounded-[2rem] border border-cyan-300/30 shadow-[0_0_50px_rgba(8,145,178,0.2)] transition-transform duration-500 hover:scale-[1.01]" onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={(event) => { if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 40) move(event.clientX < pointerStart.current ? 1 : -1); pointerStart.current = null; }}>
      {current && <AdVisual ad={current} className="min-h-[390px] md:min-h-[440px]" />}
      {items.length > 1 && <>
        <div className="absolute right-5 top-5 z-20 flex gap-2">
          <button type="button" aria-label="Previous promotion" onClick={() => move(-1)} className="rounded-full border border-white/20 bg-white/10 p-2 text-white shadow-lg backdrop-blur-md transition duration-300 hover:-translate-x-0.5 hover:bg-white/20"><ArrowLeft className="size-4" /></button>
          <button type="button" aria-label="Next promotion" onClick={() => move(1)} className="rounded-full border border-white/20 bg-white/10 p-2 text-white shadow-lg backdrop-blur-md transition duration-300 hover:translate-x-0.5 hover:bg-white/20"><ArrowRight className="size-4" /></button>
        </div>
        <div className="absolute bottom-6 right-6 z-20 flex gap-2">
          {items.map((item, index) => <button key={item?.id ?? `hero-${index}`} type="button" aria-label={`Show promotion ${index + 1}`} onClick={() => setActive(index)} className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2 bg-white/40"}`} />)}
        </div>
      </>}
    </section>
  );
}

export function SidebarPromotions({ ads }: { ads: Advertisement[] }) {
  const items = (ads ?? []).filter((ad) => ad?.placement === "sidebar_banner" && ad?.is_active).sort((a, b) => (a?.display_order ?? 0) - (b?.display_order ?? 0));
  const visible = items.length ? items : DEFAULT_ADVERTISEMENTS.filter((ad) => ad.placement === "sidebar_banner");
  return <div className="space-y-4">{visible.slice(0, 3).map((ad, index) => <article key={ad?.id ?? `sidebar-${index}`} className="group relative overflow-hidden rounded-2xl border border-white/10 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-cyan-900/20"><AdVisual ad={ad} className="min-h-[210px]" />{ad.banner_type !== "direct_image" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"><div className="h-full w-[68%] animate-pulse bg-cyan-300" style={{ animationDelay: `${index * 180}ms` }} /></div>}</article>)}</div>;
}

export function PromoStrip({ ads }: { ads: Advertisement[] }) {
  const ad = (ads ?? []).find((item) => item?.placement === "floating_bar" && item?.is_active) ?? DEFAULT_ADVERTISEMENTS[0];
  if (ad?.banner_type === "direct_image") {
    return <a href={ad.cta_link || "/"} target={ad.is_external ? "_blank" : "_self"} rel="noreferrer" className="block h-20 w-full overflow-hidden bg-slate-950"><SafeAdImage src={ad.image_url} alt={ad.title || "Promotion"} className="h-full w-full object-contain" fallbackClassName="h-full w-full" /></a>;
  }
  return <button type="button" onClick={() => followAd(ad)} className="group flex w-full items-center justify-between gap-3 border-y border-cyan-200/20 bg-[#071923] px-4 py-3 text-left text-white transition hover:bg-[#0b2938]"><span className="flex items-center gap-2 text-sm font-semibold"><Zap className="size-4 text-cyan-300" />{ad?.badge_text ?? "Rankdon"}: {ad?.title ?? "Mock tests with instant analysis"}</span><span className="flex items-center gap-1 text-xs text-cyan-200">{ad?.cta_text ?? "Explore now"}<Sparkles className="size-3 transition group-hover:rotate-12" /></span></button>;
}

export function InlinePromotion({ ads }: { ads: Advertisement[] }) {
  const ad = (ads ?? []).find((item) => item?.placement === "inline_card" && item?.is_active);
  if (!ad) return null;
  return <article className="mt-6 overflow-hidden rounded-2xl border border-cyan-200/30 shadow-sm"><AdVisual ad={ad} className="min-h-[220px]" /></article>;
}