import Link from "next/link";

type WrappedCardProps = {
  emoji: string;
  label: string;
  value: string;
  detail?: string; // a smaller line under the value
  href?: string; // if given, the card links somewhere
  color?: "purple" | "pink";
};

// One "story card" on the Wrapped page, styled to look shareable.
export default function WrappedCard({ emoji, label, value, detail, href, color = "purple" }: WrappedCardProps) {
  const colors =
    color === "pink"
      ? "from-pink-100 to-pink-200 text-pink-900"
      : "from-purple-100 to-purple-200 text-purple-900";

  const content = (
    <>
      <p className="text-3xl">{emoji}</p>
      <p className="mt-3 text-sm font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold text-purple-950">{value}</p>
      {detail && <p className="mt-2 text-sm">{detail}</p>}
    </>
  );

  const className = `block h-full rounded-3xl bg-gradient-to-br p-6 shadow-sm ${colors}`;

  if (href) {
    return (
      <Link href={href} className={`${className} transition hover:-translate-y-0.5 hover:shadow-md`}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
