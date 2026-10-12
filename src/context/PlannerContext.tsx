// src/context/PlannerContext.tsx
// The planner list lives here (not inside one screen), so every screen sees
// the same courses: Course Suggestions adds them, the Planner shows them,
// and Advance Search can add them later with the same requestAdd().
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  CREDIT_LIMIT,
  findConflicts,
  PLAN_SEMESTER,
  PlannedCourse,
  savePlan,
} from '../data/plannerData';

const STORAGE_KEY = 'tkubuddy.planner';
// TEMPORARY: will come from the login later
const STUDENT_ID = '411000001';

type PlannerState = {
  courses: PlannedCourse[];
  totalCredits: number;
  isPlanned: (id: string) => boolean;
  conflictsFor: (course: PlannedCourse) => PlannedCourse[];
  requestAdd: (course: PlannedCourse) => void; // checks time clashes and the credit limit first
  removeCourse: (id: string) => void;
  saveSchedule: () => Promise<boolean>;
  saving: boolean;
  savedAt: string | null; // time of the last successful save
  unsaved: boolean;       // true when something changed after the last save
};

type Stored = { courses: PlannedCourse[]; savedAt: string | null; unsaved: boolean };

const PlannerContext = createContext<PlannerState | null>(null);

const sumCredits = (list: PlannedCourse[]) => list.reduce((sum, c) => sum + c.credits, 0);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<PlannedCourse[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 1) app start: bring back what was planned last time
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: Stored = JSON.parse(raw);
          if (Array.isArray(stored.courses)) setCourses(stored.courses);
          setSavedAt(stored.savedAt ?? null);
          setUnsaved(!!stored.unsaved);
        }
      } catch {
        // nothing stored yet: start with an empty planner
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // 2) after every change: keep a copy on the phone, so closing the app loses nothing
  useEffect(() => {
    if (!loaded) return;
    const data: Stored = { courses, savedAt, unsaved };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [courses, savedAt, unsaved, loaded]);

  const totalCredits = sumCredits(courses);

  const isPlanned = useCallback((id: string) => courses.some((c) => c.id === id), [courses]);

  const conflictsFor = useCallback(
    (course: PlannedCourse) => findConflicts(course, courses),
    [courses]
  );

  const removeCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setUnsaved(true);
  }, []);

  // puts the course in, after taking out any courses it replaces
  const commitAdd = useCallback((course: PlannedCourse, replaceIds: string[]) => {
    setCourses((prev) => [
      ...prev.filter((c) => c.id !== course.id && !replaceIds.includes(c.id)),
      course,
    ]);
    setUnsaved(true);
  }, []);

  const requestAdd = useCallback(
    (course: PlannedCourse) => {
      if (courses.some((c) => c.id === course.id)) return; // already in the planner

      const clashes = findConflicts(course, courses);
      const replaceIds = clashes.map((c) => c.id);
      const creditsAfter = totalCredits - sumCredits(clashes) + course.credits;

      // step 2: warn if the semester would go over the credit limit
      const checkLimitThenAdd = () => {
        if (creditsAfter > CREDIT_LIMIT.max) {
          Alert.alert(
            'Over the credit limit',
            `This makes ${creditsAfter} credits. The limit is ${CREDIT_LIMIT.max} per semester.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add anyway', onPress: () => commitAdd(course, replaceIds) },
            ]
          );
          return;
        }
        commitAdd(course, replaceIds);
      };

      // step 1: you can't sit in two classes at once
      if (clashes.length > 0) {
        const names = clashes.map((c) => c.name).join(' and ');
        Alert.alert(
          'Time clash',
          `${course.name} is at the same time as ${names}. Replace it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Replace', style: 'destructive', onPress: checkLimitThenAdd },
          ]
        );
        return;
      }

      checkLimitThenAdd();
    },
    [courses, totalCredits, commitAdd]
  );

  const saveSchedule = useCallback(async () => {
    setSaving(true);
    try {
      const result = await savePlan(STUDENT_ID, PLAN_SEMESTER, courses);
      if (result.ok) {
        setSavedAt(result.savedAt);
        setUnsaved(false);
        return true;
      }
      Alert.alert('Could not save', result.reason);
      return false;
    } catch {
      Alert.alert('Could not save', 'Please check your internet connection and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [courses]);

  const value = useMemo(
    () => ({
      courses,
      totalCredits,
      isPlanned,
      conflictsFor,
      requestAdd,
      removeCourse,
      saveSchedule,
      saving,
      savedAt,
      unsaved,
    }),
    [courses, totalCredits, isPlanned, conflictsFor, requestAdd, removeCourse, saveSchedule, saving, savedAt, unsaved]
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

// any screen calls usePlanner() to read or change the planner
export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used inside PlannerProvider');
  return context;
}
