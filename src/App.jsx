import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Dashboard from "./Dashboard";
import { checkRhoodStoneHolder } from "./lib/rhoodstone";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";

function App() {
  if (window.location.search === "?page=dashboard") {
    return <Dashboard />;
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState("Checking...");

  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAppKitAccount();

  const [holderStatus, setHolderStatus] = useState("idle");
  const [nftBalance, setNftBalance] = useState(0);

  useEffect(() => {
    async function testSupabase() {
      if (!supabase) {
        setSupabaseStatus("Variables missing");
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

  useEffect(() => {
    async function verifyHolder() {
      if (!isConnected || !address) {
        setHolderStatus("idle");
        setNftBalance(0);
        return;
      }

      try {
        setHolderStatus("checking");

        const balance = await checkRhoodStoneHolder(address);

        setNftBalance(balance);
        setHolderStatus(balance > 0 ? "holder" : "not-holder");
      } catch (error) {
        console.error("RhoodStone ownership check failed:", error);
        setHolderStatus("error");
        setNftBalance(0);
      }
    }

    verifyHolder();
  }, [isConnected, address]);

  function handleWalletClick() {
    if (isConnected) {
      disconnect();
    } else {
      open({ view: "Connect" });
    }
  }

  function handleMobileWalletClick() {
    if (isConnected) {
      disconnect();
    } else {
      open({ view: "Connect" });
    }
  }

  function walletLabel() {
    if (!isConnected || !address) {
      return "Connect Wallet";
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function mobileWalletLabel() {
    if (!isConnected || !address) {
      return "Connect Wallet";
    }

    return `Connected · ${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  if (supabaseStatus === "Checking...") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#090909",
          color: "#d7ff45",
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
        }}
      >
        Checking Supabase...
      </div>
    );
  }

  return (
    <>
      <style>{`
        .mobile-wallet-button {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-wallet-button {
            display: none !important;
          }

          .mobile-wallet-button {
            display: block;
            width: 100%;
            margin-top: 12px;
          }
        }
      `}</style>

      {/* Temporary Supabase Test */}
      <div
        style={{
          position: "fixed",
          right: "10px",
          bottom: "10px",
          zIndex: 99999,
          padding: "8px 12px",
          background: "#111",
          color:
            supabaseStatus === "Connected" ? "#d7ff45" : "#ff5555",
          border: "1px solid #333",
          borderRadius: "6px",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
        }}
      >
        Supabase: {supabaseStatus}
      </div>

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

            <a
  href="/dashboard"
  onClick={() => setMenuOpen(false)}
>
  Dashboard
</a>
            
            {/* Mobile Wallet Button */}
            <button
              className="connect-button mobile-wallet-button"
              onClick={handleMobileWalletClick}
            >
              {mobileWalletLabel()}
            </button>

            {/* Mobile Holder Status */}
            {isConnected && (
              <div className="holder-status-card">
                <div className="holder-status-top">
                  <span className="holder-status-dot"></span>

                  <span>
                    {holderStatus === "checking"
                      ? "VERIFYING OWNERSHIP"
                      : "WALLET CONNECTED"}
                  </span>
                </div>

                <div className="holder-wallet">
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : ""}
                </div>

                <div className="holder-status-result">
                  {holderStatus === "checking" && (
                    <>
                      <span className="status-symbol">◌</span>

                      <div>
                        <strong>VERIFYING</strong>
                        <small>
                          Checking RhoodStone ownership...
                        </small>
                      </div>
                    </>
                  )}

                  {holderStatus === "holder" && (
                    <>
                      <span className="status-symbol">✓</span>

                      <div>
                        <strong>RHOODSTONE HOLDER</strong>
                        <small>
                          {nftBalance} NFT VERIFIED
                        </small>
                      </div>
                    </>
                  )}

                  {holderStatus === "not-holder" && (
                    <>
                      <span className="status-symbol">×</span>

                      <div>
                        <strong>NOT A HOLDER</strong>
                        <small>
                          No RhoodStone NFT detected
                        </small>
                      </div>
                    </>
                  )}

                  {holderStatus === "error" && (
                    <>
                      <span className="status-symbol">!</span>

                      <div>
                        <strong>VERIFICATION FAILED</strong>
                        <small>
                          Please try again
                        </small>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </nav>

          {/* Desktop Wallet Button */}
          <button
            className="connect-button desktop-wallet-button"
            onClick={handleWalletClick}
          >
            {walletLabel()}
          </button>

          {/* Desktop Holder Status */}
          {isConnected && (
            <div className="holder-status-card desktop-holder-card">
              <div className="holder-status-top">
                <span className="holder-status-dot"></span>

                <span>
                  {holderStatus === "checking"
                    ? "VERIFYING OWNERSHIP"
                    : "WALLET CONNECTED"}
                </span>
              </div>

              <div className="holder-wallet">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : ""}
              </div>

              <div className="holder-status-result">
                {holderStatus === "checking" && (
                  <>
                    <span className="status-symbol">◌</span>

                    <div>
                      <strong>VERIFYING</strong>
                      <small>
                        Checking RhoodStone ownership...
                      </small>
                    </div>
                  </>
                )}

                {holderStatus === "holder" && (
                  <>
                    <span className="status-symbol">✓</span>

                    <div>
                      <strong>RHOODSTONE HOLDER</strong>
                      <small>
                        {nftBalance} NFT VERIFIED
                      </small>
                    </div>
                  </>
                )}

                {holderStatus === "not-holder" && (
                  <>
                    <span className="status-symbol">×</span>

                    <div>
                      <strong>NOT A HOLDER</strong>
                      <small>
                        No RhoodStone NFT detected
                      </small>
                    </div>
                  </>
                )}

                {holderStatus === "error" && (
                  <>
                    <span className="status-symbol">!</span>

                    <div>
                      <strong>VERIFICATION FAILED</strong>
                      <small>
                        Please try again
                      </small>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
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
                <div className="stone-inner">R</div>
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
    </>
  );
}

export default App;
