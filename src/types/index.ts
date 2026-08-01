export type UserRole = 'admin' | 'moderator' | 'user';

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  points: number;
  walletBalance: number;
  status: 'active' | 'blocked';
  role: UserRole;
  joinedAt: number;
  referralCode: string;
  referredBy?: string;
};

export type Game = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  rewardPoints: number;
  category: string;
  addedAt: number;
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  cost: number;
  imageUrl: string;
  isActive: boolean;
  type: 'giftcard' | 'crypto' | 'cash';
  addedAt: number;
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'withdrawal';
  amount: number;
  currency: 'points' | 'usd';
  description: string;
  createdAt: number;
};

export type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  method: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: number;
  createdBy: string; // Admin ID
};

export type AppSettings = {
  id: string; // typically 'global'
  minWithdrawal: number;
  referralBonus: number;
  maintenanceMode: boolean;
  coinsToPKR: number;
  coinsToUSD: number;
  updatedAt: number;
};

export type ActivityLog = {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: number;
};

export type UserComment = {
  id: string;
  userId: string;
  adminId: string;
  adminName: string;
  comment: string;
  createdAt: number;
};
