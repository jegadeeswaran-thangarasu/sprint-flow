import { create } from 'zustand';
import { ISprint } from '@/types';

interface SprintState {
  sprints: ISprint[];
  activeSprint: ISprint | null;
  currentSprint: ISprint | null;
  setSprints: (sprints: ISprint[]) => void;
  setCurrentSprint: (sprint: ISprint | null) => void;
  addSprint: (sprint: ISprint) => void;
  updateSprint: (sprint: ISprint) => void;
  removeSprint: (id: string) => void;
}

const useSprintStore = create<SprintState>((set) => ({
  sprints: [],
  activeSprint: null,
  currentSprint: null,
  setSprints: (sprints) =>
    set({
      sprints,
      activeSprint: sprints.find((s) => s.status === 'active') ?? null,
    }),
  setCurrentSprint: (currentSprint) => set({ currentSprint }),
  addSprint: (sprint) =>
    set((state) => ({
      sprints: [...state.sprints, sprint],
      activeSprint: sprint.status === 'active' ? sprint : state.activeSprint,
    })),
  updateSprint: (sprint) =>
    set((state) => {
      const sprints = state.sprints.map((s) => (s._id === sprint._id ? sprint : s));
      return {
        sprints,
        activeSprint: sprints.find((s) => s.status === 'active') ?? null,
        currentSprint: state.currentSprint?._id === sprint._id ? sprint : state.currentSprint,
      };
    }),
  removeSprint: (id) =>
    set((state) => {
      const sprints = state.sprints.filter((s) => s._id !== id);
      return {
        sprints,
        activeSprint: sprints.find((s) => s.status === 'active') ?? null,
        currentSprint: state.currentSprint?._id === id ? null : state.currentSprint,
      };
    }),
}));

export default useSprintStore;
