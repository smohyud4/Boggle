import { useState } from "react";
import type { FormEvent } from "react";
import "./CreateForm.css";

type ScoringType = "default" | "equal";

type CreateFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: {
    name: string;
    rounds: number;
    scoringType: ScoringType;
  }) => void;
};

function CreateForm({ isSubmitting, onSubmit }: CreateFormProps) {
  const [name, setName] = useState("");
  const [rounds, setRounds] = useState("3");
  const [scoringType, setScoringType] = useState<ScoringType>("default");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      name,
      rounds: Number(rounds),
      scoringType,
    });
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Create Lobby</h2>

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
        <span>Number of rounds</span>
        <input
          type="number"
          min={1}
          max={20}
          value={rounds}
          onChange={(event) => setRounds(event.target.value)}
          required
        />
      </label>

      <fieldset className="field radios">
        <legend>Scoring</legend>
        <label>
          <input
            type="radio"
            name="scoringType"
            checked={scoringType === "default"}
            onChange={() => setScoringType("default")}
          />
          Default Scoring
        </label>
        <label>
          <input
            type="radio"
            name="scoringType"
            checked={scoringType === "equal"}
            onChange={() => setScoringType("equal")}
          />
          Equal Scoring
        </label>
      </fieldset>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </button>
    </form>
  );
}

export default CreateForm;
