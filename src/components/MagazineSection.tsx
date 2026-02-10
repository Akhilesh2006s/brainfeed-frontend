import magazineImg from "@/assets/magazine-cover.jpg";

const MagazineSection = () => {
  return (
    <section className="py-12 bg-secondary">
      <div className="container">
        <h2 className="section-title">Latest Brainfeed Magazines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <img
              src={magazineImg}
              alt="Latest Brainfeed Magazine"
              className="rounded-sm shadow-lg max-h-96 object-cover w-full"
              loading="lazy"
            />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-foreground">
              India's Premier Education Magazine
            </h3>
            <p className="mt-4 text-muted-foreground leading-relaxed font-sans">
              Brainfeed Magazine has been at the forefront of education journalism, bringing you expert insights, policy updates, and inspiring stories from across India's education landscape. Each issue is crafted to empower educators, parents, and students.
            </p>
            <a
              href="#"
              className="mt-6 inline-block bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Subscribe Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MagazineSection;
