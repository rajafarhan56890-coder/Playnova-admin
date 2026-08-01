/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Games } from './pages/Games';
import { Rewards } from './pages/Rewards';
import { Transactions } from './pages/Transactions';
import { Announcements } from './pages/Announcements';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="games" element={<Games />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="withdrawals" element={<div className="text-white p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">Withdrawals (Coming Soon)</div>} />
            <Route path="settings" element={<div className="text-white p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">Platform Settings (Coming Soon)</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
