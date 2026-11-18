import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard.'));
  }, []);

  let content;
  if (error) {
    content = <p role="alert">{error}</p>;
  } else if (leaderboard === null) {
    content = <p role="status">Loading leaderboard...</p>;
  } else if (leaderboard.length === 0) {
    content = <p>No leaderboard scores available.</p>;
  } else {
    content = (
      <ol className="list-group list-group-numbered">
        {leaderboard.map((entry) => (
          <li className="list-group-item" key={entry.teamName}>
            {entry.teamName} - {entry.totalPoints} points
          </li>
        ))}
      </ol>
    );
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {content}
    </CapabilityCard>
  );
}
