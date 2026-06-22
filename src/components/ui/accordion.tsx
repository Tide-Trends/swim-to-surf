"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-navy/8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left md:py-6"
        aria-expanded={open}
      >
        <h3 className="pr-4 font-display text-lg text-navy transition-colors group-hover:text-water md:text-xl">
          {title}
        </h3>
        <motion.span
          animate={{ rotate: open ? 45 : 0, backgroundColor: open ? "rgba(8, 145, 178, 0.12)" : "rgba(240, 235, 227, 1)" }}
          transition={{ duration: 0.25 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-navy"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="max-w-3xl pb-6 text-sm leading-relaxed text-body md:text-base">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
