//test hehe, 

export type FieldStatus = 'done' | 'in_progress' | 'not_started';

export type GEField = {
  name: string;        
  status: FieldStatus;  
};

export type GECategory = {
  id: string;             
  title: string;           
  creditsDone: number;     
  creditsRequired: number; 
  fields: GEField[];
};


const MOCK_GE: GECategory[] = [
  {
    id: 'humanities',
    title: 'Humanities',
    creditsDone: 2,
    creditsRequired: 4,
    fields: [
      { name: 'Field L', status: 'done' },
      { name: 'Field M', status: 'done' },
      { name: 'Field P', status: 'not_started' },
      { name: 'Field V', status: 'not_started' },
    ],
  },
  {
    id: 'social',
    title: 'Social',
    creditsDone: 2,
    creditsRequired: 4,
    fields: [
      { name: 'Field R', status: 'done' },
      { name: 'Field S', status: 'in_progress' },
      { name: 'Field T', status: 'not_started' },
      { name: 'Field W', status: 'not_started' },
    ],
  },
  {
    id: 'science',
    title: 'Science',
    creditsDone: 2,
    creditsRequired: 4,
    fields: [
      { name: 'Field O', status: 'done' },
      { name: 'Field U', status: 'done' },
      { name: 'Field Z', status: 'not_started' },
    ],
  },
  {
    id: 'required',
    title: 'Required Course',
    creditsDone: 0,
    creditsRequired: 4,
    fields: [
      { name: 'AI and Programming Language', status: 'not_started' },
      { name: 'Exploring Sustainability', status: 'not_started' },
    ],
  },
];


export async function fetchGECategories(studentId: string): Promise<GECategory[]> {
  return MOCK_GE;
}