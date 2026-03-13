import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import AiDemo from "./components/AiDemo";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import Cta from "./components/Cta";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <AiDemo />
        <Pricing />
        <Testimonials />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
