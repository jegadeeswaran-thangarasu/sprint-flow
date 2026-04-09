import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrgProjects, useCreateProject, useArchiveProject } from '@/hooks/useProject';
import ProjectCard from '@/components/projects/ProjectCard';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import Button from '@/components/ui/Button';

const EmptyState = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="text-6xl mb-6 select-none">📋</div>
    <h2 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h2>
    <p className="text-sm text-gray-500 max-w-xs mb-8 leading-relaxed">
      Create your first project to start tracking work and organising your team.
    </p>
    <Button onClick={onCreateClick}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Create project
    </Button>
  </div>
);

const ProjectsPage = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const slug = orgSlug ?? '';

  const [showModal, setShowModal] = useState(false);

  const { data: projects = [], isLoading, isError } = useOrgProjects(slug);
  const createProject = useCreateProject(slug);
  const archiveProject = useArchiveProject(slug);

  const handleCreate = (data: {
    name: string;
    key: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => {
    createProject.mutate(data, {
      onSuccess: () => setShowModal(false),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="h-6 w-6 animate-spin text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-sm text-red-500 font-medium">Failed to load projects</p>
        <p className="text-xs text-gray-400">Please refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          {projects.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {projects.length}
            </span>
          )}
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create project
        </Button>
      </div>

      {/* Content */}
      {projects.length === 0 ? (
        <EmptyState onCreateClick={() => setShowModal(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              orgSlug={slug}
              onArchive={(id) => archiveProject.mutate(id)}
              isArchiving={archiveProject.isPending}
            />
          ))}
        </div>
      )}

      {/* Create project modal */}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          isLoading={createProject.isPending}
        />
      )}
    </>
  );
};

export default ProjectsPage;
