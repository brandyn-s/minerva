import Image from "next/image";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#build-contract">Skip to build contract</a>
      <main>
        <header className="masthead">
          <div className="brand">
            <Image src="/icon.svg" alt="" width={48} height={48} unoptimized />
            <span>Minerva</span>
          </div>
          <span className="edition">Starter shell</span>
        </header>

        <section className="introduction" aria-labelledby="intro-title">
          <p className="eyebrow">Give thought room</p>
          <h1 id="intro-title">A living atlas<br />of ideas.</h1>
          <p className="lede">
            Wander through possibilities. Weave contributions together.
            Think aloud, without losing your place.
          </p>
          <p className="implementation-note">
            This is the runnable starter. The canvas, Wander exploration,
            and voice collaborator are not implemented yet.
          </p>
          <a className="text-link" href="#build-contract">Read the build contract <span aria-hidden="true">&#8595;</span></a>
        </section>

        <section id="build-contract" className="contract" aria-labelledby="contract-title">
          <div className="section-heading">
            <p className="eyebrow">The experience to build</p>
            <h2 id="contract-title">Responsive to attention.<br />Steady under your hands.</h2>
          </div>
          <div className="instruments">
            <details>
              <summary>
                <span className="instrument-number" aria-hidden="true">01</span>
                <span><strong>Wander</strong><span className="action-label">Explore this idea</span></span>
              </summary>
              <div className="detail-content">
                <p>
                  New directions will appear beside their sources, while your
                  cards and camera stay where you put them. Exploration should
                  reveal differences, not dress repetition as discovery.
                </p>
              </div>
            </details>
            <details>
              <summary>
                <span className="instrument-number" aria-hidden="true">02</span>
                <span><strong>Weave</strong><span className="action-label">Recombine selected ideas</span></span>
              </summary>
              <div className="detail-content">
                <p>
                  Select two distant ideas and inspect the threads each contributes.
                  A new draft will preserve its origins without replacing the
                  work that led to it.
                </p>
              </div>
            </details>
            <details>
              <summary>
                <span className="instrument-number" aria-hidden="true">03</span>
                <span><strong>Talk to Minerva</strong><span className="action-label">Think together</span></span>
              </summary>
              <div className="detail-content">
                <p>
                  A collaborator will discuss, point, and propose while you work.
                  Voice keeps priority: optional interface sounds stay quiet
                  during conversation. Nothing starts listening here.
                </p>
              </div>
            </details>
          </div>
        </section>

        <footer>
          <p>Build one complete slice at a time.</p>
          <p>Start with <code>AGENTS.md</code> and <code>docs/build-prompts.md</code>.</p>
          <p className="footer-note">No model calls, microphone access, or autoplay in this shell.</p>
        </footer>
      </main>
    </>
  );
}
