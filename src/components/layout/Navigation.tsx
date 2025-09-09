import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  PieChart,
  History,
  Trophy,
  User,
} from 'lucide-react';

const navigationItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: PieChart, label: 'Portfolio', path: '/portfolio' },
  { icon: History, label: 'Orders', path: '/orders' },
  { icon: Trophy, label: 'News', path: '/news' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="hidden md:block fixed top-16 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center space-x-8 py-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};