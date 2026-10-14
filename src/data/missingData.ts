// src/data/missingData.ts
// Same information as TKU's "Lacking in Graduation Credits" page.

export type LackingCourse = {
  code: string;
  nameEn: string;
  nameZh: string;
  yearLevel: number;   // which year it belongs to in the curriculum (1-4)
  semester: 1 | 2;     // which semester it is offered in
  credits: number;
  semesterOrder: number;
};

export type MissingCredits = {
  updated: string; // the date TKU last updated this list, e.g. '115/09/07'
  required: { total: number; compulsory: number; deptSelective: number };
  earned: { total: number; compulsory: number; deptSelective: number };
  lackingCompulsory: LackingCourse[];
};

export const TKU_SSO_URL = 'https://sso.tku.edu.tw/';

const MOCK_MISSING: MissingCredits = {
  updated: '115/09/07',
  required: { total: 128, compulsory: 77, deptSelective: 20 },
  earned: { total: 116, compulsory: 72, deptSelective: 20 },
  lackingCompulsory: [
    {
      code: 'TNUOB1E',
      nameEn: 'Exploring and Implementing Social Issues',
      nameZh: '社會議題探索暨實踐',
      yearLevel: 1,
      semester: 2,
      credits: 1,
      semesterOrder: 2,
    },
    {
      code: 'TCSXB7A',
      nameEn: 'Capstone Project II',
      nameZh: '專題實驗(二)',
      yearLevel: 4,
      semester: 1,
      credits: 3,
      semesterOrder: 0,
    },
    {
      code: 'TNUOB4T',
      nameEn: 'Team Development',
      nameZh: '團隊發展',
      yearLevel: 4,
      semester: 1,
      credits: 1,
      semesterOrder: 0,
    },
  ],
};

// BACKEND TODO: GET /students/:studentId/missing-credits
export async function fetchMissingCredits(studentId: string): Promise<MissingCredits> {
  return MOCK_MISSING;
}

const ORDINAL = ['', '1st', '2nd', '3rd', '4th'];

// 1, 2 -> '1st year · 2nd semester'
export function yearSemesterText(course: LackingCourse) {
  return `${ORDINAL[course.yearLevel]} year · ${ORDINAL[course.semester]} semester`;
}

// '115-1' -> '115-2', '115-2' -> '116-1'
export function nextSemester(semester: string) {
  const [year, term] = semester.split('-').map(Number);
  return term === 1 ? `${year}-2` : `${year + 1}-1`;
}

// the next semester (after the current one) that offers this course
export function nextChance(course: LackingCourse, currentSemester: string) {
  let semester = nextSemester(currentSemester);
  while (Number(semester.split('-')[1]) !== course.semester) semester = nextSemester(semester);
  return semester;
}
