// Realistic mock data for PulseFit. Replace with API calls when a backend exists.

export const user = {
  name: 'Alex Rivera',
  handle: '@alexlifts',
  initials: 'AR',
  membership: 'Pro Elite',
  memberSince: 'March 2024',
  homeGym: 'PulseFit Downtown',
  level: 14,
  xp: 7420,
  xpNext: 9000,
  streak: 12,
  bestStreak: 31,
  weeklyGoal: 5,
}

export const landingStats = [
  { label: 'Active members', value: 48250, suffix: '+' },
  { label: 'Workouts completed', value: 1280000, suffix: '+', compact: true },
  { label: 'Classes this week', value: 342, suffix: '' },
]

export const quotes = [
  { text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { text: 'Strength doesn’t come from what you can do. It comes from overcoming what you once thought you couldn’t.', author: 'Rikki Rogers' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Success isn’t always about greatness. It’s about consistency.', author: 'Dwayne Johnson' },
  { text: 'Your body can stand almost anything. It’s your mind you have to convince.', author: 'Unknown' },
  { text: 'Fall in love with taking care of yourself.', author: 'Unknown' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Robin Sharma' },
]

export function quoteOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const day = Math.floor((date - start) / 86400000)
  return quotes[day % quotes.length]
}

// Dashboard
export const weeklyActivity = [
  { day: 'Mon', minutes: 52 },
  { day: 'Tue', minutes: 38 },
  { day: 'Wed', minutes: 0 },
  { day: 'Thu', minutes: 64 },
  { day: 'Fri', minutes: 45 },
  { day: 'Sat', minutes: 72 },
  { day: 'Sun', minutes: 28 },
]

export const weeklyRings = [
  { key: 'workouts', label: 'Workouts', value: 4, goal: 5, unit: '' },
  { key: 'minutes', label: 'Active min', value: 299, goal: 360, unit: '' },
  { key: 'goals', label: 'Goals hit', value: 7, goal: 10, unit: '' },
]

export const muscleGroups = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export const exercises = [
  { id: 'bench', name: 'Barbell Bench Press', group: 'Chest', sets: 4, reps: '6–8', rest: 120, difficulty: 'Intermediate', equipment: 'Barbell', kcal: 95 },
  { id: 'incline-db', name: 'Incline Dumbbell Press', group: 'Chest', sets: 3, reps: '8–10', rest: 90, difficulty: 'Intermediate', equipment: 'Dumbbells', kcal: 80 },
  { id: 'pushup', name: 'Tempo Push-Up', group: 'Chest', sets: 3, reps: '15', rest: 60, difficulty: 'Beginner', equipment: 'Bodyweight', kcal: 55 },
  { id: 'cable-fly', name: 'Cable Crossover Fly', group: 'Chest', sets: 3, reps: '12', rest: 60, difficulty: 'Beginner', equipment: 'Cable', kcal: 50 },
  { id: 'deadlift', name: 'Conventional Deadlift', group: 'Back', sets: 5, reps: '5', rest: 180, difficulty: 'Advanced', equipment: 'Barbell', kcal: 130 },
  { id: 'pullup', name: 'Weighted Pull-Up', group: 'Back', sets: 4, reps: '6', rest: 120, difficulty: 'Advanced', equipment: 'Pull-up bar', kcal: 85 },
  { id: 'row', name: 'Chest-Supported Row', group: 'Back', sets: 4, reps: '10', rest: 90, difficulty: 'Intermediate', equipment: 'Dumbbells', kcal: 70 },
  { id: 'lat-pull', name: 'Lat Pulldown', group: 'Back', sets: 3, reps: '12', rest: 60, difficulty: 'Beginner', equipment: 'Cable', kcal: 60 },
  { id: 'squat', name: 'Back Squat', group: 'Legs', sets: 5, reps: '5', rest: 180, difficulty: 'Advanced', equipment: 'Barbell', kcal: 140 },
  { id: 'rdl', name: 'Romanian Deadlift', group: 'Legs', sets: 4, reps: '8', rest: 120, difficulty: 'Intermediate', equipment: 'Barbell', kcal: 110 },
  { id: 'lunge', name: 'Walking Lunges', group: 'Legs', sets: 3, reps: '12 / leg', rest: 75, difficulty: 'Beginner', equipment: 'Dumbbells', kcal: 90 },
  { id: 'leg-press', name: 'Leg Press', group: 'Legs', sets: 4, reps: '12', rest: 90, difficulty: 'Beginner', equipment: 'Machine', kcal: 95 },
  { id: 'curl', name: 'Incline Dumbbell Curl', group: 'Arms', sets: 3, reps: '10', rest: 60, difficulty: 'Beginner', equipment: 'Dumbbells', kcal: 40 },
  { id: 'skull', name: 'EZ-Bar Skull Crusher', group: 'Arms', sets: 3, reps: '10', rest: 60, difficulty: 'Intermediate', equipment: 'EZ-bar', kcal: 45 },
  { id: 'dip', name: 'Weighted Dips', group: 'Arms', sets: 3, reps: '8', rest: 90, difficulty: 'Advanced', equipment: 'Dip bars', kcal: 65 },
  { id: 'hammer', name: 'Hammer Curl', group: 'Arms', sets: 3, reps: '12', rest: 60, difficulty: 'Beginner', equipment: 'Dumbbells', kcal: 40 },
  { id: 'plank', name: 'Plank Hold', group: 'Core', sets: 3, reps: '60 s', rest: 45, difficulty: 'Beginner', equipment: 'Bodyweight', kcal: 30 },
  { id: 'hanging', name: 'Hanging Leg Raise', group: 'Core', sets: 3, reps: '12', rest: 60, difficulty: 'Intermediate', equipment: 'Pull-up bar', kcal: 40 },
  { id: 'abwheel', name: 'Ab Wheel Rollout', group: 'Core', sets: 3, reps: '10', rest: 60, difficulty: 'Advanced', equipment: 'Ab wheel', kcal: 45 },
  { id: 'pallof', name: 'Pallof Press', group: 'Core', sets: 3, reps: '12 / side', rest: 45, difficulty: 'Beginner', equipment: 'Cable', kcal: 30 },
  { id: 'rower', name: 'Rower Intervals', group: 'Cardio', sets: 6, reps: '500 m', rest: 90, difficulty: 'Intermediate', equipment: 'Rower', kcal: 220 },
  { id: 'sled', name: 'Sled Push', group: 'Cardio', sets: 6, reps: '20 m', rest: 90, difficulty: 'Advanced', equipment: 'Sled', kcal: 180 },
  { id: 'bike', name: 'Assault Bike Sprints', group: 'Cardio', sets: 8, reps: '20 s', rest: 40, difficulty: 'Advanced', equipment: 'Air bike', kcal: 160 },
  { id: 'jumprope', name: 'Jump Rope', group: 'Cardio', sets: 5, reps: '2 min', rest: 45, difficulty: 'Beginner', equipment: 'Rope', kcal: 120 },
]

export const todaysWorkout = {
  id: 'push-power',
  title: 'Push Power',
  subtitle: 'Chest · Shoulders · Triceps',
  duration: 48,
  kcal: 410,
  focus: 'Strength',
  exerciseIds: ['bench', 'incline-db', 'dip', 'cable-fly', 'skull'],
}

// Progress — estimated 1-rep max (kg) over 12 weeks
export const strengthHistory = [
  { week: 'W1', bench: 82.5, squat: 110, deadlift: 140 },
  { week: 'W2', bench: 85, squat: 112.5, deadlift: 142.5 },
  { week: 'W3', bench: 85, squat: 117.5, deadlift: 147.5 },
  { week: 'W4', bench: 87.5, squat: 120, deadlift: 150 },
  { week: 'W5', bench: 87.5, squat: 122.5, deadlift: 155 },
  { week: 'W6', bench: 90, squat: 125, deadlift: 157.5 },
  { week: 'W7', bench: 92.5, squat: 127.5, deadlift: 160 },
  { week: 'W8', bench: 92.5, squat: 130, deadlift: 165 },
  { week: 'W9', bench: 95, squat: 132.5, deadlift: 167.5 },
  { week: 'W10', bench: 97.5, squat: 135, deadlift: 170 },
  { week: 'W11', bench: 97.5, squat: 140, deadlift: 175 },
  { week: 'W12', bench: 100, squat: 142.5, deadlift: 180 },
]

export const lifts = [
  { key: 'bench', label: 'Bench Press' },
  { key: 'squat', label: 'Back Squat' },
  { key: 'deadlift', label: 'Deadlift' },
]

export const personalRecords = [
  { id: 1, lift: 'Deadlift', value: '180 kg', date: 'Oct 12', delta: '+5 kg', tier: 'gold' },
  { id: 2, lift: 'Back Squat', value: '142.5 kg', date: 'Oct 10', delta: '+2.5 kg', tier: 'gold' },
  { id: 3, lift: 'Bench Press', value: '100 kg', date: 'Oct 08', delta: '+2.5 kg', tier: 'gold' },
  { id: 4, lift: 'Weighted Pull-Up', value: '+30 kg × 5', date: 'Sep 29', delta: '+5 kg', tier: 'silver' },
  { id: 5, lift: '5 km Run', value: '22:48', date: 'Sep 21', delta: '−0:41', tier: 'silver' },
  { id: 6, lift: '2 km Row', value: '7:31', date: 'Sep 02', delta: '−0:09', tier: 'bronze' },
]

// Class booking
export const classTypes = ['Yoga', 'HIIT', 'Spin', 'Boxing']

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const C = (id, day, type, title, time, duration, coach, room, capacity, booked, intensity) => ({
  id, day, type, title, time, duration, coach, room, capacity, booked, intensity,
})

export const classes = [
  C('c1', 'Mon', 'Yoga', 'Sunrise Flow', '06:30', 45, 'Maya Chen', 'Studio A', 20, 14, 'Low'),
  C('c2', 'Mon', 'HIIT', 'Metcon Blast', '12:15', 30, 'Jordan Blake', 'Turf Zone', 16, 16, 'High'),
  C('c3', 'Mon', 'Spin', 'Rhythm Ride', '18:00', 45, 'Priya Nair', 'Cycle Lab', 24, 19, 'Medium'),
  C('c4', 'Tue', 'Boxing', 'Fight Fit', '07:00', 50, 'Marcus Cole', 'Ring Room', 14, 9, 'High'),
  C('c5', 'Tue', 'Yoga', 'Power Vinyasa', '12:30', 50, 'Maya Chen', 'Studio A', 20, 18, 'Medium'),
  C('c6', 'Tue', 'Spin', 'Climb & Burn', '19:00', 45, 'Leo Martins', 'Cycle Lab', 24, 11, 'High'),
  C('c7', 'Wed', 'HIIT', 'Tabata Burn', '06:45', 30, 'Jordan Blake', 'Turf Zone', 16, 12, 'High'),
  C('c8', 'Wed', 'Yoga', 'Yin & Restore', '20:00', 60, 'Sofia Reyes', 'Studio B', 18, 7, 'Low'),
  C('c9', 'Thu', 'Boxing', 'Pads & Power', '18:30', 50, 'Marcus Cole', 'Ring Room', 14, 13, 'High'),
  C('c10', 'Thu', 'Spin', 'Tempo 45', '07:00', 45, 'Priya Nair', 'Cycle Lab', 24, 22, 'Medium'),
  C('c11', 'Thu', 'HIIT', 'Engine Builder', '12:15', 40, 'Ava Thompson', 'Turf Zone', 16, 8, 'High'),
  C('c12', 'Fri', 'Yoga', 'Mobility Lab', '07:30', 40, 'Sofia Reyes', 'Studio B', 18, 10, 'Low'),
  C('c13', 'Fri', 'Boxing', 'Friday Night Fights', '19:00', 60, 'Marcus Cole', 'Ring Room', 14, 14, 'High'),
  C('c14', 'Sat', 'Spin', 'Weekend Warrior Ride', '09:00', 60, 'Leo Martins', 'Cycle Lab', 24, 17, 'High'),
  C('c15', 'Sat', 'HIIT', 'Partner WOD', '10:30', 45, 'Ava Thompson', 'Turf Zone', 20, 15, 'High'),
  C('c16', 'Sun', 'Yoga', 'Slow Sunday Stretch', '10:00', 60, 'Maya Chen', 'Studio A', 20, 6, 'Low'),
]

// Profile
export const achievements = [
  { id: 'a1', title: 'First Rep', desc: 'Completed your first workout', icon: 'Dumbbell', unlocked: true },
  { id: 'a2', title: 'On Fire', desc: '7-day workout streak', icon: 'Flame', unlocked: true },
  { id: 'a3', title: 'Centurion', desc: '100 workouts logged', icon: 'Trophy', unlocked: true },
  { id: 'a4', title: 'Early Bird', desc: '10 workouts before 7 am', icon: 'Sunrise', unlocked: true },
  { id: 'a5', title: 'Class Act', desc: 'Attended 25 classes', icon: 'CalendarCheck', unlocked: true },
  { id: 'a6', title: 'Two Plates', desc: 'Bench 100 kg', icon: 'Medal', unlocked: true },
  { id: 'a7', title: 'Iron Month', desc: '30-day workout streak', icon: 'Zap', unlocked: false, progress: 12 / 30 },
  { id: 'a8', title: 'Marathoner', desc: 'Log 42 km of cardio in a week', icon: 'Timer', unlocked: false, progress: 0.55 },
  { id: 'a9', title: 'Triple Threat', desc: 'Total 450 kg across the big three', icon: 'Crown', unlocked: false, progress: 422.5 / 450 },
]

export const profileStats = [
  { label: 'Workouts', value: 186 },
  { label: 'Classes', value: 41 },
  { label: 'Hours', value: 152 },
  { label: 'PRs', value: 23 },
]
