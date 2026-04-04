"use client";

import { AccordionItem } from "@/components/ui/accordion";

interface FaqAccordionProps {
  faqs: { question: string; answer: string }[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  return (
    <div>
      {faqs.map((faq, i) => (
        <AccordionItem key={i} title={faq.question} defaultOpen={i === 0}>
          <p>{faq.answer}</p>
        </AccordionItem>
      ))}
    </div>
  );
}
