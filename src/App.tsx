import { Navigate, Route, Routes } from 'react-router';
import { useStore } from './state/store';
import Shell from './components/shell/Shell';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ProjectSettings from './pages/settings/ProjectSettings';
import IntentStudio from './pages/studio/IntentStudio';
import RunDetail from './pages/studio/RunDetail';
import Review from './pages/review/Review';
import Approvals from './pages/approvals/Approvals';
import IntentLibrary from './pages/library/IntentLibrary';

export default function App() {
  const { authed } = useStore();
  if (!authed) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<ProjectSettings />} />
        <Route path="/studio" element={<IntentStudio />} />
        <Route path="/studio/runs/:runId" element={<RunDetail />} />
        <Route path="/review" element={<Review />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/library" element={<IntentLibrary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
