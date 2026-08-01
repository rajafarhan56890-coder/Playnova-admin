import React, { useEffect, useState } from 'react';
import { Search, Filter, Ban, Edit2, CheckCircle2, User as UserIcon } from 'lucide-react';
import { collection, getDocs, updateDoc, doc, query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { User, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  
  const fetchUsers = async (loadMore = false) => {
    try {
      if (!loadMore) setLoading(true);
      
      const usersRef = collection(db, 'users');
      let q = query(usersRef, orderBy('joinedAt', 'desc'), limit(15));
      
      if (loadMore && lastVisible) {
        q = query(usersRef, orderBy('joinedAt', 'desc'), startAfter(lastVisible), limit(15));
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      if (loadMore) {
        setUsers(prev => [...prev, ...fetchedUsers]);
      } else {
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'blocked') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role || 'user');
    setIsModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await updateDoc(doc(db, 'users', editingUser.id), { role: selectedRole });
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: selectedRole } : u));
      toast.success('User role updated');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users Management</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage platform users, view their balances, and account status.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="w-full sm:w-96">
          <Input 
            placeholder="Search users by email or name..." 
            icon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="secondary" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-300">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Points</th>
                <th className="px-6 py-4 font-medium">Wallet</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium mr-3 shrink-0">
                          {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">{user.displayName || 'No Name'}</div>
                          <div className="text-xs text-zinc-500">{user.email || 'No Email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${
                        user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 
                        user.role === 'moderator' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-indigo-400">{user.points?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 font-medium text-emerald-400">${(user.walletBalance || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{user.joinedAt ? format(new Date(user.joinedAt), 'MMM d, yyyy') : 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {user.status === 'active' || !user.status ? (
                          <button 
                            onClick={() => handleStatusChange(user.id, 'blocked')}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Block User"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusChange(user.id, 'active')}
                            className="p-1.5 text-zinc-500 hover:text-emerald-400 transition-colors"
                            title="Unblock User"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <Link 
                          to={`/users/${user.id}`}
                          className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors inline-block" 
                          title="View Profile"
                        >
                          <UserIcon className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleEditRole(user)}
                          className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors" 
                          title="Edit Role"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {users.length > 0 && !searchTerm && (
           <div className="border-t border-zinc-800/50 p-4 text-center">
             <Button variant="secondary" onClick={() => fetchUsers(true)} disabled={loading}>
               {loading ? 'Loading...' : 'Load More'}
             </Button>
           </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Edit Role for ${editingUser?.displayName || editingUser?.email}`}
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Select Role</label>
            <select 
              className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as UserRole)}
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
