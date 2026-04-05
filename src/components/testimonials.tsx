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
    
    // Calculate active dot based on scroll position
    const cardWidth = clientWidth * 0.85 + 24; // 85vw card + gap on mobile, approximate
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
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth * 0.85 + 24;
    scrollRef.current.scrollTo({
      left: cardWidth * index,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative bg-[#F7F8FA] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <span className="font-ui text-[10px] font-semibold text-[#86868B] uppercase tracking-[0.2em] mb-4 block">
                Words from families
              </span>
              <h2 className="text-5xl md:text-7xl font-display text-[#1D1D1F] tracking-tight">
                Stories of <span className="text-[#86868B]">confidence.</span>
              </h2>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-14 h-14 rounded-full border border-black/10 text-[#1D1D1F] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white cursor-pointer hover:shadow-md"
                aria-label="Previous testimonials"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-14 h-14 rounded-full border border-black/10 text-[#1D1D1F] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white cursor-pointer hover:shadow-md"
                aria-label="Next testimonials"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="relative">
        {/* Swipe hint - fades in on mobile */}
        <div className="md:hidden absolute top-1/2 right-4 -translate-y-1/2 z-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0.8, x: 0 }}
            animate={{ opacity: [0.8, 0.3, 0.8], x: [0, 8, 0] }}
            transition={{ duration: 2, repeat: 3, ease: "easeInOut" }}
            className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-ui px-3 py-1.5 rounded-full"
          >
            Swipe
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-6 md:px-8 xl:px-[calc((100vw-1280px)/2+32px)]"
        >
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="snap-center flex-shrink-0 w-[85vw] md:w-[450px]"
            >
              <div className="bg-white rounded-[2rem] p-10 md:p-12 h-full flex flex-col border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-500">
                <div className="flex gap-1.5 mb-8">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#1D1D1F]/80 leading-relaxed flex-1 text-lg font-body font-light mb-8">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-4 border-t border-black/5 pt-6">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] font-display">
                    {review.name.charAt(0)}
                  </div>
                  <p className="font-ui font-semibold uppercase tracking-widest text-xs text-[#1D1D1F]">{review.name}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to review ${i + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex
                  ? "w-8 h-2.5 bg-[#1D1D1F]"
                  : "w-2.5 h-2.5 bg-[#1D1D1F]/20 hover:bg-[#1D1D1F]/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
