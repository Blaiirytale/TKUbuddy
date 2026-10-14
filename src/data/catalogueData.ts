// src/data/catalogueData.ts
// Every course TKU has, like the course catalogue. Not tied to a semester.

export type CatalogueCourse = {
  code: string;
  nameEn: string;
  nameZh: string;
  credits: number;
  college: string;
  department: string;
  description: string;
  prerequisites: string[]; // course codes
};

const c = (
  code: string,
  nameEn: string,
  nameZh: string,
  credits: number,
  college: string,
  department: string,
  description: string,
  prerequisites: string[] = []
): CatalogueCourse => ({ code, nameEn, nameZh, credits, college, department, description, prerequisites });

const MOCK_CATALOGUE: CatalogueCourse[] = [
  c('TCSXB1B', 'Programming I', '程式設計(一)', 3, 'Engineering', 'Computer Science', 'Basic programming with C: variables, loops, functions and arrays.'),
  c('TCSXB2A', 'Programming II', '程式設計(二)', 3, 'Engineering', 'Computer Science', 'Pointers, structures, files and a first look at object-oriented design.', ['TCSXB1B']),
  c('TCSXB3A', 'Data Structures', '資料結構', 3, 'Engineering', 'Computer Science', 'Lists, stacks, queues, trees, graphs and how to choose between them.', ['TCSXB2A']),
  c('TCSXB4A', 'Algorithms', '演算法', 3, 'Engineering', 'Computer Science', 'Sorting, searching, greedy methods, dynamic programming and graph algorithms.', ['TCSXB3A']),
  c('TCSXB5A', 'Database Systems', '資料庫系統', 3, 'Engineering', 'Computer Science', 'Relational design, SQL, transactions and indexing.', ['TCSXB3A']),
  c('TCSXB7B', 'Cloud Computing', '雲端運算', 3, 'Engineering', 'Computer Science', 'Virtual machines, containers and building services on the cloud.', ['TCSXB5A']),
  c('TCSXB8A', 'Mobile App Design', '行動應用設計', 3, 'Engineering', 'Computer Science', 'Designing and building apps for phones, from sketches to a working prototype.', ['TCSXB2A']),
  c('TCSXB8B', 'Deep Learning', '深度學習', 3, 'Engineering', 'Computer Science', 'Neural networks, training, and models for images and text.', ['TCSXB4A']),
  c('TCSXB8C', 'Web Security', '網路安全', 3, 'Engineering', 'Computer Science', 'Common web attacks and how to defend against them.', ['TCSXB5A']),
  c('TEEXB1A', 'Circuit Theory', '電路學', 3, 'Engineering', 'Electrical Engineering', 'Basic circuits, Ohm’s law, and AC and DC analysis.'),
  c('TEEXB3D', 'Embedded Systems', '嵌入式系統', 3, 'Engineering', 'Electrical Engineering', 'Programming small devices and sensors with microcontrollers.', ['TEEXB1A']),
  c('TLPXB1A', 'Introduction to Public Finance', '財政學概論', 3, 'Social Sciences', 'Public Finance', 'How governments collect and spend money.'),
  c('TLPXB2A', 'Public Finance', '財政學', 3, 'Social Sciences', 'Public Finance', 'Taxes, public goods and government budgets in more depth.', ['TLPXB1A']),
  c('TLPXB3C', 'Tax Policy', '租稅政策', 2, 'Social Sciences', 'Public Finance', 'How tax rules are designed and what they change.', ['TLPXB2A']),
  c('TLEXB1B', 'Principles of Economics', '經濟學原理', 3, 'Social Sciences', 'Economics', 'Supply and demand, markets, and the basics of the economy.'),
  c('TLEXB2A', 'Microeconomics', '個體經濟學', 3, 'Social Sciences', 'Economics', 'How people and firms make choices.', ['TLEXB1B']),
  c('TACXB1A', 'Chinese Composition', '國文寫作', 2, 'Liberal Arts', 'Chinese Literature', 'Writing clear Chinese essays and reports.'),
  c('TACXB2A', 'Modern Chinese Fiction', '現代小說', 2, 'Liberal Arts', 'Chinese Literature', 'Reading and discussing modern Chinese novels and short stories.'),
  c('TAHXB2C', 'History of Taiwan', '臺灣史', 2, 'Liberal Arts', 'History', 'Taiwan from early times to today.'),
  c('H1023', 'Introduction to Philosophy', '哲學概論', 2, 'General Education', 'General Education', 'Big questions about knowledge, mind and how to live.'),
  c('S1102', 'Psychology in Daily Life', '生活心理學', 2, 'General Education', 'General Education', 'Everyday psychology: habits, stress, memory and relationships.'),
  c('N1310', 'Astronomy Basics', '天文學入門', 2, 'General Education', 'General Education', 'Stars, planets and how we study the sky.'),
  c('TNUOB1E', 'Exploring and Implementing Social Issues', '社會議題探索暨實踐', 1, 'General Education', 'General Education', 'Pick a social issue and work on it with a small team.'),
  c('GELAN03', 'Japanese Conversation', '日語會話', 2, 'General Education', 'General Education', 'Everyday Japanese speaking and listening.'),
];

// BACKEND TODO: GET /courses already exists. Map its fields
// (code, name_en, name_zh, credits, department) into this shape.
export async function fetchCatalogue(): Promise<CatalogueCourse[]> {
  return MOCK_CATALOGUE;
}
