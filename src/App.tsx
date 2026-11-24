import { useEffect, useState } from 'react';
import { LandingView } from './components/LandingView';
import { StudentExamPortal } from './components/StudentExamPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { OfflineIndicator } from './components/OfflineIndicator';

type AppRoute =
  | { mode: 'landing' }
  | { mode: 'student_catalog' }
  | { mode: 'student'; code: string; lockedLink: boolean }
  | { mode: 'teacher' };

function resolveRouteFromUrl(): AppRoute {
  const url = new URL(window.location.href);
  const ujianParam = url.searchParams.get('ujian');
  if (ujianParam && ujianParam.trim()) {
    return { mode: 'student', code: ujianParam.trim(), lockedLink: true };
  }

  const pathname = url.pathname.replace(/\/+$/, '');
  if (pathname.startsWith('/ujian/')) {
    const code = decodeURIComponent(pathname.slice('/ujian/'.length)).trim();
    if (code) {
      return { mode: 'student', code, lockedLink: true };
    }
  }

  if (pathname === '/mulai' || url.searchParams.get('mode') === 'siswa') {
    return { mode: 'student_catalog' };
  }

  if (pathname === '/guru' || url.searchParams.get('portal') === 'guru') {
    return { mode: 'teacher' };
  }

  return { mode: 'landing' };
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => resolveRouteFromUrl());

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveRouteFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToLanding = () => {
    window.history.pushState({}, '', '/');
    setRoute({ mode: 'landing' });
  };

  const navigateToTeacher = () => {
    window.history.pushState({}, '', '/guru');
    setRoute({ mode: 'teacher' });
  };

  const navigateToStudentExam = (code: string, lockStudent = false) => {
    if (lockStudent) {
      window.history.pushState({}, '', `/ujian/${encodeURIComponent(code)}`);
      setRoute({ mode: 'student', code, lockedLink: true });
      return;
    }
    setRoute({ mode: 'student', code, lockedLink: false });
  };

  return (
    <>
      {route.mode === 'student' ? (
        <StudentExamPortal
          initialExamCode={route.code}
          isLockedStudentLink={route.lockedLink}
          onExitToList={route.lockedLink ? undefined : navigateToLanding}
        />
      ) : route.mode === 'student_catalog' ? (
        <LandingView
          hideTeacherPortal={true}
          onStartExamByCode={(code) => navigateToStudentExam(code, true)}
        />
      ) : route.mode === 'teacher' ? (
        <TeacherPortal onBackToHome={navigateToLanding} />
      ) : (
        <LandingView
          onStartExamByCode={(code) => navigateToStudentExam(code, false)}
          onOpenTeacherPortal={navigateToTeacher}
        />
      )}
      <OfflineIndicator />
    </>
  );
}
