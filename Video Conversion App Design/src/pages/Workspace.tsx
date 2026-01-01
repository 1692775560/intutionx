import { useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { WorkspacePage } from '../components/WorkspacePage';
import { PageView } from '../App';
import { useState } from 'react';

export default function Workspace() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [currentPage, setCurrentPage] = useState<PageView>('code');

  if (!sessionId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Invalid Session</h2>
          <p className="text-gray-600 mt-2">Please create a new session from the home page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-hidden">
        <WorkspacePage sessionId={sessionId} />
      </main>
    </div>
  );
}
