import CreateForm from "./CreateForm";
import JoinForm from "./JoinForm";

type FormMode = "join" | "create";
type ScoringType = "default" | "equal";

type LobbyPageProps = {
  activeMode: FormMode;
  error: string;
  isSubmitting: boolean;
  onChangeMode: (mode: FormMode) => void;
  onJoin: (payload: { name: string; roomCode: string }) => void;
  onCreate: (payload: {
    name: string;
    rounds: number;
    scoringType: ScoringType;
  }) => void;
};

function LobbyPage({
  activeMode,
  error,
  isSubmitting,
  onChangeMode,
  onJoin,
  onCreate,
}: LobbyPageProps) {
  return (
    <section className="lobby-shell">
      <h1>Boggle Lobby</h1>

      <div className="actions">
        <button
          type="button"
          className={activeMode === "join" ? "active" : ""}
          onClick={() => onChangeMode("join")}
        >
          Join Lobby
        </button>

        <button
          type="button"
          className={activeMode === "create" ? "active" : ""}
          onClick={() => onChangeMode("create")}
        >
          Create Lobby
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="form-slot">
        {activeMode === "join" ? (
          <JoinForm isSubmitting={isSubmitting} onSubmit={onJoin} />
        ) : (
          <CreateForm isSubmitting={isSubmitting} onSubmit={onCreate} />
        )}
      </div>
    </section>
  );
}

export default LobbyPage;
