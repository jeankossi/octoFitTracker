import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  mascot?: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams.'));
  }, []);

  let content;
  if (error) {
    content = <p role="alert">{error}</p>;
  } else if (teams === null) {
    content = <p role="status">Loading teams...</p>;
  } else if (teams.length === 0) {
    content = <p>No teams available.</p>;
  } else {
    content = (
      <ul className="list-group">
        {teams.map((team) => (
          <li className="list-group-item" key={team.name}>
            <strong>{team.name}</strong>
            {team.members.length > 0 && <span> - {team.members.join(', ')}</span>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {content}
    </CapabilityCard>
  );
}
