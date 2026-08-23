import React, { useState } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileBadge,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { AchievementItem } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface AchievementsManagerProps {
  isDemo?: boolean;
}

export const AchievementsManager: React.FC<AchievementsManagerProps> = ({ isDemo = false }) => {
  const {
    achievements,
    activeStudentProfile,
    addAchievement,
    updateAchievement,
    deleteAchievement,
  } = useStudentTwin();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    date: '',
    description: '',
    certificateUrl: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAchievements = achievements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingAchievement(null);
    setFormData({
      title: '',
      organization: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      certificateUrl: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ach: AchievementItem) => {
    setEditingAchievement(ach);
    setFormData({
      title: ach.title,
      organization: ach.organization,
      date: ach.date,
      description: ach.description,
      certificateUrl: ach.certificateUrl || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Achievement Title is required');
      return;
    }
    if (!formData.organization.trim()) {
      setFormError('Awarding Organization is required');
      return;
    }

    setIsSubmitting(true);
    if (editingAchievement) {
      const res = await updateAchievement(editingAchievement.id, formData);
      setIsSubmitting(false);
      if (res.error) {
        setFormError(res.error.message);
      } else {
        setModalOpen(false);
      }
    } else {
      const res = await addAchievement({
        ...formData,
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
    await deleteAchievement(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Verified Achievements & Certifications
            </h1>
            <Badge variant="blue" size="sm">
              PART 2 CORE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Real hackathons, certifications, and academic honors for {activeStudentProfile?.name || 'Active Student Twin'}.
          </p>
        </div>

        <Button
          id="add-achievement-btn"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Achievement
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="search-achievements"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search achievements or organizations..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredAchievements.length} of {achievements.length} Achievements
        </span>
      </div>

      {/* Achievements List */}
      {filteredAchievements.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
            No Achievements Recorded Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Log your hackathon wins, official certifications (AWS, GCP, Coursera), academic honors, or published papers.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add First Achievement
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => (
            <Card
              key={ach.id}
              className="p-5 flex flex-col justify-between hover:border-slate-700 transition-all border-slate-800"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {ach.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {ach.organization}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="my-3 space-y-1.5 text-xs text-slate-400">
                  <p className="line-clamp-2 leading-relaxed text-slate-300 dark:text-slate-300 light:text-slate-700">
                    {ach.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{ach.date || 'Date unrecorded'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                {ach.certificateUrl ? (
                  <a
                    href={ach.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <FileBadge className="w-3.5 h-3.5" /> View Credential
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Self-Attested</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ach)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Edit Achievement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(ach.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Delete Achievement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real achievement records are stored in Supabase (public.achievements).
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
                  Achievement Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="achievement-title-input"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 1st Place - Smart India Hackathon"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Issuing Organization <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Ministry of Education / AWS / Coursera"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Date Conferred
                </label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g. May 2024"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Credential / Verification Link URL
                </label>
                <input
                  type="url"
                  value={formData.certificateUrl}
                  onChange={(e) => setFormData({ ...formData, certificateUrl: e.target.value })}
                  placeholder="https://credly.com/... or certificate link"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Description / Impact
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief notes on project scope or ranking achieved..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
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
                  id="submit-achievement-form-btn"
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  {editingAchievement ? 'Update Achievement' : 'Add Achievement'}
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
              Delete Achievement?
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              This will permanently delete this achievement from your Supabase database.
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
