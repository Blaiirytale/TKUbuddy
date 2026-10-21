// src/data/eventsData.ts
// Important school dates, and how long until each one.

export type EventCategory = 'registration' | 'exam' | 'deadline' | 'holiday' | 'semester' | 'graduation';

export type SchoolEvent = {
  id: string;
  title: string;          // shown before it starts, e.g. "Add & drop opens"
  ongoingTitle?: string;  // shown while it's happening, e.g. "Add & drop closes"
  category: EventCategory;
  start: string;          // 'YYYY-MM-DD HH:mm', TKU time
  end?: string;           // for things that last several days
  link?: '/schedule' | '/missing' | '/planner' | '/search';
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  registration: 'Registration',
  exam: 'Exams',
  deadline: 'Deadline',
  holiday: 'No class',
  semester: 'Semester',
  graduation: 'Graduation',
};

export const CALENDAR_URL = 'https://english.tku.edu.tw/calendar.asp';

// From TKU's 2026~2027 academic calendar (english.tku.edu.tw/calendar.asp).
// The calendar gives dates only, so events start at 00:00 and end at 23:59.
const MOCK_EVENTS: SchoolEvent[] = [
  { id: 'adddrop-1151', title: 'Add & drop opens', ongoingTitle: 'Add & drop closes', category: 'registration', start: '2026-09-14 00:00', end: '2026-09-22 23:59', link: '/schedule' },
  { id: 'retrocession', title: 'Taiwan Retrocession Day', category: 'holiday', start: '2026-10-26 00:00' },
  { id: 'coursedrop-1151', title: 'Midterm course-drop', ongoingTitle: 'Midterm course-drop closes', category: 'deadline', start: '2026-12-07 00:00', end: '2026-12-11 23:59', link: '/schedule' },
  { id: 'constitution', title: 'Constitution Day', category: 'holiday', start: '2026-12-25 00:00' },
  { id: 'finals-1151', title: 'Final assessment weeks', ongoingTitle: 'Final assessment ends', category: 'exam', start: '2026-12-28 00:00', end: '2027-01-10 23:59' },
  { id: 'prereg-1152', title: 'Spring pre-enrollment', ongoingTitle: 'Pre-enrollment closes', category: 'registration', start: '2027-01-11 00:00', end: '2027-01-19 23:59', link: '/planner' },
  { id: 'winter', title: 'Winter vacation', ongoingTitle: 'Winter vacation ends', category: 'holiday', start: '2027-01-18 00:00', end: '2027-02-21 23:59' },
  { id: 'classes-1152', title: 'Spring classes begin', category: 'semester', start: '2027-02-22 00:00' },
  { id: 'adddrop-1152', title: 'Add & drop opens', ongoingTitle: 'Add & drop closes', category: 'registration', start: '2027-02-22 00:00', end: '2027-03-02 23:59', link: '/schedule' },
  { id: 'coursedrop-1152', title: 'Midterm course-drop', ongoingTitle: 'Midterm course-drop closes', category: 'deadline', start: '2027-05-17 00:00', end: '2027-05-21 23:59', link: '/schedule' },
  { id: 'senior-exams', title: 'Exams for graduating seniors', ongoingTitle: 'Senior exams end', category: 'exam', start: '2027-05-31 00:00', end: '2027-06-06 23:59' },
  { id: 'graduation', title: 'TKU Graduation Ceremony', category: 'graduation', start: '2027-06-05 00:00', link: '/missing' },
  { id: 'finals-1152', title: 'Final assessment weeks', ongoingTitle: 'Final assessment ends', category: 'exam', start: '2027-06-07 00:00', end: '2027-06-20 23:59' },
];

// BACKEND TODO: GET /events (school calendar), plus the student's own registration slot
export async function fetchEvents(): Promise<SchoolEvent[]> {
  return MOCK_EVENTS;
}

// '2026-11-09 08:10' -> Date in the phone's time zone
export function toDate(text: string) {
  const [day, time = '00:00'] = text.split(' ');
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 'Mon, Nov 9' or 'Nov 9 – 13' or 'Dec 28 – Dec 31'
export function dateText(event: SchoolEvent) {
  const s = toDate(event.start);
  if (!event.end) {
    const time = event.start.includes(' 00:00') ? '' : ` · ${event.start.split(' ')[1]}`;
    return `${WEEKDAYS[s.getDay()]}, ${MONTHS[s.getMonth()]} ${s.getDate()}${time}`;
  }
  const e = toDate(event.end);
  const endText = e.getMonth() === s.getMonth() ? `${e.getDate()}` : `${MONTHS[e.getMonth()]} ${e.getDate()}`;
  return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${endText}`;
}

export type Countdown = {
  state: 'upcoming' | 'ongoing' | 'past';
  title: string;
  value: number;
  unit: string; // DAYS, DAY, HOURS, HOUR, MINUTES
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function until(target: Date, now: Date) {
  const days = Math.round((startOfDay(target) - startOfDay(now)) / 86400000);
  if (days >= 1) return { value: days, unit: days === 1 ? 'DAY' : 'DAYS' };
  const minutes = Math.max(Math.ceil((target.getTime() - now.getTime()) / 60000), 0);
  if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60);
    return { value: hours, unit: hours === 1 ? 'HOUR' : 'HOURS' };
  }
  return { value: minutes, unit: 'MINUTES' };
}

export function countdown(event: SchoolEvent, now: Date): Countdown {
  const start = toDate(event.start);
  const end = event.end ? toDate(event.end) : start;
  if (now < start) return { state: 'upcoming', title: event.title, ...until(start, now) };
  if (event.end && now < end) {
    return { state: 'ongoing', title: event.ongoingTitle ?? event.title, ...until(end, now) };
  }
  return { state: 'past', title: event.title, value: 0, unit: 'DAYS' };
}

// events still to come (or happening now), soonest first
export function upcomingEvents(events: SchoolEvent[], now: Date) {
  return events
    .filter((e) => countdown(e, now).state !== 'past')
    .sort((a, b) => toDate(a.start).getTime() - toDate(b.start).getTime());
}
