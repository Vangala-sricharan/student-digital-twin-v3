import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  Github,
  CheckCircle2,
  AlertCircle,
  Eye,
  Tag,
  Layers,
  Activity,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { ProjectItem, ProjectDifficulty, ProjectStatus } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

const DIFFICULTIES: ProjectDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Production'];
const STATUSES: ProjectStatus[] = ['In Progress', 'Completed', 'Archived'];

interface ProjectsManagerProps {
  isDemo?: boolean;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ isDemo = false }) => {
  const {
    projects,
    activeStudentProfile,
    addProject,
    updateProject,
    deleteProject,
  } = useStudentTwin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalItem, setDetailModalItem] = useState<ProjectItem | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    architecture: string;
    techStackInput: string;
    githubUrl: string;
    liveDemoUrl: string;
    role: string;
    difficulty: ProjectDifficulty;
    status: ProjectStatus;
  }>({
    title: '',
    description: '',
    architecture: '',
    techStackInput: '',
    githubUrl: '',
    liveDemoUrl: '',
    role: 'Lead Developer',
    difficulty: 'Intermediate',
    status: 'Completed',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      architecture: '',
      techStackInput: '',
      githubUrl: '',
      liveDemoUrl: '',
      role: 'Lead Developer',
      difficulty: 'Intermediate',
      status: 'Completed',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      architecture: project.architecture,
      techStackInput: project.techStack.join(', '),
      githubUrl: project.githubUrl,
      liveDemoUrl: project.liveDemoUrl || '',
      role: project.role,
      difficulty: project.difficulty,
      status: project.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Project Title is required');
      return;
    }

    const techStackArray = (formData.techStackInput || '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsSubmitting(true);
    if (editingProject) {
      const res = await updateProject(editingProject.id, {
        title: formData.title,
        description: formData.description,
        architecture: formData.architecture,
        techStack: techStackArray,
        githubUrl: formData.githubUrl,
        liveDemoUrl: formData.liveDemoUrl,
        role: formData.role,
        difficulty: formData.difficulty,
        status: formData.status,
      });
      setIsSubmitting(false);
      if (res.error) {
        setFormError(res.error.message);
      } else {
        setModalOpen(false);
      }
    } else {
      const res = await addProject({
        title: formData.title,
        description: formData.description,
        architecture: formData.architecture,
        techStack: techStackArray,
        githubUrl: formData.githubUrl,
        liveDemoUrl: formData.liveDemoUrl,
        role: formData.role,
        difficulty: formData.difficulty,
        status: formData.status,
        studentProfileId: activeStudentProfile?.id,
      });
      setIsSubmitting(false);
      if (res.error) {
        setFormError(res.error.message);
      } else {
        setModalOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Engineering Projects Repository
            </h1>
            <Badge variant="blue" size="sm">
              PART 2 CORE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Real portfolio projects and system architectures for {activeStudentProfile?.name || 'Active Student Twin'}.
          </p>
        </div>

        <Button
          id="add-project-btn"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Project
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="search-projects"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, tech stack..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredProjects.length} of {projects.length} Projects
        </span>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
            No Projects Added Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Log your software builds, AI models, distributed architectures, and full-stack systems.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add First Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="p-5 flex flex-col justify-between hover:border-slate-700 transition-all border-slate-800"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {project.title}
                    </h3>
                    <span className="text-[11px] text-blue-400 font-medium">{project.role}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      project.status === 'Completed'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : project.status === 'In Progress'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 line-clamp-3 mb-3">
                  {project.description || 'No description provided.'}
                </p>

                {/* Tech Stack Tags */}
                {project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.techStack.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">
                        +{project.techStack.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="GitHub Repository"
                    >
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {project.liveDemoUrl && (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                      title="Live Deployment"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailModalItem(project)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="View Architecture Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(project)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(project.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {detailModalItem.title}
                </h3>
                <span className="text-xs text-blue-400">{detailModalItem.role} • {detailModalItem.difficulty}</span>
              </div>
              <Badge variant="blue" size="sm">
                {detailModalItem.status}
              </Badge>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-1">Description</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {detailModalItem.description || 'No description provided.'}
              </p>
            </div>

            {detailModalItem.architecture && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-1">System Architecture</h4>
                <p className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {detailModalItem.architecture}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2">Technologies Used</h4>
              <div className="flex flex-wrap gap-1.5">
                {detailModalItem.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-slate-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {detailModalItem.githubUrl && (
                  <a
                    href={detailModalItem.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
                  >
                    <Github className="w-3.5 h-3.5" /> Source Code
                  </a>
                )}
                {detailModalItem.liveDemoUrl && (
                  <a
                    href={detailModalItem.liveDemoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                  </a>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDetailModalItem(null)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg p-6 bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border-slate-700 shadow-2xl my-8">
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real projects are recorded in Supabase (public.projects).
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Project Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="project-title-input"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Task Orchestrator"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Role in Project
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Backend Lead, Solo Developer"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as ProjectDifficulty })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Tech Stack (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.techStackInput}
                  onChange={(e) => setFormData({ ...formData, techStackInput: e.target.value })}
                  placeholder="e.g. React, Node.js, Redis, PostgreSQL, Docker"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize the problem solved, engineering challenges, and key results..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  System Architecture / Workflow
                </label>
                <input
                  type="text"
                  value={formData.architecture}
                  onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                  placeholder="e.g. Microservices, Pub/Sub Event Loop, REST API Gateway"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={formData.liveDemoUrl}
                    onChange={(e) => setFormData({ ...formData, liveDemoUrl: e.target.value })}
                    placeholder="https://app.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  id="submit-project-form-btn"
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  {editingProject ? 'Update Project' : 'Add Project'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-5 bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border-rose-500/30 text-center">
            <Trash2 className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              Delete Project?
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              This will permanently delete this project record from your Supabase database.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
