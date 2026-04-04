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
    <div className="border-b border-black/5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-6 md:py-8 text-left cursor-pointer group"
        aria-expanded={open}
      >
        <h3 className="text-xl md:text-2xl font-display font-medium text-[#1D1D1F] tracking-tight pr-8 group-hover:text-black transition-colors duration-300">
          {title}
        </h3>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] flex-shrink-0 group-hover:bg-[#E8E8ED] transition-colors"
        >
          <span className="text-xl leading-none mt-[-2px]">+</span>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-8 text-[#86868B] text-lg leading-relaxed font-body max-w-3xl font-light">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
