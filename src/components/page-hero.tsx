import { FadeIn } from "@/components/ui/animate";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export function PageHero({ eyebrow, title, description, centered = false }: PageHeroProps) {
  return (
    <section className="page-hero-bg border-b border-navy/8 pt-28 pb-14 md:pt-32 md:pb-16">
      <FadeIn className={`container-site max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
        <span className={`accent-rule mb-5 ${centered ? "mx-auto" : ""}`} aria-hidden />
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="section-title">{title}</h1>
        {description ? (
          <p className={`section-lead mt-4 max-w-2xl ${centered ? "mx-auto" : ""}`}>{description}</p>
        ) : null}
      </FadeIn>
    </section>
  );
}
