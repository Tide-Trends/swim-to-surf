"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  candidateAdminMonths,
  defaultAvailabilitySettings,
  monthLabel,
  type AvailabilitySettings,
  type EsteeMonthAvailability,
  type EsteeMonthHours,
  type LukaahBlackout,
} from "@/lib/availability-settings";
import { getEsteeDatesForMonth } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

function emptyMonth(): EsteeMonthAvailability {
  return { open: false, hours: { mode: "default" } };
}

function hoursMode(m: EsteeMonthAvailability | undefined): EsteeMonthHours["mode"] {
  return m?.hours?.mode ?? "default";
}

export function AvailabilityEditor() {
  const [settings, setSettings] = useState<AvailabilitySettings>(() => defaultAvailabilitySettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationHint, setMigrationHint] = useState<string | null>(null);
  const [instructor, setInstructor] = useState<"estee" | "lukaah">("estee");

  const months = useMemo(() => candidateAdminMonths(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/availability", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setSettings(data as AvailabilitySettings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load availability");
      setSettings(defaultAvailabilitySettings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patchEsteeMonth(ym: string, patch: Partial<EsteeMonthAvailability>) {
    setSaved(false);
    setSettings((prev) => {
      const current = prev.estee.months[ym] ?? emptyMonth();
      return {
        ...prev,
        estee: {
          months: {
            ...prev.estee.months,
            [ym]: { ...current, ...patch },
          },
        },
      };
    });
  }

  function setHoursPreset(ym: string, mode: EsteeMonthHours["mode"]) {
    let hours: EsteeMonthHours;
    if (mode === "continuous") {
      hours = { mode: "continuous", start: "11:30", end: "17:00" };
    } else if (mode === "split") {
      hours = {
        mode: "split",
        amStart: "08:00",
        amEnd: "11:30",
        pmStart: "12:30",
        pmEnd: "17:00",
      };
    } else {
      hours = { mode: "default" };
    }
    patchEsteeMonth(ym, { hours });
  }

  function openMonthQuick(ym: string) {
    const existing = settings.estee.months[ym];
    patchEsteeMonth(ym, {
      open: true,
      emphasize: existing?.emphasize ?? true,
      hours: existing?.hours ?? { mode: "default" },
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMigrationHint(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (typeof data.migrationHint === "string") setMigrationHint(data.migrationHint);
        throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      }
      setSettings(data as AvailabilitySettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateBlackout(index: number, patch: Partial<LukaahBlackout>) {
    setSaved(false);
    setSettings((prev) => {
      const blackouts = [...prev.lukaah.blackouts];
      blackouts[index] = { ...blackouts[index]!, ...patch };
      return { ...prev, lukaah: { ...prev.lukaah, blackouts } };
    });
  }

  function addBlackout() {
    setSaved(false);
    setSettings((prev) => ({
      ...prev,
      lukaah: {
        ...prev.lukaah,
        blackouts: [...prev.lukaah.blackouts, { start: "", end: "", note: "" }],
      },
    }));
  }

  function removeBlackout(index: number) {
    setSaved(false);
    setSettings((prev) => ({
      ...prev,
      lukaah: {
        ...prev.lukaah,
        blackouts: prev.lukaah.blackouts.filter((_, i) => i !== index),
      },
    }));
  }

  if (loading) {
    return (
      <div className="admin-panel p-12 text-center">
        <p className="font-ui text-body">Loading availability…</p>
      </div>
    );
  }

  return (
    <div className="admin-panel p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 font-display text-2xl text-navy">Availability</h2>
          <p className="max-w-2xl font-ui text-sm text-body">
            Open months or extend the weekly season so parents can book them. Changes save for the whole site
            (not just this browser).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={saving}>
            Reload
          </Button>
          <Button size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save availability"}
          </Button>
          {saved && <span className="font-ui text-sm text-success">Saved</span>}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          <strong className="font-semibold">Could not save. </strong>
          {error}
          {migrationHint && <p className="mt-2 text-red-800">{migrationHint}</p>}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {(["estee", "lukaah"] as const).map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => setInstructor(slug)}
            className={`rounded-lg px-4 py-2 font-ui text-sm font-semibold capitalize ${
              instructor === slug ? "bg-navy text-white" : "border border-navy/12 bg-white text-body"
            }`}
          >
            {slug}
          </button>
        ))}
      </div>

      {instructor === "estee" && (
        <div className="space-y-4">
          <p className="font-ui text-sm text-body">
            Toggle a month open to show it on the booking form. Use continuous hours for blocks like September
            11:30 AM–5:00 PM.
          </p>
          {months.map((ym) => {
            const meta = settings.estee.months[ym] ?? emptyMonth();
            const dates = getEsteeDatesForMonth(ym, settings);
            const mode = hoursMode(meta);
            return (
              <div
                key={ym}
                className={`rounded-xl border p-4 md:p-5 ${
                  meta.open ? "border-[#0077B6]/35 bg-[#E8F4FD]/40" : "border-navy/10 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-navy">{monthLabel(ym)}</p>
                    <p className="mt-0.5 font-ui text-xs text-body">
                      {dates.wednesdays.length} Wed · {dates.thursdays.length} Thu
                      {meta.open ? " · bookable" : " · closed"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {!meta.open && (
                      <Button type="button" size="sm" variant="outline" onClick={() => openMonthQuick(ym)}>
                        Open month
                      </Button>
                    )}
                    <Toggle
                      checked={Boolean(meta.open)}
                      onChange={(open) => patchEsteeMonth(ym, { open })}
                      label="Open for booking"
                    />
                  </div>
                </div>

                {meta.open && (
                  <div className="mt-4 space-y-4 border-t border-navy/10 pt-4">
                    <Toggle
                      checked={Boolean(meta.emphasize)}
                      onChange={(emphasize) => patchEsteeMonth(ym, { emphasize })}
                      label="Emphasize in month picker"
                      description="Blue highlight + Open badge so it doesn’t look greyed out"
                    />

                    <div>
                      <p className="mb-2 font-ui text-xs font-bold uppercase tracking-wide text-deep">Hours</p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["default", "Default (AM + PM)"],
                            ["continuous", "Continuous (e.g. 11:30–5)"],
                            ["split", "Custom split"],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setHoursPreset(ym, value)}
                            className={`rounded-lg border px-3 py-2 font-ui text-xs font-semibold ${
                              mode === value
                                ? "border-navy bg-navy text-white"
                                : "border-navy/12 bg-white text-body hover:border-navy/25"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {mode === "continuous" && meta.hours?.mode === "continuous" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="Start (24h HH:mm)"
                          value={meta.hours.start}
                          onChange={(e) => {
                            const hours = meta.hours;
                            if (hours?.mode !== "continuous") return;
                            patchEsteeMonth(ym, {
                              hours: { mode: "continuous", start: e.target.value, end: hours.end },
                            });
                          }}
                        />
                        <Input
                          label="End (24h HH:mm)"
                          value={meta.hours.end}
                          onChange={(e) => {
                            const hours = meta.hours;
                            if (hours?.mode !== "continuous") return;
                            patchEsteeMonth(ym, {
                              hours: { mode: "continuous", start: hours.start, end: e.target.value },
                            });
                          }}
                        />
                      </div>
                    )}

                    {mode === "split" && meta.hours?.mode === "split" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="AM start"
                          value={meta.hours.amStart}
                          onChange={(e) => {
                            const hours = meta.hours;
                            if (hours?.mode !== "split") return;
                            patchEsteeMonth(ym, { hours: { ...hours, amStart: e.target.value } });
                          }}
                        />
                        <Input
                          label="AM end"
                          value={meta.hours.amEnd}
                          onChange={(e) => {
                            const hours = meta.hours;
                            if (hours?.mode !== "split") return;
                            patchEsteeMonth(ym, { hours: { ...hours, amEnd: e.target.value } });
                          }}
                        />
                        <Input
                          label="PM start"
                          value={meta.hours.pmStart}
                          onChange={(e) => {
                            const hours = meta.hours;
                            if (hours?.mode !== "split") return;
                            patchEsteeMonth(ym, { hours: { ...hours, pmStart: e.target.value } });
                          }}
                        />
                        <Input
                          label="PM end"
                          value={meta.hours.pmEnd}
                          onChange={(e) => {
                            const hours = meta.hours;
                            if (hours?.mode !== "split") return;
                            patchEsteeMonth(ym, { hours: { ...hours, pmEnd: e.target.value } });
                          }}
                        />
                      </div>
                    )}

                    <Input
                      label="Exclude Wednesdays (YYYY-MM-DD, comma-separated)"
                      value={(meta.excludeWednesdays ?? []).join(", ")}
                      onChange={(e) =>
                        patchEsteeMonth(ym, {
                          excludeWednesdays: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="2026-09-30"
                    />
                    <Input
                      label="Exclude Thursdays (YYYY-MM-DD, comma-separated)"
                      value={(meta.excludeThursdays ?? []).join(", ")}
                      onChange={(e) =>
                        patchEsteeMonth(ym, {
                          excludeThursdays: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                    <Input
                      label="Note shown on booking form"
                      value={meta.note ?? ""}
                      onChange={(e) => patchEsteeMonth(ym, { note: e.target.value || undefined })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {instructor === "lukaah" && (
        <div className="space-y-5">
          <p className="font-ui text-sm text-body">
            Extend the weekly season end date to open more Mon–Fri weeks. Blackout ranges hide weeks when
            Lukaah is away.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Season start (YYYY-MM-DD)"
              value={settings.lukaah.seasonStart}
              onChange={(e) => {
                setSaved(false);
                setSettings((prev) => ({
                  ...prev,
                  lukaah: { ...prev.lukaah, seasonStart: e.target.value },
                }));
              }}
            />
            <Input
              label="Season end (YYYY-MM-DD)"
              value={settings.lukaah.seasonEnd}
              onChange={(e) => {
                setSaved(false);
                setSettings((prev) => ({
                  ...prev,
                  lukaah: { ...prev.lukaah, seasonEnd: e.target.value },
                }));
              }}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-ui text-sm font-semibold text-navy">Blackout ranges</p>
              <Button type="button" size="sm" variant="outline" onClick={addBlackout}>
                Add blackout
              </Button>
            </div>
            <div className="space-y-3">
              {settings.lukaah.blackouts.length === 0 && (
                <p className="font-ui text-sm text-body">No blackouts — all weeks in the season are offered.</p>
              )}
              {settings.lukaah.blackouts.map((b, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-navy/10 bg-white p-4 sm:grid-cols-4">
                  <Input label="Start" value={b.start} onChange={(e) => updateBlackout(i, { start: e.target.value })} />
                  <Input label="End" value={b.end} onChange={(e) => updateBlackout(i, { end: e.target.value })} />
                  <Input label="Note" value={b.note ?? ""} onChange={(e) => updateBlackout(i, { note: e.target.value })} />
                  <div className="flex items-end">
                    <Button type="button" size="sm" variant="ghost" className="text-red-700" onClick={() => removeBlackout(i)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 border-t border-navy/10 pt-6">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save availability"}
        </Button>
        {saved && <span className="font-ui text-sm text-success">Saved — booking form will use these settings.</span>}
      </div>
    </div>
  );
}
