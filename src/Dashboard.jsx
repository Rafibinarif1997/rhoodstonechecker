import { useEffect, useState } from "react";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";
import { checkRhoodStoneHolder } from "./lib/rhoodstone";
import { getHolderTier } from "./lib/holderTier";
import { getRhoodPoints } from "./lib/points";
import { supabase } from "./lib/supabase";

function Dashboard() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAppKitAccount();

  const [holderStatus, setHolderStatus] = useState("idle");
  const [nftBalance, setNftBalance] = useState(0);
  const [holderTier, setHolderTier] = useState(null);
  const [rhoodPoints, setRhoodPoints] = useState(0);

  const [missions, setMissions] = useState([]);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [completingMission, setCompletingMission] = useState(null);
  const [missionMessage, setMissionMessage] = useState("");

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
  async function refreshPoints() {
    if (!address) {
      setRhoodPoints(0);
      return;
    }

    try {
      const points = await getRhoodPoints(address);
      setRhoodPoints(points);
    } catch (error) {
      console.error(
        "Rhood points lookup failed:",
        error
      );
    }
  }

  useEffect(() => {
    if (!isConnected || !address) {
      setRhoodPoints(0);
      return;
    }

    refreshPoints();
  }, [isConnected, address]);

  // Load active missions
  async function loadMissions() {
    if (!isConnected || !address || !supabase) {
      setMissions([]);
      setCompletedMissions([]);
      return;
    }

    try {
      setMissionsLoading(true);

      const { data, error } = await supabase
        .from("missions")
        .select(
          "id, title, description, mission_type, action_url, reward_points, max_completions, start_at, end_at, is_holder_only"
        )
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setMissions(data || []);

      // Find missions already completed by this wallet
      const { data: completions, error: completionError } =
        await supabase
          .from("mission_completions")
          .select(
            "mission_id, status, points_awarded"
          )
          .eq(
            "wallet_address",
            address.toLowerCase()
          );

      if (completionError) {
        console.error(
          "Mission completion lookup failed:",
          completionError
        );

        setCompletedMissions([]);
      } else {
        setCompletedMissions(
          completions || []
        );
      }
    } catch (error) {
      console.error(
        "Missions lookup failed:",
        error
      );

      setMissions([]);
    } finally {
      setMissionsLoading(false);
    }
  }

  useEffect(() => {
    loadMissions();
  }, [isConnected, address]);

  // Complete mission
  async function handleCompleteMission(mission) {
    if (!address || !supabase) {
      return;
    }

    setMissionMessage("");
    setCompletingMission(mission.id);

    try {
      // If mission has an external action URL,
      // open it first.
      if (mission.action_url) {
        window.open(
          mission.action_url,
          "_blank",
          "noopener,noreferrer"
        );
      }

      const { data, error } =
        await supabase.functions.invoke(
          "complete-mission",
          {
            body: {
              mission_id: mission.id,
              wallet: address,
            },
          }
        );

      if (error) {
        throw new Error(
          error.message ||
            "Mission completion failed"
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error(
          "Mission could not be completed"
        );
      }

      setMissionMessage(
        `Mission completed! +${data.points_awarded} Rhood Points`
      );

      await refreshPoints();
      await loadMissions();
    } catch (error) {
      console.error(
        "Mission completion failed:",
        error
      );

      setMissionMessage(
        error.message ||
          "Could not complete mission."
      );
    } finally {
      setCompletingMission(null);
    }
  }

  function isMissionCompleted(missionId) {
    return completedMissions.some(
      (completion) =>
        completion.mission_id === missionId &&
        completion.status === "completed"
    );
  }

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

            {/* MISSIONS */}
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <span>02 / MISSIONS</span>

                <h2>
                  EARN
                  <br />
                  <em>RHOOD POINTS.</em>
                </h2>
              </div>

              {missionMessage && (
                <div
                  className="dashboard-card"
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  <strong>
                    {missionMessage}
                  </strong>
                </div>
              )}

              {missionsLoading ? (
                <div className="dashboard-card">
                  <div className="card-label">
                    MISSIONS
                  </div>

                  <div className="dashboard-result">
                    <span className="result-icon">
                      ◌
                    </span>

                    <div>
                      <strong>
                        LOADING MISSIONS
                      </strong>

                      <p>
                        Fetching active ecosystem missions...
                      </p>
                    </div>
                  </div>
                </div>
              ) : missions.length === 0 ? (
                <div className="dashboard-card">
                  <div className="card-label">
                    MISSIONS
                  </div>

                  <div className="dashboard-result">
                    <span className="result-icon">
                      —
                    </span>

                    <div>
                      <strong>
                        NO ACTIVE MISSIONS
                      </strong>

                      <p>
                        New missions will appear here when
                        they become available.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dashboard-access-grid">
                  {missions.map((mission) => {
                    const completed =
                      isMissionCompleted(
                        mission.id
                      );

                    const completing =
                      completingMission ===
                      mission.id;

                    return (
                      <article key={mission.id}>
                        <span>
                          {mission.mission_type
                            ? mission.mission_type.toUpperCase()
                            : "MISSION"}
                        </span>

                        <h3>
                          {mission.title}
                        </h3>

                        <p>
                          {mission.description}
                        </p>

                        <div
                          style={{
                            marginTop: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>
                            +{mission.reward_points} POINTS
                          </strong>

                          {mission.is_holder_only && (
                            <small>
                              HOLDER ONLY
                            </small>
                          )}
                        </div>

                        <button
                          className="primary-button"
                          style={{
                            marginTop: "18px",
                            width: "100%",
                          }}
                          disabled={
                            completed ||
                            completing
                          }
                          onClick={() =>
                            handleCompleteMission(
                              mission
                            )
                          }
                        >
                          {completed
                            ? "✓ COMPLETED"
                            : completing
                            ? "COMPLETING..."
                            : "COMPLETE MISSION"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ECOSYSTEM ACCESS */}
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <span>03 / ACCESS</span>

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
