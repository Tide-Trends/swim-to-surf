/** Three-up “private lessons / ages / location” — placed under Philosophy intro (not in hero). */
export function HomeHighlights() {
  return (
    <div className="mx-auto mt-16 grid w-full max-w-3xl grid-cols-1 gap-3 sm:mt-20 sm:grid-cols-3">
      <div className="rounded-2xl border border-[#0b5c79]/20 bg-white px-4 py-4 text-left shadow-sm sm:py-3.5">
        <p className="text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-dark/55">Private lessons</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-dark">One coach, one swimmer</p>
      </div>
      <div className="rounded-2xl border border-[#0b5c79]/20 bg-white px-4 py-4 text-left shadow-sm sm:py-3.5">
        <p className="text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-dark/55">Ages</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-dark">Infants to adults</p>
      </div>
      <div className="rounded-2xl border border-[#0b5c79]/20 bg-white px-4 py-4 text-left shadow-sm sm:py-3.5">
        <p className="text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-dark/55">Location</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-dark">American Fork, UT</p>
      </div>
    </div>
  );
}
