interface EscrowFeature {
  title: string;
  body: string;
}

const FEATURES: readonly EscrowFeature[] = [
  {
    title: "Prepaid wallet",
    body: "Load funds once. Posting a job reserves the fee from your balance — no card dance every time you raise a fee.",
  },
  {
    title: "True escrow",
    body: "The moment an offer is accepted, the fee moves to a Stripe holding account. Neither side can touch it for 30 days.",
  },
  {
    title: "Real recourse",
    body: "If a hire doesn't work out inside the guarantee window, raise a dispute — the payout stays frozen until a human resolves it.",
  },
];

/**
 * Navy escrow section copied from the v2 mock: "Money that behaves itself."
 * plus three bordered cards describing the wallet, escrow, and dispute flow.
 */
export function Escrow() {
  return (
    <section
      id="escrow"
      className="scroll-mt-20 bg-navy px-5 py-20 text-white md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-[1240px]">
        <h2 className="mb-11 max-w-xl font-heading text-[34px] font-extrabold tracking-[-0.02em] sm:text-[42px]">
          Money that behaves itself.
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[#2E3D5C] p-7"
            >
              <div className="mb-3 font-heading text-[30px] font-extrabold text-[#4F80E6]">
                {feature.title}
              </div>
              <p className="text-[15px] leading-relaxed text-[#C9D0DF]">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
