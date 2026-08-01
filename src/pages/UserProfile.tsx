import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { User, UserComment, Transaction } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          toast.error('User not found');
          navigate('/users');
          return;
        }

        const commentsQ = query(
          collection(db, 'user_comments'),
          where('userId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const commentsSnap = await getDocs(commentsQ);
        setComments(commentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserComment)));

        const txQ = query(
          collection(db, 'transactions'),
          where('userId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const txSnap = await getDocs(txQ);
        setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));

      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, navigate]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const commentData = {
        userId: id,
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email || 'Admin',
        comment: newComment.trim(),
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'user_comments'), commentData);
      setComments([{ id: docRef.id, ...commentData } as UserComment, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'user_comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return <div className="text-zinc-400 text-center py-12">Loading profile...</div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/users')} className="px-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Profile</h1>
          <p className="text-sm text-zinc-400 mt-1">Detailed view and admin comments for {user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* User Info Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-2xl font-medium shrink-0">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{user.displayName || 'No Name'}</h2>
                <p className="text-sm text-zinc-400">{user.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                    user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 
                    user.role === 'moderator' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {user.role || 'user'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-zinc-800/50 pt-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</div>
                <div className="text-sm font-medium text-white capitalize">{user.status || 'active'}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Joined</div>
                <div className="text-sm font-medium text-white">
                  {user.joinedAt ? format(new Date(user.joinedAt), 'PPp') : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Referral Code</div>
                <div className="text-sm font-medium text-white font-mono">{user.referralCode || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-base font-medium text-white mb-4">Wallet Balance</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Coins</div>
                <div className="text-2xl font-bold text-indigo-400">{user.points?.toLocaleString() || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cash Value (Estimated)</div>
                <div className="text-2xl font-bold text-emerald-400">${(user.walletBalance || 0).toFixed(2)}</div>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4">Balance is only updated through completed transactions and earnings.</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {transactions.length === 0 ? (
                <div className="text-zinc-500 text-sm text-center py-4">No transactions found.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-zinc-800/20">
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
                      <div>
                        <p className="text-sm font-medium text-zinc-200 capitalize">{tx.type}</p>
                        <p className="text-xs text-zinc-500">{tx.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${tx.type === 'earned' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'earned' ? '+' : '-'}{tx.amount} <span className="text-xs uppercase ml-0.5">{tx.currency}</span>
                      </p>
                      <p className="text-xs text-zinc-500">{formatDistanceToNow(tx.createdAt, { addSuffix: true })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Comments Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-medium text-white">Admin Comments & Notes</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  No comments yet for this user.
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">{comment.adminName}</span>
                        <span className="text-xs text-zinc-500">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-auto border-t border-zinc-800 pt-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Add a note about this user..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
