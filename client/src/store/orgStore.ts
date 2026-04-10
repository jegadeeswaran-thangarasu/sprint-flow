import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IOrganisation } from '@/types';

interface TOrgState {
  currentOrg: IOrganisation | null;
  myOrgs: IOrganisation[];
}

interface TOrgActions {
  setCurrentOrg: (org: IOrganisation) => void;
  setMyOrgs: (orgs: IOrganisation[]) => void;
  addOrg: (org: IOrganisation) => void;
  updateOrg: (org: IOrganisation) => void;
  removeOrg: (slug: string) => void;
}

type TOrgStore = TOrgState & TOrgActions;

const useOrgStore = create<TOrgStore>()(
  persist(
    (set) => ({
      currentOrg: null,
      myOrgs: [],

      setCurrentOrg: (org) => set({ currentOrg: org }),

      setMyOrgs: (orgs) => set({ myOrgs: orgs }),

      addOrg: (org) => set((state) => ({ myOrgs: [...state.myOrgs, org] })),

      updateOrg: (org) =>
        set((state) => ({
          myOrgs: state.myOrgs.map((o) => (o.slug === org.slug ? org : o)),
          currentOrg: state.currentOrg?.slug === org.slug ? org : state.currentOrg,
        })),

      removeOrg: (slug) =>
        set((state) => ({
          myOrgs: state.myOrgs.filter((o) => o.slug !== slug),
          currentOrg: state.currentOrg?.slug === slug ? null : state.currentOrg,
        })),
    }),
    {
      name: 'sprintflow-org',
      partialize: (state) => ({
        currentOrg: state.currentOrg,
        myOrgs: state.myOrgs,
      }),
    },
  ),
);

export default useOrgStore;
