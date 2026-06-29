import { useState } from 'react';
import type { Page } from './types';
import { MainLayout } from './layout/AppLayout';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <MainLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      onLogout={() => setIsLoggedIn(false)}
    />
  );
}
