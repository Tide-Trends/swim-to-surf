"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/animate";

const reviews = [
  {
    text: "Swim lessons have been amazing for my 4 kiddos this summer. They went from crying about getting their eyes wet to full-on swimming and floating on their backs. They are so patient with the kids, but firm and direct in their instruction. I highly recommend them.",
    name: "Katie Plowman",
  },
  {
    text: "They are so patient and helped me and my children overcome the fear of the sea. So professional, knowing exactly how to teach and correct swimming skills. After five lessons, I can swim a long distance. I am really lucky to find such a good swimming coach!",
    name: "Ni Lulu",
  },
  {
    text: "My daughter learned so much better and faster with the one-on-one time. She gained so much more confidence with their firm but instructive teaching. Worth the money! I will definitely be signing her up next year and years after!",
    name: "Kelsie Stone",
  },
  {
    text: "Wonderful at teaching my 20 month old swimming lessons. After 3 weeks, she went from zero to knowing how to hold her breath, roll over to her back, and float practically on her own. We hope to come back next year!",
    name: "Tracy Heiner",
  },
  {
    text: "A five-star swimming instructor! Always on time, professional, knowledgeable, kind, and gets amazing results from these kids. We have no complaints at all.",
    name: "Kathryn Kirsi",
  },
  {
    text: "Estee was amazing with my 3 children. I have a 3, 5, and 11 year old with various skill levels. She was able to work with each of them individually and at their level. I will definitely be signing up again next summer.",
    name: "Kari Campbell",
  },
];

function NavButton({ direction, disabled, onClick }: { direction: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy/10 bg-white text-navy transition-all hover:border-navy/20 hover:shadow-soft disabled:opacity-30"
      aria-label={direction === "left" ? "Previous review" : "Next review"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {direction === "left" ? (
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    const cardWidth = clientWidth * 0.85 + 24;
    const idx = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, reviews.length - 1));
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollRef.current.clientWidth * 0.8 : scrollRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-pad bg-cream">
      <div className="container-site mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
        <FadeIn>
          <span className="accent-rule mb-5" aria-hidden />
          <p className="eyebrow mb-3">Reviews</p>
          <h2 className="section-title">Families trust us.</h2>
        </FadeIn>
        <div className="flex gap-2">
          <NavButton direction="left" disabled={!canScrollLeft} onClick={() => scroll("left")} />
          <NavButton direction="right" disabled={!canScrollRight} onClick={() => scroll("right")} />
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="container-site flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:gap-6"
      >
        {reviews.map((review, i) => (
          <motion.article
            key={review.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="surface-card-interactive relative snap-center w-[85vw] shrink-0 p-7 md:w-[26rem] md:p-8"
          >
            <span className="font-display text-5xl leading-none text-gold/30" aria-hidden>
              &ldquo;
            </span>
            <div className="mb-4 flex gap-0.5 text-gold">★★★★★</div>
            <p className="mb-6 text-sm leading-relaxed text-body md:text-base">&ldquo;{review.text}&rdquo;</p>
            <p className="border-t border-navy/8 pt-4 text-sm font-semibold text-navy">{review.name}</p>
          </motion.article>
        ))}
      </div>

      <div className="container-site mt-6 flex justify-center gap-2">
        {reviews.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-7 bg-deep" : "w-1.5 bg-navy/12"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
