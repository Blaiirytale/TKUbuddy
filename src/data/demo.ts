// src/data/demo.ts
// Demo mode: use the app without the server. Turn it on only on your own laptop by adding
//   EXPO_PUBLIC_DEMO=1
// to the app's .env (that file never goes to GitHub). Then restart with  npx expo start -c
import type { StudentProfile } from '../api/client';

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === '1';

export const DEMO_STUDENT: StudentProfile = {
  student_id: '411000001',
  name_zh: '測試學生',
  nickname: 'Pramesti',
  department: 'Computer Science and Information Engineering',
  entry_year: 2023,
};
