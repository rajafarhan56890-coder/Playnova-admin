import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { collection, getDocs, updateDoc, doc, query, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData, getDoc, runTransaction } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { Withdrawal, Transaction, User } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';

export const Withdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchWithdrawals = async (loadMore = false) => {
    try {
      if (!loadMore) setLoading(true);
      
      let q = query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'), limit(15));
      
      if (loadMore && lastVisible) {
        q = query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'), startAfter(lastVisible), limit(15));
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
      
      if (loadMore) {
        setWithdrawals(prev => [...prev, ...fetched]);
      } else {
        setWithdrawals(fetched);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleStatusChange = async (withdrawal: Withdrawal, newStatus: 'approved' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this withdrawal?`)) return;
    
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
      
      if (newStatus === 'rejected') {
        // If rejected, refund the points back to user wallet via a transaction
        await runTransaction(db, async (transaction) => {
          const wDoc = await transaction.get(withdrawalRef);
          if (!wDoc.exists() || wDoc.data().status !== 'pending') {
            throw new Error('Withdrawal is no longer pending.');
          }

          const userRef = doc(db, 'users', withdrawal.userId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists()) {
             const userData = userDoc.data() as User;
             transaction.update(userRef, {
               walletBalance: (userData.walletBalance || 0) + withdrawal.amount
             });
          }

          const txRef = doc(collection(db, 'transactions'));
          transaction.set(txRef, {
            userId: withdrawal.userId,
            type: 'earned', // Refund
            amount: withdrawal.amount,
            currency: 'points',
            description: `Refund for rejected withdrawal`,
            createdAt: Date.now()
          } as Transaction);

          transaction.update(withdrawalRef, {
            status: newStatus,
            processedAt: Date.now()
          });
        });
      } else {
        // Just update status if approved
        await updateDoc(withdrawalRef, {
          status: newStatus,
          processedAt: Date.now()
        });
      }

      setWithdrawals(withdrawals.map(w => w.id === withdrawal.id ? { ...w, status: newStatus, processedAt: Date.now() } : w));
      toast.success(`Withdrawal ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast.error('Failed to process withdrawal');
    }
  };

  const filtered = withdrawals.filter(w => {
    const matchesSearch = w.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Withdrawal Requests</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage user payout requests via EasyPaisa, JazzCash, or others.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search by User ID or Method..." 
            icon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors w-full sm:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-300">
              <tr>
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Amount (Coins)</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">Loading withdrawals...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No withdrawal requests found.</td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">{w.userId}</td>
                    <td className="px-6 py-4 font-medium text-amber-400">{w.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 capitalize font-medium text-zinc-300">{w.method}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400 max-w-[200px] truncate" title={w.details}>
                      {w.details}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${
                        w.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {w.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                        {w.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {w.status === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(w.requestedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="primary" 
                            className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 py-1 text-xs"
                            onClick={() => handleStatusChange(w, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="text-red-400 hover:bg-red-400/10 hover:text-red-300 h-8 px-3 py-1 text-xs"
                            onClick={() => handleStatusChange(w, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {withdrawals.length > 0 && !searchTerm && statusFilter === 'all' && (
           <div className="border-t border-zinc-800/50 p-4 text-center">
             <Button variant="secondary" onClick={() => fetchWithdrawals(true)} disabled={loading}>
               {loading ? 'Loading...' : 'Load More'}
             </Button>
           </div>
        )}
      </div>
    </div>
  );
};
