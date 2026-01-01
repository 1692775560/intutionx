import { Sidebar } from '../components/Sidebar';
import { HomePage } from '../components/HomePage';
import { PageView } from '../App';
import { useState } from 'react';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');

  return (
    <div className="flex h-screen bg-white">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-hidden">
        <HomePage setCurrentPage={setCurrentPage} />
      </main>
    </div>
  );
}
