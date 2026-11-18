import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity data is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string' ||
    typeof teamId !== 'string' ||
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity references a missing user or team'), { status: 404 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toJSON();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team data is required'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (mascot !== undefined && typeof mascot !== 'string') {
    throw Object.assign(new Error('Invalid team mascot'), { status: 400 });
  }

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    throw Object.assign(new Error('Invalid team members'), { status: 400 });
  }

  if (memberIds.length > 0) {
    const foundMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
    if (foundMembers.length !== memberIds.length) {
      throw Object.assign(new Error('Team references a missing user'), { status: 404 });
    }
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: typeof mascot === 'string' ? mascot.trim() : '',
    members: memberIds,
  });
  return team.toJSON();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({
    _id: { $in: totals.map((total) => total._id) },
  }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map((total) => ({
      teamName: teamNames.get(total._id.toString()),
      totalPoints: total.totalPoints,
    }))
    .filter((entry): entry is { teamName: string; totalPoints: number } => Boolean(entry.teamName))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  if (typeof userEmail !== 'string' || !userEmail.trim()) {
    throw Object.assign(new Error('A user email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: decodeURIComponent(userEmail).trim() }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();
  const focus = user.fitnessGoal || recentActivity?.type;
  const workouts = await Workout.find({}).lean();
  const selected = (focus
    ? workouts.find((workout) => workout.focus === focus)
    : undefined) ?? workouts[0];

  if (!selected) return [];

  const reason = recentActivity
    ? `Recommended for your recent ${recentActivity.type} activity and ${focus} goal.`
    : `Recommended to support your ${focus} fitness goal.`;

  return [{ ...selected, reason }];
}

export { User };
