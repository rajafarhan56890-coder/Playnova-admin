import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Reward } from '../types';

export const Rewards: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost: 0,
    imageUrl: '',
    isActive: true,
    type: 'giftcard' as 'giftcard' | 'crypto' | 'cash',
  });

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'rewards'), orderBy('addedAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedRewards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(fetchedRewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleOpenModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        title: reward.title,
        description: reward.description,
        cost: reward.cost,
        imageUrl: reward.imageUrl,
        isActive: reward.isActive,
        type: reward.type,
      });
    } else {
      setEditingReward(null);
      setFormData({
        title: '',
        description: '',
        cost: 0,
        imageUrl: '',
        isActive: true,
        type: 'giftcard',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReward) {
        await updateDoc(doc(db, 'rewards', editingReward.id), formData);
        toast.success('Reward updated successfully');
      } else {
        await addDoc(collection(db, 'rewards'), {
          ...formData,
          addedAt: Date.now(),
        });
        toast.success('Reward added successfully');
      }
      setIsModalOpen(false);
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reward?')) return;
    try {
      await deleteDoc(doc(db, 'rewards', id));
      toast.success('Reward deleted successfully');
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    }
  };

  const filteredRewards = rewards.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rewards Catalog</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage the prizes and cashouts available to users.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reward
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="w-full sm:w-96">
          <Input 
            placeholder="Search rewards..." 
            icon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-400 text-center py-12">Loading rewards...</div>
      ) : filteredRewards.length === 0 ? (
        <div className="text-zinc-500 text-center py-12 border border-zinc-800 rounded-xl bg-zinc-900/30">
          No rewards found. Add your first reward!
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRewards.map((reward) => (
            <div key={reward.id} className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700">
              <div className="flex items-center p-5 border-b border-zinc-800/50">
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-zinc-800 shrink-0">
                  <img src={reward.imageUrl} alt={reward.title} className="h-full w-full object-cover" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-white">{reward.title}</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-indigo-400 font-bold">{reward.cost.toLocaleString()}</span>
                    <span className="text-zinc-500 text-xs ml-1 uppercase tracking-wider">Points</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-sm text-zinc-400 flex-1">{reward.description}</p>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 capitalize">
                    {reward.type}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    reward.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {reward.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => handleOpenModal(reward)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" className="px-3" onClick={() => handleDelete(reward.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReward ? 'Edit Reward' : 'Add Reward'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
            <Input 
              required 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
            <Input 
              required 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Image URL</label>
            <Input 
              required 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
              <select 
                className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="giftcard">Gift Card</option>
                <option value="cash">Cash Transfer</option>
                <option value="crypto">Cryptocurrency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Cost (Points)</label>
              <Input 
                type="number" 
                required 
                min="0"
                value={formData.cost} 
                onChange={e => setFormData({...formData, cost: Number(e.target.value)})} 
              />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <input 
              type="checkbox" 
              id="isActive"
              className="mr-2 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-zinc-300">
              Active (available for redemption)
            </label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">
              {editingReward ? 'Save Changes' : 'Add Reward'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
