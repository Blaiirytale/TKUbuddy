// src/data/plannerData.ts
// Everything the Planner needs to know about class times, plus the one
// function the backend replaces later (savePlan).

export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// One meeting of a class, e.g. Monday periods 3 to 4.
export type Session = {
  day: Day;
  start: number; // first period (1-14)
  end: number;   // last period (same as start for a 1-period class)
};

// A course sitting in the planner. Any screen can add one:
// Course Suggestions now, Advance Search later.
export type PlannedCourse = {
  id: string;      // the course code, so the same course can't be added twice
  code: string;
  name: string;
  credits: number;
  sessions: Session[];
  teacher?: string;
  room?: string;
  tag?: string;       // e.g. "Humanities", shown in the course details
  color?: string;     // block color in the timetable (optional)
  shortName?: string; // label for the small timetable block (optional, made automatically)
};

// TKU class periods. Mock times: check them against the official TKU timetable.
export const PERIODS: { period: number; start: string; end: string }[] = [
  { period: 1, start: '08:10', end: '09:00' },
  { period: 2, start: '09:10', end: '10:00' },
  { period: 3, start: '10:10', end: '11:00' },
  { period: 4, start: '11:10', end: '12:00' },
  { period: 5, start: '12:10', end: '13:00' },
  { period: 6, start: '13:10', end: '14:00' },
  { period: 7, start: '14:10', end: '15:00' },
  { period: 8, start: '15:10', end: '16:00' },
  { period: 9, start: '16:10', end: '17:00' },
  { period: 10, start: '17:10', end: '18:00' },
  { period: 11, start: '18:20', end: '19:05' },
  { period: 12, start: '19:10', end: '19:55' },
  { period: 13, start: '20:10', end: '20:55' },
  { period: 14, start: '21:00', end: '21:45' },
];

// The semester being planned and the credit rules for it.
// BACKEND TODO: these can come from the server later.
export const PLAN_SEMESTER = '115-2';
export const CREDIT_LIMIT = { min: 9, max: 25 };
export const GRADUATION_CREDITS = 128;

// "Mon 3-4" or "Mon 3-4, Wed 2"  ->  [{ day: 'Mon', start: 3, end: 4 }, { day: 'Wed', start: 2, end: 2 }]
export function parseSchedule(text: string): Session[] {
  return text
    .split(',')
    .map((part) => part.trim().match(/^(Mon|Tue|Wed|Thu|Fri)\s+(\d+)(?:\s*-\s*(\d+))?$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => {
      const first = Number(match[2]);
      const last = match[3] ? Number(match[3]) : first;
      return { day: match[1] as Day, start: Math.min(first, last), end: Math.max(first, last) };
    });
}

// [{ Mon 3-4 }, { Wed 2 }]  ->  "Mon 3-4 · Wed 2"
export function formatSessions(sessions: Session[]) {
  if (sessions.length === 0) return 'Time TBA';
  return sessions
    .map((s) => (s.start === s.end ? `${s.day} ${s.start}` : `${s.day} ${s.start}-${s.end}`))
    .join(' · ');
}

// { Mon 3-4 }  ->  "10:10-12:00"
export function sessionClock(session: Session) {
  const first = PERIODS.find((p) => p.period === session.start);
  const last = PERIODS.find((p) => p.period === session.end);
  return first && last ? `${first.start}-${last.end}` : '';
}

// two meetings clash when they are on the same day and their periods overlap
function overlaps(a: Session, b: Session) {
  return a.day === b.day && a.start <= b.end && b.start <= a.end;
}

// which planned courses clash in time with this course
export function findConflicts(course: PlannedCourse, planned: PlannedCourse[]) {
  return planned.filter(
    (other) =>
      other.id !== course.id &&
      other.sessions.some((a) => course.sessions.some((b) => overlaps(a, b)))
  );
}

// "115-2" -> "Spring 2027" (Taiwan year + 1911)
export function semesterName(semester: string) {
  const [year, term] = semester.split('-').map(Number);
  const westernYear = year + 1911;
  return term === 1 ? `Fall ${westernYear}` : `Spring ${westernYear + 1}`;
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: string };

// BACKEND TODO: replace the inside with a real request, for example
//   POST /students/:studentId/plans   body: { semester, courses }
// Keep the name and the SaveResult return shape, and the Planner keeps working.
export async function savePlan(
  studentId: string,
  semester: string,
  courses: PlannedCourse[]
): Promise<SaveResult> {
  await new Promise((resolve) => setTimeout(resolve, 500)); // fake network time
  return { ok: true, savedAt: new Date().toISOString() };
}
