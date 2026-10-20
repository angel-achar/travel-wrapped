import Hero from "@/components/landing/Hero";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-purple-50">
      <Navbar />
      <Hero />
    </main>
  );
}