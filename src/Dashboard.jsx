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
  const [missionMessageType, setMissionMessageType] =
    useState("");

  // ==========================================
  // RHOODSTONE OWNERSHIP VERIFICATION
  // ==========================================

  useEffect(() => {
  async function loadHolderTier() {
    if (!isConnected || !address) {
      setHolderTier(null);
      return;
    }

    try {
      const tier = await getHolderTier(
        rhoodPoints,
        0
      );

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
}, [
  isConnected,
  address,
  rhoodPoints,
]);

  // ==========================================
  // HOLDER TIER
  // ==========================================

  useEffect(() => {
    async function loadHolderTier() {
      if (!isConnected || !address) {
        setHolderTier(null);
        return;
      }

      try {
        const tier =
          await getHolderTier(0, 0);

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

  // ==========================================
  // RHOOD POINTS
  // ==========================================

  async function refreshPoints() {
    if (!address) {
      setRhoodPoints(0);
      return;
    }

    try {
      const points =
        await getRhoodPoints(address);

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
    }
  }

  useEffect(() => {
    if (!isConnected || !address) {
      setRhoodPoints(0);
      return;
    }

    refreshPoints();
  }, [isConnected, address]);

  // ==========================================
  // LOAD ACTIVE MISSIONS
  // ==========================================

  async function loadMissions() {
    if (
      !isConnected ||
      !address ||
      !supabase
    ) {
      setMissions([]);
      setCompletedMissions([]);
      return;
    }

    try {
      setMissionsLoading(true);

      // Load active missions
      const {
        data: missionData,
        error: missionError,
      } = await supabase
        .from("missions")
        .select(
          "id, title, description, mission_type, action_url, reward_points, max_completions, start_at, end_at, is_holder_only"
        )
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        });

      if (missionError) {
        throw missionError;
      }

      setMissions(
        missionData || []
      );

      // Load completed missions
      const {
        data: completionData,
        error: completionError,
      } = await supabase
        .from("mission_completions")
        .select(
          "mission_id, status, points_awarded"
        )
        .ilike(
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
          completionData || []
        );
      }
    } catch (error) {
      console.error(
        "Missions lookup failed:",
        error
      );

      setMissions([]);
      setCompletedMissions([]);
    } finally {
      setMissionsLoading(false);
    }
  }

  useEffect(() => {
    loadMissions();
  }, [isConnected, address]);

  // ==========================================
  // COMPLETE MISSION
  // ==========================================

  async function handleCompleteMission(mission) {
    if (!address || !supabase) {
      setMissionMessage(
        "Please connect your wallet first."
      );

      setMissionMessageType("error");

      return;
    }

    setMissionMessage("");
    setMissionMessageType("");
    setCompletingMission(mission.id);

    try {
      // Open external mission action
      if (mission.action_url) {
        window.open(
          mission.action_url,
          "_blank",
          "noopener,noreferrer"
        );
      }

      console.log(
        "Completing mission:",
        mission.id
      );

      console.log(
        "Wallet:",
        address
      );

      const response =
        await supabase.functions.invoke(
          "complete-mission",
          {
            body: {
              mission_id: mission.id,
              wallet: address,
            },
          }
        );

      const data = response?.data;
      const error = response?.error;

      console.log(
        "Complete mission response:",
        data
      );

      console.log(
        "Complete mission error:",
        error
      );

      // ======================================
      // IMPORTANT:
      // CHECK SUCCESS FIRST
      // ======================================

      if (
        data &&
        data.success === true
      ) {
        const awardedPoints =
          Number(
            data.points_awarded || 0
          );

        console.log(
          "Mission completed successfully:",
          awardedPoints
        );

        setMissionMessage(
          `Mission completed! +${awardedPoints} Rhood Points`
        );

        setMissionMessageType(
          "success"
        );

        // Update points immediately
        await refreshPoints();

        // Update mission completion state
        await loadMissions();

        return;
      }

      // ======================================
      // EDGE FUNCTION ERROR
      // ======================================

      if (error) {
        let message =
          error.message ||
          "Mission completion failed.";

        try {
          if (error.context) {
            const responseText =
              await error.context.text();

            console.error(
              "Edge Function raw response:",
              responseText
            );

            if (responseText) {
              try {
                const parsed =
                  JSON.parse(
                    responseText
                  );

                if (parsed?.error) {
                  message =
                    parsed.error;
                }
              } catch {
                message =
                  responseText;
              }
            }
          }
        } catch (readError) {
          console.error(
            "Could not read Edge Function error:",
            readError
          );
        }

        throw new Error(message);
      }

      // ======================================
      // SERVER RETURNED ERROR
      // ======================================

      if (data?.error) {
        throw new Error(
          data.error
        );
      }

      // ======================================
      // UNKNOWN RESPONSE
      // ======================================

      throw new Error(
        "Mission could not be completed."
      );

    } catch (error) {
      console.error(
        "Mission completion failed:",
        error
      );

      setMissionMessage(
        error?.message ||
          "Could not complete mission."
      );

      setMissionMessageType(
        "error"
      );

    } finally {
      setCompletingMission(null);
    }
  }

  // ==========================================
  // CHECK COMPLETED MISSION
  // ==========================================

  function isMissionCompleted(missionId) {
    return completedMissions.some(
      (completion) =>
        completion.mission_id ===
          missionId &&
        completion.status ===
          "completed"
    );
  }

  // ==========================================
  // WALLET
  // ==========================================

  function handleWallet() {
    if (isConnected) {
      disconnect();
    } else {
      open({
        view: "Connect",
      });
    }
  }

  const shortAddress = address
    ? `${address.slice(
        0,
        6
      )}...${address.slice(-4)}`
    : "";

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="dashboard-header">

        <a
          href="/"
          className="logo"
        >
          <span className="logo-mark">
            ◆
          </span>

          <span>
            RHOODSTONE
          </span>
        </a>

        <div className="dashboard-header-actions">

          <a
            href="/"
            className="dashboard-back"
          >
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

      {/* MAIN */}
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
              <em>
                DASHBOARD.
              </em>
            </h1>

            <p>
              Your identity, ownership and access
              inside the RhoodStone ecosystem.
            </p>

          </div>

          {isConnected && (
            <div className="dashboard-wallet-status">

              <span className="status-dot"></span>

              <div>
                <small>
                  CONNECTED WALLET
                </small>

                <strong>
                  {shortAddress}
                </strong>
              </div>

            </div>
          )}

        </div>

        {!isConnected ? (

          <section className="dashboard-connect-card">

            <div className="dashboard-card-icon">
              ◆
            </div>

            <span>
              MEMBER ACCESS
            </span>

            <h2>
              Connect your wallet
            </h2>

            <p>
              Connect the wallet holding your
              RhoodStone NFT to access your
              holder dashboard.
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

            {/* =================================
                STATS
            ================================= */}

            <section className="dashboard-grid">

              <article className="dashboard-card dashboard-card-large">

                <div className="card-label">
                  HOLDER STATUS
                </div>

                {holderStatus ===
                  "checking" && (

                  <div className="dashboard-result">

                    <span className="result-icon">
                      ◌
                    </span>

                    <div>

                      <strong>
                        VERIFYING
                      </strong>

                      <p>
                        Checking your
                        RhoodStone ownership...
                      </p>

                    </div>

                  </div>
                )}

                {holderStatus ===
                  "holder" && (

                  <div className="dashboard-result">

                    <span className="result-icon">
                      ✓
                    </span>

                    <div>

                      <strong>
                        RHOODSTONE HOLDER
                      </strong>

                      <p>
                        Your ownership has
                        been verified on-chain.
                      </p>

                    </div>

                  </div>
                )}

                {holderStatus ===
                  "not-holder" && (

                  <div className="dashboard-result">

                    <span className="result-icon">
                      ×
                    </span>

                    <div>

                      <strong>
                        NOT A HOLDER
                      </strong>

                      <p>
                        No RhoodStone NFT was
                        detected in this wallet.
                      </p>

                    </div>

                  </div>
                )}

                {holderStatus ===
                  "error" && (

                  <div className="dashboard-result">

                    <span className="result-icon">
                      !
                    </span>

                    <div>

                      <strong>
                        VERIFICATION FAILED
                      </strong>

                      <p>
                        We could not verify
                        ownership. Please try again.
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
                  Earn points through missions
                  and participation.
                </p>

              </article>

            </section>

            {/* =================================
                MISSIONS
            ================================= */}

            <section className="dashboard-section">

              <div className="dashboard-section-heading">

                <span>
                  02 / MISSIONS
                </span>

                <h2>
                  EARN
                  <br />
                  <em>
                    RHOOD POINTS.
                  </em>
                </h2>

              </div>

              {missionMessage && (

                <div
                  className="dashboard-card"
                  style={{
                    marginBottom:
                      "20px",
                    border:
                      missionMessageType ===
                      "success"
                        ? "1px solid rgba(150, 255, 80, 0.35)"
                        : "1px solid rgba(255, 100, 100, 0.35)",
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
                        Fetching active
                        ecosystem missions...
                      </p>

                    </div>

                  </div>

                </div>

              ) : missions.length ===
                0 ? (

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
                        New missions will
                        appear here when
                        available.
                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="dashboard-access-grid">

                  {missions.map(
                    (mission) => {

                      const completed =
                        isMissionCompleted(
                          mission.id
                        );

                      const completing =
                        completingMission ===
                        mission.id;

                      return (

                        <article
                          key={mission.id}
                        >

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
                              marginTop:
                                "18px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap: "12px",
                              flexWrap:
                                "wrap",
                            }}
                          >

                            <strong>
                              +
                              {
                                mission.reward_points
                              }{" "}
                              POINTS
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
                              marginTop:
                                "18px",
                              width: "100%",
                              opacity:
                                completed ||
                                completing
                                  ? 0.6
                                  : 1,
                              cursor:
                                completed ||
                                completing
                                  ? "not-allowed"
                                  : "pointer",
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
                    }
                  )}

                </div>

              )}

            </section>

            {/* =================================
                ECOSYSTEM ACCESS
            ================================= */}

            <section className="dashboard-section">

              <div className="dashboard-section-heading">

                <span>
                  03 / ACCESS
                </span>

                <h2>
                  YOUR
                  <br />
                  <em>
                    ECOSYSTEM.
                  </em>
                </h2>

              </div>

              <div className="dashboard-access-grid">

                <article>

                  <span>
                    WL & GTD
                  </span>

                  <h3>
                    Partner Opportunities
                  </h3>

                  <p>
                    Exclusive whitelist and
                    guaranteed mint opportunities
                    will appear here.
                  </p>

                </article>

                <article>

                  <span>
                    MISSIONS
                  </span>

                  <h3>
                    Earn Rhood Points
                  </h3>

                  <p>
                    Complete ecosystem missions
                    and increase your holder
                    reputation.
                  </p>

                </article>

                <article>

                  <span>
                    REWARDS
                  </span>

                  <h3>
                    Holder Rewards
                  </h3>

                  <p>
                    Future holder-only rewards
                    and drops will be available
                    here.
                  </p>

                </article>

              </div>

            </section>

          </>
        )}

      </main>

      {/* FOOTER */}
      <footer className="dashboard-footer">

        <div className="logo">

          <span className="logo-mark">
            ◆
          </span>

          <span>
            RHOODSTONE
          </span>

        </div>

        <span>
          © 2026 RhoodStone
        </span>

      </footer>

    </div>
  );
}

export default Dashboard;
