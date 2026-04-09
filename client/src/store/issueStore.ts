import { create } from 'zustand';
import { IIssue, IssueStatus } from '@/types';

interface IssueState {
  issues: IIssue[];
  backlogIssues: IIssue[];
  currentIssue: IIssue | null;
  setIssues: (issues: IIssue[]) => void;
  setBacklogIssues: (issues: IIssue[]) => void;
  setCurrentIssue: (issue: IIssue | null) => void;
  addIssue: (issue: IIssue) => void;
  updateIssue: (issue: IIssue) => void;
  removeIssue: (id: string) => void;
  updateIssueStatusLocally: (issueId: string, status: IssueStatus, order: number) => void;
}

const mapIssue = (issue: IIssue, issueId: string, status: IssueStatus, order: number): IIssue =>
  issue._id === issueId ? { ...issue, status, order } : issue;

const useIssueStore = create<IssueState>((set) => ({
  issues: [],
  backlogIssues: [],
  currentIssue: null,
  setIssues: (issues) => set({ issues }),
  setBacklogIssues: (backlogIssues) => set({ backlogIssues }),
  setCurrentIssue: (currentIssue) => set({ currentIssue }),
  addIssue: (issue) =>
    set((state) => ({
      issues: [issue, ...state.issues],
      backlogIssues:
        issue.sprint === null && issue.status !== 'done'
          ? [issue, ...state.backlogIssues]
          : state.backlogIssues,
    })),
  updateIssue: (issue) =>
    set((state) => ({
      issues: state.issues.map((i) => (i._id === issue._id ? issue : i)),
      backlogIssues: state.backlogIssues.map((i) => (i._id === issue._id ? issue : i)),
      currentIssue: state.currentIssue?._id === issue._id ? issue : state.currentIssue,
    })),
  removeIssue: (id) =>
    set((state) => ({
      issues: state.issues.filter((i) => i._id !== id),
      backlogIssues: state.backlogIssues.filter((i) => i._id !== id),
      currentIssue: state.currentIssue?._id === id ? null : state.currentIssue,
    })),
  updateIssueStatusLocally: (issueId, status, order) =>
    set((state) => ({
      issues: state.issues.map((i) => mapIssue(i, issueId, status, order)),
      backlogIssues: state.backlogIssues.map((i) => mapIssue(i, issueId, status, order)),
      currentIssue:
        state.currentIssue?._id === issueId
          ? { ...state.currentIssue, status, order }
          : state.currentIssue,
    })),
}));

export default useIssueStore;
