
// Backend to do return data in exactly this shape and the screen will just work.

export type SuggestionCategory = 'humanities' | 'social' | 'science' | 'required';

export type CourseSuggestion = {
  id: string;
  code: string;         
  name: string;
  credits: number;
  category: SuggestionCategory;
  field: string;         
  teacher: string;
  schedule: string;      
  reason: string;        
  hasConflict: boolean;  
};

export type MissingCredit = {
  category: SuggestionCategory;
  missing: number;       
};

export type SuggestionsResult = {
  missing: MissingCredit[];
  suggestions: CourseSuggestion[];
};

export const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  humanities: 'Humanities',
  social: 'Social',
  science: 'Science',
  required: 'Required',
};

// ---------- FAKE DATA ----------
const MOCK_RESULT: SuggestionsResult = {
  missing: [
    { category: 'humanities', missing: 2 },
    { category: 'social', missing: 2 },
    { category: 'science', missing: 2 },
    { category: 'required', missing: 4 },
  ],
  suggestions: [
    {
      id: '1',
      code: 'H1023',
      name: 'Introduction to Philosophy',
      credits: 2,
      category: 'humanities',
      field: 'Field P',
      teacher: 'Dr. Sasa',
      schedule: 'Mon 3-4',
      reason: 'Completes Field P',
      hasConflict: false,
    },
    {
      id: '2',
      code: 'H2051',
      name: 'Film and Society',
      credits: 2,
      category: 'humanities',
      field: 'Field V',
      teacher: 'Prof. Majo',
      schedule: 'Wed 5-6',
      reason: 'Completes Field V',
      hasConflict: true,
    },
    {
      id: '3',
      code: 'S1102',
      name: 'Psychology in Daily Life',
      credits: 2,
      category: 'social',
      field: 'Field T',
      teacher: 'Dr. Tris',
      schedule: 'Tue 7-8',
      reason: 'Completes Field T',
      hasConflict: false,
    },
    {
      id: '4',
      code: 'N1310',
      name: 'Astronomy Basics',
      credits: 2,
      category: 'science',
      field: 'Field Z',
      teacher: 'Prof. Vanessa',
      schedule: 'Thu 3-4',
      reason: 'Completes Field Z and the Science category',
      hasConflict: false,
    },
    {
      id: '5',
      code: 'R0001',
      name: 'AI and Programming Language',
      credits: 2,
      category: 'required',
      field: 'Required',
      teacher: 'Dr. Russel',
      schedule: 'Fri 1-2',
      reason: 'Required for graduation',
      hasConflict: false,
    },
    {
      id: '6',
      code: 'R0002',
      name: 'Exploring Sustainability',
      credits: 2,
      category: 'required',
      field: 'Required',
      teacher: 'Prof. Cody',
      schedule: 'Wed 3-4',
      reason: 'Required for graduation',
      hasConflict: false,
    },
  ],
};

// hi BACKEND TO DO: replace the inside with a real request.
// Keep the name and the SuggestionsResult return type the same.
export async function fetchSuggestions(studentId: string): Promise<SuggestionsResult> {
  return MOCK_RESULT;
}
