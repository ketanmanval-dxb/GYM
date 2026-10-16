-- PulseFit sample data. Safe to run repeatedly: existing rows are updated, never duplicated.

INSERT INTO exercises (name, muscle_group, sets, reps, difficulty, rest_seconds, description) VALUES
  -- Chest
  ('Barbell Bench Press',      'Chest', 4, '6–8',       'Intermediate', 120, 'Lower the bar to mid-chest with elbows at ~45°, then drive it up while keeping your shoulder blades pinned.'),
  ('Incline Dumbbell Press',   'Chest', 3, '8–10',      'Intermediate',  90, 'On a 30° bench, press the dumbbells up and slightly together to hit the upper chest.'),
  ('Tempo Push-Up',            'Chest', 3, '15',        'Beginner',      60, 'Three seconds down, one second up. Keep a straight line from head to heels.'),
  ('Cable Crossover Fly',      'Chest', 3, '12',        'Beginner',      60, 'With a soft bend in the elbows, sweep the handles together in a wide hugging arc.'),
  ('Weighted Chest Dip',       'Chest', 3, '8',         'Advanced',     120, 'Lean forward on the bars and lower until your shoulders sit just below your elbows.'),
  -- Back
  ('Conventional Deadlift',    'Back',  5, '5',         'Advanced',     180, 'Brace hard, push the floor away and keep the bar dragging up your legs to lockout.'),
  ('Weighted Pull-Up',         'Back',  4, '6',         'Advanced',     120, 'From a dead hang, pull your chest towards the bar while driving your elbows down.'),
  ('Chest-Supported Row',      'Back',  4, '10',        'Intermediate',  90, 'Chest on an incline bench, row the dumbbells to your hips and squeeze at the top.'),
  ('Lat Pulldown',             'Back',  3, '12',        'Beginner',      60, 'Pull the bar to your upper chest, leading with the elbows. Control the way back up.'),
  ('Single-Arm Dumbbell Row',  'Back',  3, '10 / side', 'Beginner',      60, 'One hand on the bench, row the dumbbell towards your hip without twisting your torso.'),
  -- Legs
  ('Back Squat',               'Legs',  5, '5',         'Advanced',     180, 'Bar on the upper back, sit down between your heels until hips pass the knees, then stand tall.'),
  ('Romanian Deadlift',        'Legs',  4, '8',         'Intermediate', 120, 'Push your hips back with soft knees until you feel a deep hamstring stretch, then return.'),
  ('Walking Lunges',           'Legs',  3, '12 / leg',  'Beginner',      75, 'Take long steps and drop the back knee towards the floor, keeping your torso upright.'),
  ('Leg Press',                'Legs',  4, '12',        'Beginner',      90, 'Feet shoulder-width on the platform, lower until knees reach 90°, and do not lock out.'),
  ('Bulgarian Split Squat',    'Legs',  3, '10 / leg',  'Intermediate',  90, 'Rear foot on a bench, sink straight down on the front leg and drive up through the heel.'),
  -- Arms
  ('Incline Dumbbell Curl',    'Arms',  3, '10',        'Beginner',      60, 'Lying back on an incline bench, curl with elbows pinned to get a long biceps stretch.'),
  ('EZ-Bar Skull Crusher',     'Arms',  3, '10',        'Intermediate',  60, 'Lower the bar towards your forehead by bending only at the elbows, then extend.'),
  ('Close-Grip Bench Press',   'Arms',  4, '8',         'Advanced',      90, 'Hands shoulder-width, elbows tucked, press to lockout to load the triceps.'),
  ('Hammer Curl',              'Arms',  3, '12',        'Beginner',      60, 'Palms facing each other, curl without swinging to build the forearms and brachialis.'),
  ('Cable Rope Pushdown',      'Arms',  3, '12',        'Beginner',      45, 'Keep elbows at your sides and split the rope apart at the bottom of each rep.'),
  -- Core
  ('Plank Hold',               'Core',  3, '60 s',      'Beginner',      45, 'Forearms down, squeeze glutes and abs, and keep your hips level with your shoulders.'),
  ('Hanging Leg Raise',        'Core',  3, '12',        'Intermediate',  60, 'Hang from a bar and lift your legs with control, curling your pelvis up at the top.'),
  ('Ab Wheel Rollout',         'Core',  3, '10',        'Advanced',      60, 'Roll forward from your knees as far as you can without your lower back sagging.'),
  ('Pallof Press',             'Core',  3, '12 / side', 'Beginner',      45, 'Stand side-on to a cable and press the handle straight out, resisting the twist.'),
  ('Dragon Flag',              'Core',  3, '6',         'Advanced',      90, 'Lying on a bench, hold behind your head and lower your rigid body slowly from the shoulders.'),
  -- Cardio
  ('Rower Intervals',          'Cardio', 6, '500 m',    'Intermediate',  90, 'Legs, then hips, then arms. Hold a hard but repeatable pace for each 500 m.'),
  ('Sled Push',                'Cardio', 6, '20 m',     'Advanced',      90, 'Arms locked, body at 45°, drive the sled with short, powerful steps.'),
  ('Assault Bike Sprints',     'Cardio', 8, '20 s',     'Advanced',      40, 'Go all out for 20 seconds using both arms and legs, then recover fully.'),
  ('Jump Rope',                'Cardio', 5, '2 min',    'Beginner',      45, 'Stay light on the balls of your feet and turn the rope with your wrists.'),
  ('Kettlebell Swings',        'Cardio', 4, '20',       'Intermediate',  60, 'Hinge and snap your hips forward so the bell floats to chest height.')
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  sets         = EXCLUDED.sets,
  reps         = EXCLUDED.reps,
  difficulty   = EXCLUDED.difficulty,
  rest_seconds = EXCLUDED.rest_seconds,
  description  = EXCLUDED.description;

-- 10 classes in the current week (Monday start). Times use the session time zone,
-- which `npm run db:setup` sets to your computer's time zone.
INSERT INTO classes (title, coach_name, start_time, duration_minutes, capacity, intensity)
SELECT c.title, c.coach_name, date_trunc('week', now()) + c.offset_from_monday, c.duration_minutes, c.capacity, c.intensity
FROM (VALUES
  ('Sunrise Yoga Flow',     'Maya Chen',    interval '0 days 06:30', 45, 20, 'Low'),
  ('Rhythm Ride Spin',      'Priya Nair',   interval '0 days 18:00', 45, 24, 'Medium'),
  ('Fight Fit Boxing',      'Marcus Cole',  interval '1 days 07:00', 50, 14, 'High'),
  ('Metcon Blast HIIT',     'Jordan Blake', interval '1 days 12:15', 30, 16, 'High'),
  ('Strength Foundations',  'Ava Thompson', interval '2 days 18:30', 60, 12, 'Medium'),
  ('Tempo 45 Spin',         'Leo Martins',  interval '3 days 07:00', 45, 24, 'Medium'),
  ('Power Vinyasa Yoga',    'Sofia Reyes',  interval '3 days 19:00', 50, 20, 'Medium'),
  ('Tabata Burn HIIT',      'Jordan Blake', interval '4 days 12:15', 30, 16, 'High'),
  ('Pads & Power Boxing',   'Marcus Cole',  interval '5 days 09:00', 50, 14, 'High'),
  ('Slow Sunday Stretch',   'Maya Chen',    interval '6 days 10:00', 60, 20, 'Low')
) AS c (title, coach_name, offset_from_monday, duration_minutes, capacity, intensity)
ON CONFLICT (title, start_time) DO UPDATE SET
  coach_name       = EXCLUDED.coach_name,
  duration_minutes = EXCLUDED.duration_minutes,
  capacity         = EXCLUDED.capacity,
  intensity        = EXCLUDED.intensity;
