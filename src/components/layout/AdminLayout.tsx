import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2, 
  Gift, 
  ArrowRightLeft, 
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Gamepad2, label: 'Games', path: '/games' },
  { icon: Gift, label: 'Rewards', path: '/rewards' },
  { icon: CreditCard, label: 'Withdrawals', path: '/withdrawals' },
  { icon: ArrowRightLeft, label: 'Transactions', path: '/transactions' },
  { icon: Bell, label: 'Announcements', path: '/announcements' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800 text-zinc-300">
      <div className="flex h-16 items-center px-6">
        <Gamepad2 className="h-8 w-8 text-indigo-500 mr-2" />
        <span className="text-xl font-bold text-white tracking-wider">PlayNova</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-white">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-white truncate">{user?.email}</span>
            <span className="text-xs text-zinc-500">Administrator</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <div className="hidden md:flex md:w-64 md:flex-col">
        <SidebarContent />
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 md:hidden">
          <div className="flex items-center">
            <Gamepad2 className="h-6 w-6 text-indigo-500 mr-2" />
            <span className="text-lg font-bold text-white tracking-wider">PlayNova</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="text-zinc-400 hover:text-white"
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
