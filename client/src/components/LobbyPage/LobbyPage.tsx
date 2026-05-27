import CreateForm from '../CreateForm/CreateForm';
import JoinForm from '../JoinForm/JoinForm';
import './LobbyPage.css';

type ScoringType = 'default' | 'equal';

type LobbyPageProps = {
  isJoinSubmitting: boolean;
  isCreateSubmitting: boolean;
  controlledRoomCode?: string;
  onJoin: (payload: { name: string; roomCode: string }) => void;
  onCreate: (payload: { name: string; rounds: number; scoringType: ScoringType }) => void;
};

function LobbyPage({
  isJoinSubmitting,
  isCreateSubmitting,
  controlledRoomCode = '',
  onJoin,
  onCreate,
}: LobbyPageProps) {
  return (
    <section className="lobby-shell">
      <div className="forms-row">
        <div className="form-slot">
          <JoinForm
            isSubmitting={isJoinSubmitting}
            controlledRoomCode={controlledRoomCode}
            onSubmit={onJoin}
          />
        </div>

        {controlledRoomCode.length === 0 && (
          <div className="form-slot">
            <CreateForm isSubmitting={isCreateSubmitting} onSubmit={onCreate} />
          </div>
        )}
      </div>
    </section>
  );
}

export default LobbyPage;
