import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IProject } from '@/types';

interface TProjectState {
  projects: IProject[];
  currentProject: IProject | null;
}

interface TProjectActions {
  setProjects: (projects: IProject[]) => void;
  setCurrentProject: (project: IProject | null) => void;
  addProject: (project: IProject) => void;
  updateProject: (project: IProject) => void;
  removeProject: (id: string) => void;
}

type TProjectStore = TProjectState & TProjectActions;

const useProjectStore = create<TProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,

      setProjects: (projects) => set({ projects }),

      setCurrentProject: (project) => set({ currentProject: project }),

      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),

      updateProject: (project) =>
        set((state) => ({
          projects: state.projects.map((p) => (p._id === project._id ? project : p)),
          currentProject:
            state.currentProject?._id === project._id ? project : state.currentProject,
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p._id !== id),
          currentProject: state.currentProject?._id === id ? null : state.currentProject,
        })),
    }),
    {
      name: 'sprintflow-projects',
      partialize: (state) => ({
        currentProject: state.currentProject,
      }),
    },
  ),
);

export default useProjectStore;
