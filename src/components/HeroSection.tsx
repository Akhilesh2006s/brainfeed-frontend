import heroImg from "@/assets/hero-education.jpg";

const HeroSection = () => {
  return (
    <section className="relative">
      <div className="relative h-[500px] lg:h-[560px] overflow-hidden">
        <img
          src={heroImg}
          alt="Featured article"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
          <div className="container">
            <span className="category-badge text-gold mb-3 inline-block">Education</span>
            <h1 className="font-serif text-3xl lg:text-5xl font-bold text-primary-foreground leading-tight max-w-3xl">
              Colonel Seema Mishra Becomes First Woman Principal at Uttar Pradesh Sainik School
            </h1>
            <p className="mt-4 text-primary-foreground/80 text-base lg:text-lg max-w-2xl font-sans">
              Making history in Indian military education, Colonel Seema Mishra takes charge as the first woman to lead a Sainik School in Uttar Pradesh.
            </p>
            <div className="mt-4 flex items-center gap-3 text-primary-foreground/60 text-sm font-sans">
              <span>February 10, 2026</span>
              <span>·</span>
              <span>5 min read</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
