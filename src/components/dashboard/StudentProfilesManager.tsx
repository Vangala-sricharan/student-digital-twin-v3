import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Target,
  Search,
  UserCheck,
  Building2,
  Calendar,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { StudentProfile } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface StudentProfilesManagerProps {
  isDemo?: boolean;
}

export const StudentProfilesManager: React.FC<StudentProfilesManagerProps> = ({ isDemo = false }) => {
  const {
    studentProfiles,
    activeStudentProfileId,
    setActiveStudent,
    createStudentProfile,
    updateStudentProfile,
    deleteStudentProfile,
    allSkills,
    allProjects,
  } = useStudentTwin();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    university: '',
    degree: 'B.Tech',
    branch: '',
    year: '1st Year',
    careerGoal: '',
    targetRole: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProfiles = studentProfiles.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.careerGoal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      university: '',
      degree: 'B.Tech',
      branch: '',
      year: '1st Year',
      careerGoal: '',
      targetRole: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (profile: StudentProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      university: profile.university,
      degree: profile.degree || 'B.Tech',
      branch: profile.branch,
      year: profile.year,
      careerGoal: profile.careerGoal,
      targetRole: profile.targetRole || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Student Name is required');
      return;
    }
    if (!formData.university.trim()) {
      setFormError('University is required');
      return;
    }

    setIsSubmitting(true);
    if (editingProfile) {
      const res = await updateStudentProfile(editingProfile.id, formData);
      setIsSubmitting(false);
      if (res.error) {
        setFormError(res.error.message);
      } else {
        setModalOpen(false);
      }
    } else {
      const res = await createStudentProfile({
        ...formData,
        isActive: studentProfiles.length === 0,
        profileData: {},
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
    await deleteStudentProfile(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Student Profiles Management
            </h1>
            <Badge variant="blue" size="sm">
              PART 2 CORE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Manage multiple student profiles under your authenticated account. Switch active student to focus twin metrics.
          </p>
        </div>

        <Button
          id="add-student-profile-btn"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Student Profile
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="search-student-profiles"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student profiles..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredProfiles.length} of {studentProfiles.length} Profiles
        </span>
      </div>

      {/* Profiles List */}
      {filteredProfiles.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
            No Student Profiles Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Create your primary student profile to begin tracking real verified skills, engineering projects, and career targets.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create First Student Profile
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProfiles.map((profile) => {
            const isActive = profile.id === activeStudentProfileId;
            const profileSkillsCount = allSkills.filter(
              (s) => !s.studentProfileId || s.studentProfileId === profile.id
            ).length;
            const profileProjectsCount = allProjects.filter(
              (p) => !p.studentProfileId || p.studentProfileId === profile.id
            ).length;

            return (
              <Card
                key={profile.id}
                className={`p-5 flex flex-col justify-between transition-all relative ${
                  isActive
                    ? 'border-blue-500/50 bg-blue-950/10 dark:bg-blue-950/10 light:bg-sky-50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                        {(profile.name || 'Student')
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center gap-1.5">
                          {profile.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {profile.branch || 'General Engineering'}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 my-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{profile.university}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{profile.degree} • {profile.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate font-semibold text-blue-400">{profile.careerGoal}</span>
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 text-[11px] font-mono">
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {profileSkillsCount} Skills
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {profileProjectsCount} Projects
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  {!isActive ? (
                    <Button
                      id={`set-active-student-${profile.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveStudent(profile.id)}
                      leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                    >
                      Set Active Twin
                    </Button>
                  ) : (
                    <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Current Workspace
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(profile)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(profile.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              {editingProfile ? 'Edit Student Profile' : 'Create New Student Profile'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configures student entity metadata for isolated digital twin computation.
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
                  Student Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  University / Institution <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="e.g. Stanford University"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    placeholder="B.Tech"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="3rd Year"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Branch / Major
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="Computer Science"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Career Goal
                </label>
                <input
                  type="text"
                  value={formData.careerGoal}
                  onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
                  placeholder="AI/ML Engineer"
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
                  id="submit-student-profile-form"
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  {editingProfile ? 'Update Profile' : 'Create Profile'}
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
              Delete Student Profile?
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              This will remove this student profile from Supabase. Any linked skills or projects will have their associations cleaned.
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
