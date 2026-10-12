// src/data/historyData.ts
// Data contract for the Course History screen.
// BACKEND TODO: replace the body of fetchCourseHistory with a real request
// (e.g. GET /students/:id/enrollments). Keep the returned shape the same
// and no UI code needs to change.

export type CourseStatus = 'passed' | 'failed' | 'dropped' | 'in_progress';

export type HistoryCourse = {
  id: string;
  code: string;         // e.g. "TCSXB1A"
  name: string;
  credits: number;
  semester: string;     // academic year - term, e.g. "114-1"
  status: CourseStatus;
  score: number | null; // null while in progress or dropped
  autoTags: string[];   // comes from the school data (GE field, Required...)
};

export type CourseHistory = {
  courses: HistoryCourse[];
};

// Only passed courses count toward credits (failed / dropped do not).
export const countsTowardCredits = (c: HistoryCourse) => c.status === 'passed';

// Short helper so the mock list stays readable: [code, name, credits, semester, status, score, tags]
type Row = [string, string, number, string, CourseStatus, number | null, string[]];

const MOCK_ROWS: Row[] = [
  // ---- 112-1 (19 credits) ----
  ['TCSXB1A', 'Introduction to Computer Science', 3, '112-1', 'passed', 86, ['Major', 'Required']],
  ['TCSXB1B', 'Programming I',                      3, '112-1', 'passed', 91, ['Major', 'Required']],
  ['MATH101', 'Calculus I',                         3, '112-1', 'passed', 74, ['Required']],
  ['MATH103', 'Discrete Mathematics',               3, '112-1', 'passed', 80, ['Major', 'Required']],
  ['CHI101',  'Chinese Composition',                2, '112-1', 'passed', 83, ['Language', 'Required']],
  ['ENG101',  'English I',                          2, '112-1', 'passed', 88, ['Language', 'Required']],
  ['GEHUM01', 'Introduction to Art',                2, '112-1', 'passed', 92, ['Humanities', 'GE']],
  ['PE101',   'Physical Education I',               1, '112-1', 'passed', 90, ['PE', 'Required']],

  // ---- 112-2 (19 credits) ----
  ['TCSXB2A', 'Programming II',                     3, '112-2', 'passed', 89, ['Major', 'Required']],
  ['TCSXB2B', 'Digital Logic',                      3, '112-2', 'passed', 77, ['Major', 'Required']],
  ['MATH102', 'Calculus II',                        3, '112-2', 'passed', 68, ['Required']],
  ['MATH104', 'Linear Algebra',                     3, '112-2', 'passed', 72, ['Required']],
  ['CHI102',  'Chinese Literature',                 2, '112-2', 'passed', 85, ['Language', 'Required']],
  ['ENG102',  'English II',                         2, '112-2', 'passed', 87, ['Language', 'Required']],
  ['GESCI03', 'Everyday Physics',                   2, '112-2', 'passed', 78, ['Science', 'GE']],
  ['PE102',   'Physical Education II',              1, '112-2', 'passed', 91, ['PE', 'Required']],

  // ---- 113-1 (19 credits) ----
  ['TCSXB3A', 'Data Structures',                    3, '113-1', 'passed', 88, ['Major', 'Required']],
  ['TCSXB3B', 'Computer Organization',              3, '113-1', 'passed', 75, ['Major', 'Required']],
  ['TCSXB3C', 'Object-Oriented Programming',        3, '113-1', 'passed', 90, ['Major', 'Required']],
  ['MATH201', 'Probability',                        3, '113-1', 'passed', 70, ['Required']],
  ['ENG201',  'English III',                        2, '113-1', 'passed', 86, ['Language', 'Required']],
  ['GESOC02', 'Introduction to Psychology',         2, '113-1', 'passed', 93, ['Social Science', 'GE']],
  ['GEHUM05', 'Music Appreciation',                 2, '113-1', 'passed', 89, ['Humanities', 'GE']],
  ['PE201',   'Physical Education III',             1, '113-1', 'passed', 92, ['PE', 'Required']],

  // ---- 113-2 (19 credits passed, 1 dropped) ----
  ['TCSXB4A', 'Algorithms',                         3, '113-2', 'passed', 79, ['Major', 'Required']],
  ['TCSXB4B', 'Operating Systems',                  3, '113-2', 'passed', 73, ['Major', 'Required']],
  ['TCSXB4C', 'Web Programming',                    3, '113-2', 'passed', 94, ['Major', 'Elective']],
  ['MATH202', 'Statistics',                         3, '113-2', 'passed', 76, ['Required']],
  ['ENG202',  'English IV',                         2, '113-2', 'passed', 85, ['Language', 'Required']],
  ['GESOC06', 'Introduction to Economics',          2, '113-2', 'passed', 81, ['Social Science', 'GE']],
  ['GESCI08', 'Environmental Science',              2, '113-2', 'passed', 84, ['Science', 'GE']],
  ['PE202',   'Physical Education IV',              1, '113-2', 'passed', 90, ['PE', 'Required']],
  ['GEHUM09', 'Film Appreciation',                  2, '113-2', 'dropped', null, ['Humanities', 'GE']],

  // ---- 114-1 (21 credits passed, 1 failed) ----
  ['TCSXB5A', 'Database Systems',                   3, '114-1', 'passed', 87, ['Major', 'Required']],
  ['TCSXB5B', 'Computer Networks',                  3, '114-1', 'passed', 78, ['Major', 'Required']],
  ['TCSXB5C', 'Software Engineering',               3, '114-1', 'passed', 85, ['Major', 'Required']],
  ['TCSXB5D', 'Artificial Intelligence',            3, '114-1', 'passed', 82, ['Major', 'Elective']],
  ['TCSXB5E', 'Computer Graphics',                  3, '114-1', 'passed', 80, ['Major', 'Elective']],
  ['TCSXB5F', 'Theory of Computation',              3, '114-1', 'failed', 52, ['Major', 'Required']],
  ['JPN101',  'Japanese I',                         2, '114-1', 'passed', 88, ['Language', 'Elective']],
  ['GEHUM12', 'Philosophy of Life',                 2, '114-1', 'passed', 90, ['Humanities', 'GE']],
  ['GEGEN04', 'Professional Ethics',                2, '114-1', 'passed', 91, ['General', 'GE']],

  // ---- 114-2 (19 credits) ----
  ['TCSXB5F', 'Theory of Computation (retake)',     3, '114-2', 'passed', 65, ['Major', 'Required']],
  ['TCSXB6A', 'Machine Learning',                   3, '114-2', 'passed', 84, ['Major', 'Elective']],
  ['TCSXB6B', 'Information Security',               3, '114-2', 'passed', 79, ['Major', 'Elective']],
  ['TCSXB6C', 'Mobile App Development',             3, '114-2', 'passed', 93, ['Major', 'Elective']],
  ['TCSXB6D', 'Capstone Project I',                 3, '114-2', 'passed', 90, ['Major', 'Required']],
  ['JPN102',  'Japanese II',                        2, '114-2', 'passed', 86, ['Language', 'Elective']],
  ['GESOC10', 'Introduction to Sociology',          2, '114-2', 'passed', 88, ['Social Science', 'GE']],

  // ---- 115-1 (current semester, in progress) ----
  ['TCSXB7A', 'Capstone Project II',                3, '115-1', 'in_progress', null, ['Major', 'Required']],
  ['TCSXB7B', 'Cloud Computing',                    3, '115-1', 'in_progress', null, ['Major', 'Elective']],
  ['TCSXB7C', 'Human-Computer Interaction',         3, '115-1', 'in_progress', null, ['Major', 'Elective']],
  ['GEHUM15', 'Modern Dance',                       2, '115-1', 'in_progress', null, ['Humanities', 'GE']],
];

const MOCK_HISTORY: HistoryCourse[] = MOCK_ROWS.map(
  ([code, name, credits, semester, status, score, autoTags], i) => ({
    id: String(i + 1),
    code,
    name,
    credits,
    semester,
    status,
    score,
    autoTags,
  })
);

// BACKEND TODO: swap this for a real API call.
export async function fetchCourseHistory(studentId: string): Promise<CourseHistory> {
  await new Promise((resolve) => setTimeout(resolve, 300)); // fake loading time
  return { courses: MOCK_HISTORY };
}
