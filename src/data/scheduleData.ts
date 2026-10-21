// src/data/scheduleData.ts
// Your timetable for THIS semester: the courses you are registered in.
// Unlike the Planner, you can't change it freely. Dropping (or adding a
// dropped course back) only works during the school's add & drop period.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Day, PERIODS, PlannedCourse, Session } from './plannerData';

export const CURRENT_SEMESTER = '115-1';
export const TKU_ADD_DROP_URL = 'https://www.ais.tku.edu.tw/elecos_english/';

// both days included, written as 'YYYY-MM-DD'
export type AddDropPeriod = { start: string; end: string };

export type ScheduleInfo = {
  semester: string;
  courses: PlannedCourse[]; // registered and attending
  dropped: PlannedCourse[]; // dropped this semester
  addDrop: AddDropPeriod;
};

export type ChangeResult = { ok: true } | { ok: false; reason: string };

// ---------- FAKE DATA ----------
// Same 4 courses as "115-1 in progress" in historyData.ts (11 credits).
const MOCK_ADD_DROP: AddDropPeriod = { start: '2026-09-14', end: '2026-09-22' };

const MOCK_COURSES: PlannedCourse[] = [
  {
    id: 'TCSXB7B',
    code: 'TCSXB7B',
    name: 'Cloud Computing',
    credits: 3,
    sessions: [{ day: 'Tue', start: 2, end: 4 }],
    teacher: 'Dr. Chen',
    room: 'E 501',
    tag: 'Major · Elective',
    color: '#2A9BB8',
  },
  {
    id: 'TCSXB7A',
    code: 'TCSXB7A',
    name: 'Capstone Project II',
    credits: 3,
    sessions: [{ day: 'Wed', start: 6, end: 8 }],
    teacher: 'Prof. Lin',
    room: 'E 680',
    tag: 'Major · Required',
    color: '#E5585A',
  },
  {
    id: 'TCSXB7C',
    code: 'TCSXB7C',
    name: 'Human-Computer Interaction',
    credits: 3,
    sessions: [
      { day: 'Mon', start: 3, end: 4 },
      { day: 'Thu', start: 3, end: 3 },
    ],
    teacher: 'Prof. Wang',
    room: 'B 712',
    tag: 'Major · Elective',
    color: '#8B6FD6',
  },
  {
    id: 'GEHUM15',
    code: 'GEHUM15',
    name: 'Modern Dance',
    credits: 2,
    sessions: [{ day: 'Fri', start: 7, end: 8 }],
    teacher: 'Ms. Huang',
    room: 'Gym 3F',
    tag: 'GE · Humanities',
    color: '#E9B949',
  },
];

// The fake "server" remembers which courses you dropped, on the phone.
const MOCK_DROPPED_KEY = 'tkubuddy.mock.droppedCourses';

async function readDroppedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(MOCK_DROPPED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeDroppedIds(ids: string[]) {
  await AsyncStorage.setItem(MOCK_DROPPED_KEY, JSON.stringify(ids));
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// BACKEND TODO: GET /students/:studentId/schedule?semester=115-1
// Keep the name and the ScheduleInfo shape.
export async function fetchSchedule(studentId: string): Promise<ScheduleInfo> {
  const droppedIds = await readDroppedIds();
  return {
    semester: CURRENT_SEMESTER,
    courses: MOCK_COURSES.filter((c) => !droppedIds.includes(c.id)),
    dropped: MOCK_COURSES.filter((c) => droppedIds.includes(c.id)),
    addDrop: MOCK_ADD_DROP,
  };
}

// BACKEND TODO: POST /students/:studentId/enrollments/:courseId/drop
// The server must check the add & drop dates itself too: never trust the phone's clock.
export async function dropCourse(studentId: string, courseId: string): Promise<ChangeResult> {
  await wait(400); // fake network time
  const ids = await readDroppedIds();
  if (!ids.includes(courseId)) await writeDroppedIds([...ids, courseId]);
  return { ok: true };
}

// BACKEND TODO: POST /students/:studentId/enrollments/:courseId/add
// (A real server would also check that the class still has seats.)
export async function addCourseBack(studentId: string, courseId: string): Promise<ChangeResult> {
  await wait(400);
  const ids = await readDroppedIds();
  await writeDroppedIds(ids.filter((id) => id !== courseId));
  return { ok: true };
}

// ---------- DATE AND TIME HELPERS ----------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => String(n).padStart(2, '0');

// a Date -> '2026-10-13' (in the phone's time zone)
export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// '2026-09-14' -> 'Sep 14'
export function formatDateKey(key: string) {
  const [, month, day] = key.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

// a Date -> 'Tue, Oct 13'
export function formatToday(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// Mon-Fri dates of this week (on a weekend, the coming week)
export function schoolWeek(now: Date) {
  const day = now.getDay();
  const toMonday = day === 0 ? 1 : day === 6 ? 2 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + toMonday);
  return Array.from(
    { length: 5 },
    (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
  );
}

// is the given day inside the add & drop dates?
export function isAddDropOpen(period: AddDropPeriod, now: Date) {
  const today = toDateKey(now);
  return today >= period.start && today <= period.end;
}

// '10:10' -> 610 (minutes after midnight)
function toMinutes(hhmm: string) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

export type ClassSlot = {
  course: PlannedCourse;
  session: Session;
  start: number; // minutes after midnight
  end: number;
  startText: string; // '10:10'
  endText: string; // '12:00'
};

const DAY_NUMBER: Record<Day, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };

// every class on one weekday (0 = Sunday ... 6 = Saturday), earliest first
export function classesOnDay(courses: PlannedCourse[], weekday: number): ClassSlot[] {
  const slots: ClassSlot[] = [];
  for (const course of courses) {
    for (const session of course.sessions) {
      if (DAY_NUMBER[session.day] !== weekday) continue;
      const first = PERIODS.find((p) => p.period === session.start);
      const last = PERIODS.find((p) => p.period === session.end);
      if (!first || !last) continue;
      slots.push({
        course,
        session,
        start: toMinutes(first.start),
        end: toMinutes(last.end),
        startText: first.start,
        endText: last.end,
      });
    }
  }
  return slots.sort((a, b) => a.start - b.start);
}

// the next class that hasn't started yet: later today, or the next day that has one
export function findNextClass(courses: PlannedCourse[], now: Date) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
    const weekday = (now.getDay() + daysAhead) % 7;
    const slots = classesOnDay(courses, weekday).filter(
      (slot) => daysAhead > 0 || slot.start > nowMinutes
    );
    if (slots.length > 0) return { ...slots[0], daysAhead, weekday };
  }
  return null;
}
