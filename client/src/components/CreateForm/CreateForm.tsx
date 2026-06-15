import { useState } from 'react';
import type { FormEvent } from 'react';
import './CreateForm.css';

type CreateFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: { name: string; rounds: number; boardDimension: number }) => void;
};

const nameRegex = /^[a-zA-Z0-9_]+$/;

function CreateForm({ isSubmitting, onSubmit }: CreateFormProps) {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState('3');
  const [boardDimension, setBoardDimension] = useState(4);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      name,
      rounds: Number(rounds),
      boardDimension,
    });
  };

  return (
    <form id="create-form" onSubmit={handleSubmit}>
      <h2>Create Lobby</h2>

      <label className="field">
        <span>Player name</span>
        <input
          value={name}
          onChange={(event) => {
            const newValue = event.target.value;
            if (newValue.length === 0 || nameRegex.test(newValue)) {
              setName(newValue);
            }
          }}
          placeholder="Enter your name"
          maxLength={18}
          required
        />
      </label>

      <label className="field">
        <span>Number of rounds</span>
        <input
          type="number"
          min={1}
          max={6}
          value={rounds}
          onChange={(event) => setRounds(event.target.value)}
          required
        />
      </label>

      <fieldset className="radios">
        <legend>Board Dimension</legend>
        <div className="label-container">
          <label>
            <input
              type="radio"
              name="boardDimension"
              checked={boardDimension === 4}
              onChange={() => setBoardDimension(4)}
            />
            4x4
          </label>
          <label>
            <input
              type="radio"
              name="boardDimension"
              checked={boardDimension === 5}
              onChange={() => setBoardDimension(5)}
            />
            5x5
          </label>
        </div>
      </fieldset>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}

export default CreateForm;
