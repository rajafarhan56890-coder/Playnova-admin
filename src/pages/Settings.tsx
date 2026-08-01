import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { AppSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        } else {
          // Initialize defaults
          const defaultSettings: AppSettings = {
            id: 'global',
            minWithdrawal: 1000,
            referralBonus: 50,
            maintenanceMode: false,
            coinsToPKR: 1000,
            coinsToUSD: 280000,
            updatedAt: Date.now()
          };
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...settings,
        updatedAt: Date.now()
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-zinc-400 text-center py-12">Loading settings...</div>;
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure global application parameters and currency rates.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Currency & Conversion Rates</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Coins equal to 1 PKR</label>
              <div className="relative">
                <Input 
                  type="number"
                  required
                  min="1"
                  value={settings.coinsToPKR}
                  onChange={e => setSettings({...settings, coinsToPKR: Number(e.target.value)})}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-zinc-500 text-sm">Coins</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Example: 1000 coins = 1 PKR</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Coins equal to 1 USD</label>
              <div className="relative">
                <Input 
                  type="number"
                  required
                  min="1"
                  value={settings.coinsToUSD}
                  onChange={e => setSettings({...settings, coinsToUSD: Number(e.target.value)})}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-zinc-500 text-sm">Coins</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Example: 280,000 coins = 1 USD</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-medium text-white mb-4">General Rules</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Minimum Withdrawal (Coins)</label>
              <Input 
                type="number"
                required
                min="0"
                value={settings.minWithdrawal}
                onChange={e => setSettings({...settings, minWithdrawal: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Referral Bonus (Coins)</label>
              <Input 
                type="number"
                required
                min="0"
                value={settings.referralBonus}
                onChange={e => setSettings({...settings, referralBonus: Number(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-medium text-white mb-4">System Status</h2>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="maintenanceMode"
              className="mr-3 h-5 w-5 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
              checked={settings.maintenanceMode}
              onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})}
            />
            <div>
              <label htmlFor="maintenanceMode" className="text-sm font-medium text-zinc-200">
                Maintenance Mode
              </label>
              <p className="text-xs text-zinc-500">Enable this to prevent users from accessing the app during updates.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="px-8">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};
