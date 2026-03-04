import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useWaterStore = create(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    {
      name: 'water-settings',
    }
  )
);

export default useWaterStore;
