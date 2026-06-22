/** Quick trust signals under the philosophy intro */
export function HomeHighlights() {
  const items = [
    { label: "Format", value: "One coach, one swimmer" },
    { label: "Ages", value: "Infants through adults" },
    { label: "Location", value: "American Fork, UT" },
  ];

  return (
    <div className="stat-strip mx-auto max-w-3xl">
      {items.map((item) => (
        <div key={item.label}>
          <p className="eyebrow text-[0.625rem]">{item.label}</p>
          <p className="mt-1 text-sm font-semibold text-navy">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
