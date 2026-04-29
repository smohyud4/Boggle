import { useState } from "react";
import type { FormEvent } from "react";
import "./JoinForm.css";

type JoinFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: { name: string; roomCode: string }) => void;
};

function JoinForm({ isSubmitting, onSubmit }: JoinFormProps) {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ name, roomCode });
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Join Lobby</h2>
      <label className="field">
        <span>Player name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
          maxLength={24}
          required
        />
      </label>

      <label className="field">
        <span>Room code</span>
        <input
          value={roomCode}
          onChange={(event) => setRoomCode(event.target.value)}
          placeholder="e.g. ABC123"
          maxLength={12}
          required
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Joining..." : "Join"}
      </button>
    </form>
  );
}

export default JoinForm;
