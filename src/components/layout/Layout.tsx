import { Header } from './Header';
import { Navigation } from './Navigation';
import { MobileNavigation } from './MobileNavigation';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="flex-1 pt-16 pb-20 md:pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <MobileNavigation />
    </div>
  );
};