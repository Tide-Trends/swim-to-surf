"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setAdminSession, type InstructorSlug } from "@/lib/instructor-content";

const CREDENTIALS: Record<InstructorSlug, string> = {
  lukaah: "10302007",
  estee: "07092004",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const normalized = username.trim().toLowerCase();
    const isLukaah = normalized === "lukaah";
    const isEstee = normalized === "estee";

    if (!isLukaah && !isEstee) {
      setError("Username must be Lukaah or Estee.");
      setLoading(false);
      return;
    }

    const role = (isLukaah ? "lukaah" : "estee") as InstructorSlug;
    if (CREDENTIALS[role] !== password) {
      setError("Incorrect password.");
      setLoading(false);
      return;
    }

    setAdminSession(role);
    router.push("/admin");
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-warm-white">
      <div className="w-full max-w-md px-6">
        <h1 className="text-3xl font-display font-bold text-dark text-center mb-2">
          Admin Login
        </h1>
        <p className="text-muted text-center font-ui mb-8">
          Sign in to manage bookings and instructor profile content.
        </p>
        <p className="text-xs text-muted text-center font-ui mb-6">
          Username: <strong>Lukaah</strong> or <strong>Estee</strong>
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Lukaah or Estee"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error && <p className="text-error text-sm font-ui">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign In
          </Button>
        </form>
      </div>
    </section>
  );
}
