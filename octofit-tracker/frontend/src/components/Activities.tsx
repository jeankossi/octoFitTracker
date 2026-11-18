import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError('Unable to load activities.'));
  }, []);

  let content;
  if (error) {
    content = <p role="alert">{error}</p>;
  } else if (activities === null) {
    content = <p role="status">Loading activities...</p>;
  } else if (activities.length === 0) {
    content = <p>No activities recorded.</p>;
  } else {
    content = (
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li className="list-group-item" key={`${activity.type}-${index}`}>
            {activity.type} - {activity.minutes} minutes - {activity.points} points
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {content}
    </CapabilityCard>
  );
}
