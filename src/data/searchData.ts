// src/data/searchData.ts
// Advance Search, with the same filters as the TKU course search page.
import { Day, Session } from './plannerData';

export type Language = 'Chinese' | 'English' | 'Others';
export type TimeOfDay = 'Morning' | 'Noon' | 'Afternoon' | 'Night';
export type Level = 'Undergraduate' | 'Graduate';
export type SearchDay = Day | 'Sat' | 'Sun';

export type Offering = {
  code: string;
  nameEn: string;
  nameZh: string;
  credits: number;
  semester: string;    // '115-1' or '115-2'
  college: string;
  department: string;
  level: Level;
  language: Language;
  teacher: string;
  room: string;
  sessions: Session[];
  seats: number;       // how many students can join
  registered: number;  // how many already joined
};

export type SearchFilters = {
  semester: string;
  keyword: string;
  keywordMode: 'full' | 'name';
  languages: Language[];  // empty = any
  days: SearchDay[];      // empty = any
  times: TimeOfDay[];     // empty = any
  college: string | null; // null = any
  department: string | null;
  level: Level;
  showAvailable: boolean;
  showFull: boolean;
};

export const SEMESTERS = [
  { id: '115-1', label: '2026 Fall' },
  { id: '115-2', label: '2027 Spring' },
];

export const UNITS: { college: string; departments: string[] }[] = [
  { college: 'Engineering', departments: ['Computer Science', 'Electrical Engineering'] },
  { college: 'Social Sciences', departments: ['Public Finance', 'Economics'] },
  { college: 'Liberal Arts', departments: ['Chinese Literature', 'History'] },
  { college: 'General Education', departments: ['General Education'] },
];

// which periods count as morning, noon, afternoon and night
const TIME_PERIODS: Record<TimeOfDay, [number, number]> = {
  Morning: [1, 4],
  Noon: [5, 5],
  Afternoon: [6, 9],
  Night: [10, 14],
};

export const DEFAULT_FILTERS: SearchFilters = {
  semester: '115-2',
  keyword: '',
  keywordMode: 'full',
  languages: [],
  days: [],
  times: [],
  college: null,
  department: null,
  level: 'Undergraduate',
  showAvailable: true,
  showFull: false,
};

const s = (day: Day, start: number, end: number): Session => ({ day, start, end });

const MOCK_OFFERINGS: Offering[] = [
  { code: 'TCSXB8A', nameEn: 'Mobile App Design', nameZh: '行動應用設計', credits: 3, semester: '115-2', college: 'Engineering', department: 'Computer Science', level: 'Undergraduate', language: 'English', teacher: 'Prof. Lin', room: 'E 507', sessions: [s('Mon', 2, 4)], seats: 50, registered: 38 },
  { code: 'TCSXB8B', nameEn: 'Deep Learning', nameZh: '深度學習', credits: 3, semester: '115-2', college: 'Engineering', department: 'Computer Science', level: 'Undergraduate', language: 'Chinese', teacher: 'Dr. Chang', room: 'E 311', sessions: [s('Tue', 6, 8)], seats: 60, registered: 60 },
  { code: 'TCSXB8C', nameEn: 'Web Security', nameZh: '網路安全', credits: 3, semester: '115-2', college: 'Engineering', department: 'Computer Science', level: 'Undergraduate', language: 'English', teacher: 'Dr. Chen', room: 'E 412', sessions: [s('Thu', 2, 4)], seats: 45, registered: 21 },
  { code: 'TCSXM1A', nameEn: 'Advanced Algorithms', nameZh: '高等演算法', credits: 3, semester: '115-2', college: 'Engineering', department: 'Computer Science', level: 'Graduate', language: 'English', teacher: 'Prof. Wu', room: 'E 803', sessions: [s('Wed', 2, 4)], seats: 30, registered: 12 },
  { code: 'TEEXB3D', nameEn: 'Embedded Systems', nameZh: '嵌入式系統', credits: 3, semester: '115-2', college: 'Engineering', department: 'Electrical Engineering', level: 'Undergraduate', language: 'Chinese', teacher: 'Prof. Huang', room: 'E 215', sessions: [s('Fri', 2, 4)], seats: 40, registered: 33 },
  { code: 'TLPXB2A', nameEn: 'Public Finance', nameZh: '財政學', credits: 3, semester: '115-2', college: 'Social Sciences', department: 'Public Finance', level: 'Undergraduate', language: 'English', teacher: 'Prof. Kao', room: 'B 1012', sessions: [s('Mon', 2, 4)], seats: 60, registered: 47 },
  { code: 'TLPXB3C', nameEn: 'Tax Policy', nameZh: '租稅政策', credits: 2, semester: '115-2', college: 'Social Sciences', department: 'Public Finance', level: 'Undergraduate', language: 'Chinese', teacher: 'Dr. Tsai', room: 'B 711', sessions: [s('Wed', 7, 8)], seats: 50, registered: 50 },
  { code: 'TLEXB1B', nameEn: 'Principles of Economics', nameZh: '經濟學原理', credits: 3, semester: '115-2', college: 'Social Sciences', department: 'Economics', level: 'Undergraduate', language: 'English', teacher: 'Prof. Yang', room: 'B 302', sessions: [s('Tue', 2, 3), s('Thu', 3, 3)], seats: 80, registered: 64 },
  { code: 'TACXB2A', nameEn: 'Modern Chinese Fiction', nameZh: '現代小說', credits: 2, semester: '115-2', college: 'Liberal Arts', department: 'Chinese Literature', level: 'Undergraduate', language: 'Chinese', teacher: 'Prof. Hsu', room: 'L 413', sessions: [s('Thu', 6, 7)], seats: 50, registered: 28 },
  { code: 'TAHXB2C', nameEn: 'History of Taiwan', nameZh: '臺灣史', credits: 2, semester: '115-2', college: 'Liberal Arts', department: 'History', level: 'Undergraduate', language: 'English', teacher: 'Dr. Lo', room: 'L 209', sessions: [s('Fri', 7, 8)], seats: 45, registered: 19 },
  { code: 'H1023', nameEn: 'Introduction to Philosophy', nameZh: '哲學概論', credits: 2, semester: '115-2', college: 'General Education', department: 'General Education', level: 'Undergraduate', language: 'English', teacher: 'Dr. Sasa', room: 'L 204', sessions: [s('Mon', 3, 4)], seats: 70, registered: 52 },
  { code: 'S1102', nameEn: 'Psychology in Daily Life', nameZh: '生活心理學', credits: 2, semester: '115-2', college: 'General Education', department: 'General Education', level: 'Undergraduate', language: 'Chinese', teacher: 'Dr. Tris', room: 'B 702', sessions: [s('Tue', 7, 8)], seats: 80, registered: 80 },
  { code: 'N1310', nameEn: 'Astronomy Basics', nameZh: '天文學入門', credits: 2, semester: '115-2', college: 'General Education', department: 'General Education', level: 'Undergraduate', language: 'English', teacher: 'Prof. Vanessa', room: 'S 104', sessions: [s('Thu', 3, 4)], seats: 60, registered: 41 },
  { code: 'GELAN03', nameEn: 'Japanese Conversation', nameZh: '日語會話', credits: 2, semester: '115-2', college: 'General Education', department: 'General Education', level: 'Undergraduate', language: 'Others', teacher: 'Ms. Sato', room: 'FL 305', sessions: [s('Wed', 11, 12)], seats: 35, registered: 22 },
  { code: 'TCSXB7B', nameEn: 'Cloud Computing', nameZh: '雲端運算', credits: 3, semester: '115-1', college: 'Engineering', department: 'Computer Science', level: 'Undergraduate', language: 'English', teacher: 'Dr. Chen', room: 'E 501', sessions: [s('Tue', 2, 4)], seats: 50, registered: 50 },
  { code: 'TLPXB1A', nameEn: 'Introduction to Public Finance', nameZh: '財政學概論', credits: 3, semester: '115-1', college: 'Social Sciences', department: 'Public Finance', level: 'Undergraduate', language: 'English', teacher: 'Prof. Kao', room: 'B 1012', sessions: [s('Mon', 2, 4)], seats: 60, registered: 55 },
];

const isFull = (o: Offering) => o.registered >= o.seats;

// BACKEND TODO: GET /courses/search with these filters as query params
// (the offerings table already has semester, teacher, room, day and periods).
export async function searchCourses(filters: SearchFilters): Promise<Offering[]> {
  const word = filters.keyword.trim().toLowerCase();
  return MOCK_OFFERINGS.filter((o) => {
    if (o.semester !== filters.semester) return false;
    if (o.level !== filters.level) return false;
    if (filters.college && o.college !== filters.college) return false;
    if (filters.department && o.department !== filters.department) return false;
    if (filters.languages.length > 0 && !filters.languages.includes(o.language)) return false;
    if (filters.days.length > 0 && !o.sessions.some((x) => filters.days.includes(x.day))) return false;
    if (
      filters.times.length > 0 &&
      !o.sessions.some((x) =>
        filters.times.some((t) => x.start <= TIME_PERIODS[t][1] && x.end >= TIME_PERIODS[t][0])
      )
    ) {
      return false;
    }
    const full = isFull(o);
    if (full && !filters.showFull) return false;
    if (!full && !filters.showAvailable) return false;
    if (word) {
      const names = `${o.nameEn} ${o.nameZh}`.toLowerCase();
      const everything = `${names} ${o.code} ${o.teacher} ${o.department} ${o.room}`.toLowerCase();
      if (!(filters.keywordMode === 'name' ? names : everything).includes(word)) return false;
    }
    return true;
  });
}

export { isFull };
