import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IProject } from '@/types';

interface ProjectCardProps {
  project: IProject;
  orgSlug: string;
  onArchive: (projectId: string) => void;
  isArchiving: boolean;
}

const UserAvatar = ({ name, avatar, size = 'sm' }: { name: string; avatar?: string; size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'md' ? 'h-7 w-7 text-sm' : 'h-6 w-6 text-xs';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <div
      className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}
    >
      <span className="font-semibold text-blue-700">{initial}</span>
    </div>
  );
};

interface ThreeDotsMenuProps {
  onEdit: () => void;
  onArchive: () => void;
  isArchiving: boolean;
}

const ThreeDotsMenu = ({ onEdit, onArchive, isArchiving }: ThreeDotsMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Project options"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Archive this project? It will be hidden from the projects list.')) {
                onArchive();
              }
              setOpen(false);
            }}
            disabled={isArchiving}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8m-9 4v4m4-4v4" />
            </svg>
            Archive
          </button>
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, orgSlug, onArchive, isArchiving }: ProjectCardProps) => {
  const navigate = useNavigate();

  const accentColor = project.color || '#6366f1';

  const handleCardClick = () => {
    navigate(`/org/${orgSlug}/projects/${project._id}/board`);
  };

  const handleEdit = () => {
    // Edit navigation — placeholder for edit modal
    navigate(`/org/${orgSlug}/projects/${project._id}/board`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 flex flex-col"
    >
      {/* Color accent bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: accentColor }} />

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Header: icon + name + menu */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            {project.icon || '📁'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-mono rounded">
              {project.key}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ThreeDotsMenu
              onEdit={handleEdit}
              onArchive={() => onArchive(project._id)}
              isArchiving={isArchiving}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-2">
          {project.description || (
            <span className="italic text-gray-300">No description</span>
          )}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          {/* Lead */}
          {project.lead ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <UserAvatar name={project.lead.name} avatar={project.lead.avatar} />
              <span className="text-xs text-gray-500 truncate">{project.lead.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">No lead</span>
          )}

          {/* Issue count */}
          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{project.issueCount} {project.issueCount === 1 ? 'issue' : 'issues'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
