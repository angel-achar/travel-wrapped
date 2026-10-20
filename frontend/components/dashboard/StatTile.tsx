type StatTileProps = {
  value: string;
  label: string;
  // Pink instead of purple, to make a couple of tiles stand out.
  highlight?: boolean;
};

// One big number with a label under it.
export default function StatTile({ value, label, highlight = false }: StatTileProps) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${highlight ? "bg-pink-100" : "bg-white"}`}>
      <p className={`text-3xl font-bold ${highlight ? "text-pink-600" : "text-purple-700"}`}>{value}</p>
      <p className={`mt-1 ${highlight ? "text-pink-900" : "text-purple-900"}`}>{label}</p>
    </div>
  );
}
