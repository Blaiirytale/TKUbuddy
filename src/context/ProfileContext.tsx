import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { getMyProfile, StudentProfile } from '../api/client';
import { DEMO_STUDENT } from '../data/demo';

export type Language = 'en' | 'zh';

type ProfileState = {
  displayName: string;
  setDisplayName: (name: string) => void;
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  student: StudentProfile | null;
  loadMyProfile: () => Promise<void>;
  startDemo: () => void; // demo mode: pretend to be the test student, no server
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [student, setStudent] = useState<StudentProfile | null>(null);

  const loadMyProfile = useCallback(async () => {
    const profile = await getMyProfile();

    setStudent(profile);
    setDisplayName(profile.nickname?.trim() || profile.name_zh);
  }, []);

  const startDemo = useCallback(() => {
    setStudent(DEMO_STUDENT);
    setDisplayName(DEMO_STUDENT.nickname || DEMO_STUDENT.name_zh);
  }, []);

  return (
    <ProfileContext.Provider
      value={{ displayName,
        setDisplayName,
        photoUri,
        setPhotoUri,
        language,
        setLanguage,
        student,
        loadMyProfile,
        startDemo,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}
