import { Navigate, Route, Routes } from 'react-router-dom';
import Welcome from './pages/Welcome.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';

export default function App() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
