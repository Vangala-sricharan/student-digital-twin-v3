import React, { useState } from 'react';
import {
  Code,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { SkillItem, SkillCategory, SkillProficiency } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

const CATEGORIES: (SkillCategory | 'All')[] = [
  'All',
  'Programming',
  'DSA',
  'AI/ML',
  'Web Development',
  'Databases',
  'Cloud',
  'Tools',
  'Soft Skills',
];

const PROFICIENCIES: SkillProficiency[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

interface SkillsManagerProps {
  isDemo?: boolean;
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({ isDemo = false }) => {
  const {
    skills,
    activeStudentProfile,
    addSkill,
    updateSkill,
    deleteSkill,
  } = useStudentTwin();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    skillName: string;
    category: SkillCategory;
    proficiency: SkillProficiency;
    score: number;
  }>({
    skillName: '',
    category: 'Programming',
    proficiency: 'Intermediate',
    score: 75,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSkills = skills.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch = s.skillName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingSkill(null);
    setFormData({
      skillName: '',
      category: selectedCategory !== 'All' ? (selectedCategory as SkillCategory) : 'Programming',
      proficiency: 'Intermediate',
      score: 75,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (skill: SkillItem) => {
    setEditingSkill(skill);
    setFormData({
      skillName: skill.skillName,
      category: skill.category as SkillCategory,
      proficiency: skill.proficiency,
      score: skill.score,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.skillName.trim()) {
      setFormError('Skill Name is required');
      return;
    }

    setIsSubmitting(true);
    if (editingSkill) {
      const res = await updateSkill(editingSkill.id, formData);
      setIsSubmitting(false);
      if (res.error) {
        setFormError(res.error.message);
      } else {
        setModalOpen(false);
      }
    } else {
      const res = await addSkill({
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
    await deleteSkill(id);
    setDeleteConfirmId(null);
  };

  const getProficiencyColor = (p: SkillProficiency) => {
    switch (p) {
      case 'Expert':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'Advanced':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Intermediate':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Verified Technical Skills
            </h1>
            <Badge variant="blue" size="sm">
              PART 2 CORE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Real skills tracked for {activeStudentProfile?.name || 'Active Student Twin'}. No simulated data.
          </p>
        </div>

        <Button
          id="add-skill-btn"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Skill
        </Button>
      </div>

      {/* Categories Horizontal Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`skill-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="search-skills"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills (e.g. Python, Docker, PyTorch)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredSkills.length} of {skills.length} Skills
        </span>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Code className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
            No Skills Registered Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Add your verified engineering languages, frameworks, AI/ML tools, and soft skills to calibrate your digital twin.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add First Skill
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <Card
              key={skill.id}
              className="p-4 flex flex-col justify-between hover:border-slate-700 transition-all border-slate-800"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {skill.skillName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">{skill.category}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getProficiencyColor(
                      skill.proficiency
                    )}`}
                  >
                    {skill.proficiency}
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div className="my-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Proficiency Index</span>
                    <span className="font-bold text-slate-200">{skill.score} / 100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, skill.score))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(skill.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(skill)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Edit Skill"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(skill.id)}
                    className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Delete Skill"
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
              {editingSkill ? 'Edit Skill' : 'Add New Skill'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real skill records are directly saved to Supabase (public.skills).
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Skill Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="skill-name-input"
                  type="text"
                  required
                  value={formData.skillName}
                  onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                  placeholder="e.g. Python, React.js, PyTorch, Kubernetes"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as SkillCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Proficiency
                  </label>
                  <select
                    value={formData.proficiency}
                    onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as SkillProficiency })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  >
                    {PROFICIENCIES.map((p) => (
                      <option key={p} value={p} className="bg-slate-900 text-white">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  <span>Proficiency Score: {formData.score} / 100</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
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
                  id="submit-skill-form-btn"
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  {editingSkill ? 'Update Skill' : 'Add Skill'}
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
              Delete Skill?
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              This will permanently delete this skill record from your Supabase database.
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
