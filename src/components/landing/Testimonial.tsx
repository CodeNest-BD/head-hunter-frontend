/**
 * Single quote band from the client reference. The review-site logo row that
 * sat beside it is scribbled out in the reference, so it stays out.
 */
export function Testimonial() {
  return (
    <section className="border-t border-brand-line bg-background">
      <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-10">
        <figure className="mx-auto max-w-2xl text-center">
          <blockquote className="font-heading text-2xl font-extrabold text-navy">
            “Finally, recruiting on your terms.”
          </blockquote>
          <figcaption className="mt-3 text-sm font-medium text-brand-gray">
            — Michael T., COO
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
