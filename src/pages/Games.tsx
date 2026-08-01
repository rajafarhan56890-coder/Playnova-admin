import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Upload, X, Link as LinkIcon } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { db, storage } from '../lib/firebase';
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
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    gameUrl: '',
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
    setImageFile(null);
    if (game) {
      setEditingGame(game);
      setImagePreview(game.imageUrl || '');
      setFormData({
        name: game.name || '',
        description: game.description || '',
        imageUrl: game.imageUrl || '',
        gameUrl: game.gameUrl || '',
        category: game.category || '',
        rewardPoints: game.rewardPoints || 0,
        isActive: game.isActive ?? true,
      });
    } else {
      setEditingGame(null);
      setImagePreview('');
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        gameUrl: '',
        category: '',
        rewardPoints: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImage(true);
    
    try {
      let finalImageUrl = formData.imageUrl;
      
      if (imageFile) {
        const storageRef = ref(storage, `games/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }
      
      if (!finalImageUrl && !editingGame) {
        toast.error('Please select an image for the game');
        setUploadingImage(false);
        return;
      }

      const dataToSave = {
        ...formData,
        imageUrl: finalImageUrl,
      };

      if (editingGame) {
        await updateDoc(doc(db, 'games', editingGame.id), dataToSave);
        toast.success('Game updated successfully');
      } else {
        await addDoc(collection(db, 'games'), {
          ...dataToSave,
          addedAt: Date.now(),
        });
        toast.success('Game added successfully');
      }
      setIsModalOpen(false);
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
      toast.error('Failed to save game');
    } finally {
      setUploadingImage(false);
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
            <div key={game.id} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700 flex flex-col">
              <div className="aspect-video w-full overflow-hidden bg-zinc-800 relative">
                <img src={game.imageUrl} alt={game.name} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                {game.gameUrl && (
                  <a 
                    href={game.gameUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg text-white hover:bg-indigo-600 transition-colors"
                    title="Play Game"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
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
                
                <div className="mt-4 flex items-center justify-between text-sm flex-1">
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
            <label className="block text-sm font-medium text-zinc-400 mb-1">Game Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-700 border-dashed rounded-lg bg-zinc-900 hover:bg-zinc-800/50 transition-colors relative overflow-hidden group">
              {imagePreview ? (
                <div className="absolute inset-0 w-full h-full">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button type="button" variant="secondary" size="sm" onClick={() => { setImageFile(null); setImagePreview(''); if(fileInputRef.current) fileInputRef.current.value = ''; }}>
                      <X className="mr-2 h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-zinc-500" />
                  <div className="flex text-sm text-zinc-400 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-500 hover:text-indigo-400 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-zinc-500">PNG, JPG, GIF up to 2MB</p>
                </div>
              )}
            </div>
          </div>
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
            <label className="block text-sm font-medium text-zinc-400 mb-1">Game URL (Link to play)</label>
            <Input 
              type="url"
              placeholder="https://..."
              value={formData.gameUrl} 
              onChange={e => setFormData({...formData, gameUrl: e.target.value})} 
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
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={uploadingImage}>Cancel</Button>
            <Button type="submit" disabled={uploadingImage}>
              {uploadingImage ? 'Saving...' : (editingGame ? 'Save Changes' : 'Add Game')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

