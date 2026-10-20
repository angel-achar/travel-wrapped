import type { ContinentCount } from "@/lib/api";

type ContinentBarChartProps = {
  data: ContinentCount[];
};

// A bar chart made with plain divs: each bar's width is its share of the
// biggest value, so the longest bar always fills the row. No chart library.
export default function ContinentBarChart({ data }: ContinentBarChartProps) {
  let biggest = 0;
  for (const item of data) {
    if (item.countries > biggest) biggest = item.countries;
  }

  return (
    <ul className="space-y-3">
      {data.map((item) => {
        // Avoid dividing by zero when every continent is 0.
        const percent = biggest === 0 ? 0 : (item.countries / biggest) * 100;
        return (
          <li key={item.continent} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3">
            <span className="text-sm font-medium text-purple-900">{item.continent}</span>
            <div className="h-4 overflow-hidden rounded-full bg-purple-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-right text-sm font-semibold text-purple-950">{item.countries}</span>
          </li>
        );
      })}
    </ul>
  );
}
