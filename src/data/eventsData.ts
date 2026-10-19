// src/data/eventsData.ts
// Important school dates, and how long until each one.

export type EventCategory = 'registration' | 'exam' | 'deadline' | 'break' | 'graduation';

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
  break: 'Break',
  graduation: 'Graduation',
};

const MOCK_EVENTS: SchoolEvent[] = [
  { id: 'adddrop-1151', title: 'Add & drop opens', ongoingTitle: 'Add & drop closes', category: 'registration', start: '2026-09-14 09:00', end: '2026-09-25 17:00', link: '/schedule' },
  { id: 'midterms', title: 'Midterm exams', ongoingTitle: 'Midterms end', category: 'exam', start: '2026-11-09 08:10', end: '2026-11-13 17:00' },
  { id: 'withdraw', title: 'Course withdrawal deadline', category: 'deadline', start: '2026-12-04 17:00', link: '/schedule' },
  { id: 'prereg-1152', title: 'Pre-registration · your slot', ongoingTitle: 'Pre-registration closes', category: 'registration', start: '2026-12-28 09:00', end: '2026-12-31 17:00', link: '/planner' },
  { id: 'finals', title: 'Final exams', ongoingTitle: 'Finals end', category: 'exam', start: '2027-01-04 08:10', end: '2027-01-08 17:00' },
  { id: 'winter', title: 'Winter break', category: 'break', start: '2027-01-11 00:00' },
  { id: 'adddrop-1152', title: 'Add & drop opens', ongoingTitle: 'Add & drop closes', category: 'registration', start: '2027-02-15 09:00', end: '2027-02-26 17:00', link: '/schedule' },
  { id: 'gradcheck', title: 'Graduation check update', category: 'graduation', start: '2027-03-01 09:00', link: '/missing' },
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
