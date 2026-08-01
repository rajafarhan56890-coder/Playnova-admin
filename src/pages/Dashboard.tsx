import React, { useEffect, useState } from 'react';
import { Users, Gamepad2, Gift, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, getCountFromServer, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Withdrawal } from '../types';
import { formatDistanceToNow } from 'date-fns';

const data = [
  { name: 'Mon', active: 400, new: 240 },
  { name: 'Tue', active: 300, new: 139 },
  { name: 'Wed', active: 200, new: 980 },
  { name: 'Thu', active: 278, new: 390 },
  { name: 'Fri', active: 189, new: 480 },
  { name: 'Sat', active: 239, new: 380 },
  { name: 'Sun', active: 349, new: 430 },
];

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
      <span className="text-emerald-500 font-medium">{trend}</span>
      <span className="ml-2 text-zinc-500">vs last week</span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    pendingWithdrawals: 0,
    totalRewardsGiven: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const gamesSnap = await getCountFromServer(collection(db, 'games'));
        
        const withdrawalsQuery = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
        const withdrawalsSnap = await getCountFromServer(withdrawalsQuery);
        
        const recentWithdrawalsQuery = query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'), limit(5));
        const recentSnap = await getDocs(recentWithdrawalsQuery);
        const activities = recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));

        setStats({
          totalUsers: usersSnap.data().count,
          totalGames: gamesSnap.data().count,
          pendingWithdrawals: withdrawalsSnap.data().count,
          totalRewardsGiven: 12450, // This would ideally be a sum aggregation or tracked separately
        });
        
        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">Key metrics and statistics for PlayNova platform.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={loading ? '...' : stats.totalUsers.toLocaleString()} icon={Users} trend="+12.5%" />
        <StatCard title="Active Games" value={loading ? '...' : stats.totalGames} icon={Gamepad2} trend="+3" />
        <StatCard title="Pending Withdrawals" value={loading ? '...' : stats.pendingWithdrawals} icon={DollarSign} trend="-2" />
        <StatCard title="Total Rewards Given" value={loading ? '...' : `$${stats.totalRewardsGiven.toLocaleString()}`} icon={Gift} trend="+8.2%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Active Users (7 Days)</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Line type="monotone" dataKey="active" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="new" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-zinc-500 text-sm">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-zinc-500 text-sm">No recent activity</div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                    <TrendingUp className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Withdrawal {activity.status}</p>
                    <p className="text-xs text-zinc-500">{activity.userId.substring(0,8)}... requested ${activity.amount}</p>
                  </div>
                  <div className="ml-auto text-xs text-zinc-500">
                    {formatDistanceToNow(activity.requestedAt, { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
