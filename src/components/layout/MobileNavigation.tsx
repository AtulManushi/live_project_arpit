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
  { icon: Home, label: 'Home', path: '/' },
  { icon: PieChart, label: 'Portfolio', path: '/portfolio' },
  { icon: History, label: 'Orders', path: '/orders' },
  { icon: Trophy, label: 'News', path: '/news' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-0',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};