import { createContext, ReactNode, useContext, useState } from 'react';

export type Language = 'en' | 'zh';

type ProfileState = {
  displayName: string;
  setDisplayName: (name: string) => void;
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // BACKEND TODO: start with the registered name from the login instead.
  const [displayName, setDisplayName] = useState('Pramesti');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  return (
    <ProfileContext.Provider
      value={{ displayName, setDisplayName, photoUri, setPhotoUri, language, setLanguage }}
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
