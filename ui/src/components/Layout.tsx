import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  TestTube2,
  Newspaper,
  Brain,
  BarChart3,
  Settings,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Market Data', href: '/market', icon: TrendingUp },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Paper Trading', href: '/paper-trading', icon: TestTube2 },
  { name: 'Technical Analysis', href: '/analysis', icon: BarChart3 },
  { name: 'News & Sentiment', href: '/news', icon: Newspaper },
  { name: 'AI Insights', href: '/insights', icon: Brain },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                  StarkMatter
                </span>
              </div>
            </div>
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      <Icon
                        className={cn(
                          'mr-3 h-5 w-5 flex-shrink-0',
                          isActive
                            ? 'text-indigo-500 dark:text-indigo-400'
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        )}
                      />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">BS</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Brian Stark
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    View profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}