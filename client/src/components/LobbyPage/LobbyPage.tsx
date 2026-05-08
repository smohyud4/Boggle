import CreateForm from "../CreateForm/CreateForm";
import JoinForm from "../JoinForm/JoinForm";
import "./LobbyPage.css";

type ScoringType = "default" | "equal";

type LobbyPageProps = {
  error: string;
  isSubmitting: boolean;
  onJoin: (payload: { name: string; roomCode: string }) => void;
  onCreate: (payload: {
    name: string;
    rounds: number;
    scoringType: ScoringType;
  }) => void;
};

function LobbyPage({ error, isSubmitting, onJoin, onCreate }: LobbyPageProps) {
  return (
    <section className="lobby-shell">
      {error ? <p className="error-banner">{error}</p> : null}

      <div className="forms-row">
        <div className="form-slot">
          <JoinForm isSubmitting={isSubmitting} onSubmit={onJoin} />
        </div>

        <div className="form-slot">
          <CreateForm isSubmitting={isSubmitting} onSubmit={onCreate} />
        </div>
      </div>
    </section>
  );
}

export default LobbyPage;
