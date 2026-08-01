import React, { useEffect, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { Transaction } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchTransactions = async (loadMore = false) => {
    try {
      if (!loadMore) setLoading(true);
      
      let q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(15));
      
      if (loadMore && lastVisible) {
        q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(15));
      }
      
      // If there's a specific user ID search, we'd query differently, but for now we filter client-side for prototype
      // because Firestore requires index for complex text search.
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      
      if (loadMore) {
        setTransactions(prev => [...prev, ...fetched]);
      } else {
        setTransactions(fetched);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => 
    t.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-sm text-zinc-400 mt-1">Monitor all point and cash movements across the platform.</p>
        </div>
      </div>

      <div className="w-full sm:w-96">
        <Input 
          placeholder="Search by User ID or description..." 
          icon={<Search className="h-4 w-4" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-300">
              <tr>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">Loading transactions...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No transactions found.</td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {tx.type === 'earned' ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mr-3">
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 mr-3">
                            <ArrowDownRight className="h-4 w-4" />
                          </div>
                        )}
                        <span className="capitalize font-medium text-zinc-300">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-500">{tx.userId}</td>
                    <td className="px-6 py-4 text-zinc-300">{tx.description}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={tx.type === 'earned' ? 'text-emerald-400' : 'text-red-400'}>
                        {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1 uppercase">{tx.currency}</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {transactions.length > 0 && !searchTerm && (
           <div className="border-t border-zinc-800/50 p-4 text-center">
             <Button variant="secondary" onClick={() => fetchTransactions(true)} disabled={loading}>
               {loading ? 'Loading...' : 'Load More'}
             </Button>
           </div>
        )}
      </div>
    </div>
  );
};
