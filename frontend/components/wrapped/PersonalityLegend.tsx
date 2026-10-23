// The travel personalities and how each one is picked. The rules are checked
// from top to bottom, and the first one that fits wins. These must match
// pick_personality() in backend/main.py.
export const PERSONALITIES = [
  { name: "Homebody", emoji: "🛋️", rule: "No trips this year." },
  { name: "Globetrotter", emoji: "🌍", rule: "You visited 3 or more continents." },
  { name: "Frequent Flyer", emoji: "✈️", rule: "You took 4 or more trips." },
  { name: "Slow Traveler", emoji: "🐢", rule: "One of your trips lasted 14 days or more." },
  { name: "Deep Diver", emoji: "🤿", rule: "All your trips were to just one country." },
  { name: "Explorer", emoji: "🧭", rule: "You visited a few countries (none of the above)." },
];

type PersonalityLegendProps = {
  current: string; // the personality for the year being shown
};

export default function PersonalityLegend({ current }: PersonalityLegendProps) {
  return (
    <section aria-labelledby="personality-legend" className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 id="personality-legend" className="text-xl font-bold text-purple-950">
        How travel personalities work
      </h2>
      <p className="mt-1 text-sm text-purple-700">
        We check these from top to bottom, and the first one that fits your year is yours.
      </p>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {PERSONALITIES.map((p) => {
          const isYours = p.name === current;
          return (
            <li
              key={p.name}
              aria-current={isYours ? "true" : undefined}
              className={`flex items-start gap-3 rounded-2xl p-4 ${
                isYours ? "bg-gradient-to-br from-purple-100 to-pink-100 ring-2 ring-purple-400" : "bg-purple-50"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {p.emoji}
              </span>
              <div>
                <p className="font-semibold text-purple-950">
                  {p.name}
                  {isYours && (
                    <span className="ml-2 rounded-full bg-purple-700 px-2 py-0.5 text-xs font-semibold text-white">
                      You
                    </span>
                  )}
                </p>
                <p className="text-sm text-purple-800">{p.rule}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
