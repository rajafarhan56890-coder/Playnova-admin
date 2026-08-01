import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Game } from '../types';

export const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    category: '',
    rewardPoints: 0,
    isActive: true,
  });

  const fetchGames = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'games'), orderBy('addedAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      setGames(fetchedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleOpenModal = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      setFormData({
        name: game.name,
        description: game.description,
        imageUrl: game.imageUrl,
        category: game.category,
        rewardPoints: game.rewardPoints,
        isActive: game.isActive,
      });
    } else {
      setEditingGame(null);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        category: '',
        rewardPoints: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGame) {
        await updateDoc(doc(db, 'games', editingGame.id), formData);
        toast.success('Game updated successfully');
      } else {
        await addDoc(collection(db, 'games'), {
          ...formData,
          addedAt: Date.now(),
        });
        toast.success('Game added successfully');
      }
      setIsModalOpen(false);
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
      toast.error('Failed to save game');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await deleteDoc(doc(db, 'games', id));
      toast.success('Game deleted successfully');
      fetchGames();
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game');
    }
  };

  const filteredGames = games.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Games Management</h1>
          <p className="text-sm text-zinc-400 mt-1">Add, update, or remove games from the platform.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Game
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="w-full sm:w-96">
          <Input 
            placeholder="Search games..." 
            icon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-400 text-center py-12">Loading games...</div>
      ) : filteredGames.length === 0 ? (
        <div className="text-zinc-500 text-center py-12 border border-zinc-800 rounded-xl bg-zinc-900/30">
          No games found. Add your first game!
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGames.map((game) => (
            <div key={game.id} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700">
              <div className="aspect-video w-full overflow-hidden bg-zinc-800">
                <img src={game.imageUrl} alt={game.name} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{game.name}</h3>
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{game.description}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    game.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {game.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center text-indigo-400 font-medium">
                    <span className="text-zinc-500 mr-2">Reward:</span>
                    {game.rewardPoints} pts
                  </div>
                  <div className="text-zinc-500">
                    {game.category}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-zinc-800 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => handleOpenModal(game)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" className="px-3" onClick={() => handleDelete(game.id)}>
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
        title={editingGame ? 'Edit Game' : 'Add New Game'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Game Name</label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
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
              <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
              <Input 
                required 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Reward Points</label>
              <Input 
                type="number" 
                required 
                min="0"
                value={formData.rewardPoints} 
                onChange={e => setFormData({...formData, rewardPoints: Number(e.target.value)})} 
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
              Active (visible to users)
            </label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">
              {editingGame ? 'Save Changes' : 'Add Game'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
