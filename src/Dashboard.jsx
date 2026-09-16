import { useEffect, useState } from "react";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";
import { checkRhoodStoneHolder } from "./lib/rhoodstone";
import { getHolderTier } from "./lib/holderTier";
import { getRhoodPoints } from "./lib/points";

function Dashboard() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAppKitAccount();

  const [holderStatus, setHolderStatus] = useState("idle");
  const [nftBalance, setNftBalance] = useState(0);
  const [holderTier, setHolderTier] = useState(null);
  const [rhoodPoints, setRhoodPoints] = useState(0);

  // RhoodStone ownership verification
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

        console.log("Verified RhoodStone balance:", balance);

        setNftBalance(balance);
        setHolderStatus(
          balance > 0 ? "holder" : "not-holder"
        );
      } catch (error) {
        console.error(
          "Dashboard ownership check failed:",
          error
        );

        setHolderStatus("error");
        setNftBalance(0);
      }
    }

    verifyHolder();
  }, [isConnected, address]);

  // Holder tier
  useEffect(() => {
    async function loadHolderTier() {
      if (!isConnected || !address) {
        setHolderTier(null);
        return;
      }

      try {
        const tier = await getHolderTier(0, 0);
        setHolderTier(tier);
      } catch (error) {
        console.error(
          "Holder tier lookup failed:",
          error
        );

        setHolderTier(null);
      }
    }

    loadHolderTier();
  }, [isConnected, address]);

  // Rhood Points
  useEffect(() => {
    async function loadRhoodPoints() {
      if (!isConnected || !address) {
        setRhoodPoints(0);
        return;
      }

      try {
        const points = await getRhoodPoints(address);

        console.log(
          "Rhood Points:",
          points
        );

        setRhoodPoints(points);
      } catch (error) {
        console.error(
          "Rhood points lookup failed:",
          error
        );

        setRhoodPoints(0);
      }
    }

    loadRhoodPoints();
  }, [isConnected, address]);

  function handleWallet() {
    if (isConnected) {
      disconnect();
    } else {
      open({ view: "Connect" });
    }
  }

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <a href="/" className="logo">
          <span className="logo-mark">◆</span>
          <span>RHOODSTONE</span>
        </a>

        <div className="dashboard-header-actions">
          <a href="/" className="dashboard-back">
            ← Home
          </a>

          <button
            className="connect-button"
            onClick={handleWallet}
          >
            {isConnected
              ? shortAddress
              : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-eyebrow">
          <span></span>
          RHOODSTONE ECOSYSTEM
        </div>

        <div className="dashboard-title-row">
          <div>
            <h1>
              HOLDER
              <br />
              <em>DASHBOARD.</em>
            </h1>

            <p>
              Your identity, ownership and access inside the
              RhoodStone ecosystem.
            </p>
          </div>

          {isConnected && (
            <div className="dashboard-wallet-status">
              <span className="status-dot"></span>

              <div>
                <small>CONNECTED WALLET</small>
                <strong>{shortAddress}</strong>
              </div>
            </div>
          )}
        </div>

        {!isConnected ? (
          <section className="dashboard-connect-card">
            <div className="dashboard-card-icon">
              ◆
            </div>

            <span>MEMBER ACCESS</span>

            <h2>Connect your wallet</h2>

            <p>
              Connect the wallet holding your RhoodStone NFT
              to access your holder dashboard.
            </p>

            <button
              className="primary-button"
              onClick={handleWallet}
            >
              Connect Wallet
            </button>
          </section>
        ) : (
          <>
            <section className="dashboard-grid">

              <article className="dashboard-card dashboard-card-large">
                <div className="card-label">
                  HOLDER STATUS
                </div>

                {holderStatus === "checking" && (
                  <div className="dashboard-result">
                    <span className="result-icon">
                      ◌
                    </span>

                    <div>
                      <strong>VERIFYING</strong>

                      <p>
                        Checking your RhoodStone ownership...
                      </p>
                    </div>
                  </div>
                )}

                {holderStatus === "holder" && (
                  <div className="dashboard-result">
                    <span className="result-icon">
                      ✓
                    </span>

                    <div>
                      <strong>
                        RHOODSTONE HOLDER
                      </strong>

                      <p>
                        Your ownership has been verified
                        on-chain.
                      </p>
                    </div>
                  </div>
                )}

                {holderStatus === "not-holder" && (
                  <div className="dashboard-result">
                    <span className="result-icon">
                      ×
                    </span>

                    <div>
                      <strong>
                        NOT A HOLDER
                      </strong>

                      <p>
                        No RhoodStone NFT was detected in
                        this wallet.
                      </p>
                    </div>
                  </div>
                )}

                {holderStatus === "error" && (
                  <div className="dashboard-result">
                    <span className="result-icon">
                      !
                    </span>

                    <div>
                      <strong>
                        VERIFICATION FAILED
                      </strong>

                      <p>
                        We could not verify ownership.
                        Please try again.
                      </p>
                    </div>
                  </div>
                )}
              </article>

              <article className="dashboard-card">
                <div className="card-label">
                  RHOODSTONE HELD
                </div>

                <div className="dashboard-number">
                  {nftBalance}
                </div>

                <p className="dashboard-card-description">
                  NFTs currently held by this wallet.
                </p>
              </article>

              <article className="dashboard-card">
                <div className="card-label">
                  HOLDER TIER
                </div>

                <div className="dashboard-tier">
                  {holderTier
                    ? holderTier.name
                    : "—"}
                </div>

                <p className="dashboard-card-description">
                  Your current ecosystem level.
                </p>
              </article>

              <article className="dashboard-card">
                <div className="card-label">
                  RHOOD POINTS
                </div>

                <div className="dashboard-number">
                  {rhoodPoints}
                </div>

                <p className="dashboard-card-description">
                  Earn points through missions and
                  participation.
                </p>
              </article>

            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <span>01 / ACCESS</span>

                <h2>
                  YOUR
                  <br />
                  <em>ECOSYSTEM.</em>
                </h2>
              </div>

              <div className="dashboard-access-grid">

                <article>
                  <span>WL & GTD</span>

                  <h3>
                    Partner Opportunities
                  </h3>

                  <p>
                    Exclusive whitelist and guaranteed
                    mint opportunities will appear here.
                  </p>
                </article>

                <article>
                  <span>MISSIONS</span>

                  <h3>
                    Earn Rhood Points
                  </h3>

                  <p>
                    Complete ecosystem missions and
                    increase your holder reputation.
                  </p>
                </article>

                <article>
                  <span>REWARDS</span>

                  <h3>
                    Holder Rewards
                  </h3>

                  <p>
                    Future holder-only rewards and drops
                    will be available here.
                  </p>
                </article>

              </div>
            </section>
          </>
        )}
      </main>

      <footer className="dashboard-footer">
        <div className="logo">
          <span className="logo-mark">◆</span>
          <span>RHOODSTONE</span>
        </div>

        <span>© 2026 RhoodStone</span>
      </footer>
    </div>
  );
}

export default Dashboard;
