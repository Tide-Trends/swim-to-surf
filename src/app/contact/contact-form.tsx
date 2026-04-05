"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Please write at least a short message"),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErrorMessage(payload.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      reset();
    } catch {
      setErrorMessage("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-success/10 border-2 border-success/30 rounded-2xl p-8 text-center">
        <p className="font-display text-xl font-bold text-dark mb-2">Message sent!</p>
        <p className="text-muted">We&rsquo;ll get back to you as soon as we can.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input label="Name" placeholder="Your full name" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" placeholder="your@email.com" error={errors.email?.message} {...register("email")} />
      <Input label="Phone (optional)" type="tel" placeholder="(385) 000-0000" {...register("phone")} />
      <Textarea label="Message" placeholder="Tell us what's on your mind..." error={errors.message?.message} {...register("message")} />
      <Button
        type="submit"
        loading={status === "loading"}
        size="lg"
        className="w-full rounded-full py-6 text-lg font-bold uppercase tracking-wider"
      >
        Send Message
      </Button>
      {status === "error" && errorMessage && (
        <p className="text-center font-ui text-sm text-error">{errorMessage}</p>
      )}
    </form>
  );
}
