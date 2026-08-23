import React, { useState } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Building2,
  Clock,
  Briefcase,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { CareerGoalItem } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface CareerGoalsManagerProps {
  isDemo?: boolean;
}

export const CareerGoalsManager: React.FC<CareerGoalsManagerProps> = ({ isDemo = false }) => {
  const {
    careerGoals,
    activeStudentProfile,
    addCareerGoal,
    updateCareerGoal,
    deleteCareerGoal,
    setActiveGoal,
  } = useStudentTwin();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CareerGoalItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    goal: '',
    targetRole: '',
    targetCompaniesInput: '',
    requiredSkillsInput: '',
    timeline: '',
    isActive: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setFormData({
      goal: '',
      targetRole: '',
      targetCompaniesInput: '',
      requiredSkillsInput: '',
      timeline: '6-12 Months',
      isActive: careerGoals.length === 0,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CareerGoalItem) => {
    setEditingGoal(item);
    setFormData({
      goal: item.goal,
      targetRole: item.targetRole,
      targetCompaniesInput: item.targetCompanies.join(', '),
      requiredSkillsInput: item.requiredSkills.join(', '),
      timeline: item.timeline,
      isActive: item.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.goal.trim()) {
      setFormError('Goal title is required');
      return;
    }
    if (!formData.targetRole.trim()) {
      setFormError('Target Role is required');
      return;
    }

    const companies = (formData.targetCompaniesInput || '')
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const skills = (formData.requiredSkillsInput || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setIsSubmitting(true);
    if (editingGoal) {
      const res = await updateCareerGoal(editingGoal.id, {
        goal: formData.goal,
        targetRole: formData.targetRole,
        targetCompanies: companies,
        requiredSkills: skills,
        timeline: formData.timeline,
        isActive: formData.isActive,
      });
      setIsSubmitting(false);
      if (res.error) {
        setFormError(res.error.message);
      } else {
        setModalOpen(false);
      }
    } else {
      const res = await addCareerGoal({
        goal: formData.goal,
        targetRole: formData.targetRole,
        targetCompanies: companies,
        requiredSkills: skills,
        timeline: formData.timeline,
        isActive: formData.isActive,
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
    await deleteCareerGoal(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Career Goals & Target Trajectories
            </h1>
            <Badge variant="blue" size="sm">
              PART 2 CORE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Define target job roles, aspirational companies, and required competencies for {activeStudentProfile?.name || 'Active Student Twin'}.
          </p>
        </div>

        <Button
          id="add-career-goal-btn"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Career Goal
        </Button>
      </div>

      {/* Goals Grid */}
      {careerGoals.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
            No Career Goals Defined
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Set your target positions (e.g. AI/ML Engineer, SRE, Product Engineer) and benchmark required skills.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create First Career Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {careerGoals.map((item) => (
            <Card
              key={item.id}
              className={`p-5 flex flex-col justify-between transition-all border ${
                item.isActive
                  ? 'border-blue-500/50 bg-blue-950/10 dark:bg-blue-950/10 light:bg-sky-50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {item.goal}
                    </h3>
                    <span className="text-xs text-blue-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5" /> {item.targetRole}
                    </span>
                  </div>

                  {item.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE TARGET
                    </span>
                  )}
                </div>

                <div className="space-y-3 my-4 text-xs">
                  {/* Timeline */}
                  {item.timeline && (
                    <div className="flex items-center gap-2 text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Target Timeline: <strong className="text-slate-200">{item.timeline}</strong></span>
                    </div>
                  )}

                  {/* Target Companies */}
                  {item.targetCompanies.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-500" /> Target Organizations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.targetCompanies.map((comp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 border border-white/10 text-slate-300"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Skills */}
                  {item.requiredSkills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <ListChecks className="w-3 h-3 text-slate-500" /> Key Required Competencies:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.requiredSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                {!item.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveGoal(item.id)}
                  >
                    Set as Primary Target
                  </Button>
                ) : (
                  <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Calibrating Digital Twin
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Edit Goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Delete Goal"
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
          <Card className="w-full max-w-lg p-6 bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              {editingGoal ? 'Edit Career Target' : 'Define New Career Target'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real career targets are stored in Supabase (public.career_goals).
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
                  Goal Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="career-goal-title-input"
                  type="text"
                  required
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="e.g. Secure Machine Learning Engineer Role at High-Growth Tech Firm"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Target Job Role <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    placeholder="e.g. AI/ML Engineer"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Target Timeline
                  </label>
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="e.g. 6 Months / By Dec 2025"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Target Companies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.targetCompaniesInput}
                  onChange={(e) => setFormData({ ...formData, targetCompaniesInput: e.target.value })}
                  placeholder="e.g. Google, DeepMind, Microsoft, Anthropic, Stripe"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Required Competencies & Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.requiredSkillsInput}
                  onChange={(e) => setFormData({ ...formData, requiredSkillsInput: e.target.value })}
                  placeholder="e.g. Distributed Training, PyTorch, CUDA, Transformers, System Design"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="goal-active-checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
                <label htmlFor="goal-active-checkbox" className="text-xs text-slate-300 cursor-pointer">
                  Set as primary active career target for this twin
                </label>
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
                  id="submit-career-goal-form-btn"
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  {editingGoal ? 'Update Goal' : 'Save Goal'}
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
              Delete Career Target?
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              This will permanently delete this career goal from your Supabase database.
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
