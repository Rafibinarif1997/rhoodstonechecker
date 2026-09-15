import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

 const [supabaseStatus, setSupabaseStatus] = useState("Checking...");

useEffect(() => {
  async function testSupabase() {
    if (!supabase) {
  setSupabaseStatus("Supabase variables missing");
  return;
}
    const { data, error } = await supabase
      .from("holder_tiers")
      .select("name")
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);
      setSupabaseStatus("Connection failed");
      return;
    }

    console.log("Supabase connected:", data);
    setSupabaseStatus("Connected");
  }

  testSupabase();
}, []);

  if (supabaseStatus === "Checking...") {
  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#090909",
      color: "#d7ff45",
      fontFamily: "Arial, sans-serif",
      fontSize: "18px"
    }}>
      Checking Supabase...
    </div>
  );
}
  
  return (
    <div className="app">
      <header className="navbar">
        <a href="/" className="logo">
          <span className="logo-mark">◆</span>
          <span>RHOODSTONE</span>
        </a>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#collection" onClick={() => setMenuOpen(false)}>
            Collection
          </a>

          <a href="#benefits" onClick={() => setMenuOpen(false)}>
            Benefits
          </a>

          <a href="#partners" onClick={() => setMenuOpen(false)}>
            Partners
          </a>

          <a href="#missions" onClick={() => setMenuOpen(false)}>
            Missions
          </a>
        </nav>

        <button className="connect-button">
          Connect Wallet
        </button>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span></span>
              THE RHOODSTONE ECOSYSTEM
            </div>

            <h1>
              MORE THAN
              <br />
              <strong>AN NFT.</strong>
            </h1>

            <p>
              RhoodStone is your pass to an evolving ecosystem of
              exclusive access, holder rewards, missions and
              opportunities.
            </p>

            <div className="hero-actions">
              <button className="primary-button">
                Explore Collection
              </button>

              <button className="secondary-button">
                Become a Holder
              </button>
            </div>
          </div>

          <div className="hero-stone">
            <div className="stone-glow"></div>

            <div className="stone">
              <div className="stone-inner">
                R
              </div>
            </div>
          </div>
        </section>

        <section className="stats">
          <div>
            <span>SUPPLY</span>
            <strong>1,000</strong>
          </div>

          <div>
            <span>HOLDERS</span>
            <strong>—</strong>
          </div>

          <div>
            <span>PARTNERS</span>
            <strong>—</strong>
          </div>

          <div>
            <span>MISSIONS</span>
            <strong>—</strong>
          </div>
        </section>

        <section id="benefits" className="section">
          <div className="section-heading">
            <span>01 / BENEFITS</span>

            <h2>
              HOLD.
              <br />
              <em>PARTICIPATE.</em>
              <br />
              ACCESS.
            </h2>
          </div>

          <div className="benefit-grid">
            <article>
              <span>01</span>
              <h3>WL & GTD</h3>
              <p>
                Unlock exclusive whitelist and guaranteed
                mint opportunities from ecosystem partners.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>MISSIONS</h3>
              <p>
                Participate in community and partner missions
                to earn Rhood Points.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>HOLDER TIERS</h3>
              <p>
                Long-term holding and participation unlock
                higher levels of access.
              </p>
            </article>

            <article>
              <span>04</span>
              <h3>EXCLUSIVE DROPS</h3>
              <p>
                Access future holder-only rewards, drops and
                ecosystem experiences.
              </p>
            </article>
          </div>
        </section>

        <section id="collection" className="section collection-section">
          <div className="section-heading">
            <span>02 / COLLECTION</span>

            <h2>
              YOUR
              <br />
              <em>STONE.</em>
            </h2>
          </div>

          <div className="collection-card">
            <div className="collection-placeholder">
              <span>R</span>
            </div>

            <div className="collection-info">
              <span>RHOODSTONE</span>
              <h3>Genesis Collection</h3>
              <p>
                A membership pass into the RhoodStone
                ecosystem.
              </p>

              <button className="secondary-button">
                View Collection
              </button>
            </div>
          </div>
        </section>

        <section id="partners" className="section">
          <div className="section-heading">
            <span>03 / ECOSYSTEM</span>

            <h2>
              BUILT
              <br />
              <em>TOGETHER.</em>
            </h2>
          </div>

          <div className="empty-state">
            <div className="empty-icon">◆</div>
            <h3>Partner ecosystem</h3>
            <p>
              Partner opportunities will appear here as the
              ecosystem grows.
            </p>
          </div>
        </section>

        <section id="missions" className="section">
          <div className="section-heading">
            <span>04 / MISSIONS</span>

            <h2>
              EARN YOUR
              <br />
              <em>ACCESS.</em>
            </h2>
          </div>

          <div className="mission-preview">
            <div>
              <span>HOLDER ONLY</span>
              <h3>Rhood Points</h3>
              <p>
                Complete missions, participate in the
                ecosystem and build your holder reputation.
              </p>
            </div>

            <div className="points">
              <small>YOUR POINTS</small>
              <strong>0</strong>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="logo">
          <span className="logo-mark">◆</span>
          <span>RHOODSTONE</span>
        </div>

        <p>
          Your pass to the RhoodStone ecosystem.
        </p>

        <span className="copyright">
          © 2026 RhoodStone
        </span>
      </footer>
    </div>
  );
}

export default App;
