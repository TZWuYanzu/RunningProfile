import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/overview', label: '概览', icon: '📊' },
  { path: '/history', label: '历史', icon: '🏃' },
  { path: '/coach', label: '教练', icon: '💬', primary: true },
  { path: '/calendar', label: '计划', icon: '📅' },
  { path: '/profile', label: '我的', icon: '👤' },
];

export default function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-app border-t border-strong flex justify-around items-center h-12 z-50">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
              active ? 'text-accent' : 'text-muted'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
