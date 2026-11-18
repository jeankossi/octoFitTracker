import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions.'));
  }, []);

  let content;
  if (error) {
    content = <p role="alert">{error}</p>;
  } else if (suggestions === null) {
    content = <p role="status">Loading workout suggestions...</p>;
  } else if (suggestions.length === 0) {
    content = <p>No workout suggestions available.</p>;
  } else {
    content = (
      <ul className="list-group">
        {suggestions.map((suggestion) => (
          <li className="list-group-item" key={suggestion.title}>
            <strong>{suggestion.title}</strong>
            {suggestion.reason && <span> - {suggestion.reason}</span>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {content}
    </CapabilityCard>
  );
}
