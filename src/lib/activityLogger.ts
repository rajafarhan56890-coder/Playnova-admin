import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const logAdminActivity = async (
  adminId: string,
  adminEmail: string,
  action: string,
  details: string
) => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      adminId,
      adminEmail,
      action,
      details,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
