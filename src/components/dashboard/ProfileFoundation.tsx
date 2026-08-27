import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  GraduationCap,
  BookOpen,
  Target,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Github,
  Linkedin,
  Phone,
  MapPin,
  Briefcase,
  UploadCloud,
  RefreshCw,
  Camera,
  Image,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { studentTwinService } from '../../services/studentTwinService';
import { PRICING_PLANS } from '../../constants/pricing';
import { formatINR } from '../../utils/formatters';

interface ProfileFoundationProps {
  userProfile: UserProfile | null;
  isDemo?: boolean;
}

export const ProfileFoundation: React.FC<ProfileFoundationProps> = ({
  userProfile: propUserProfile,
  isDemo = false,
}) => {
  const {
    userProfile: ctxUserProfile,
    updateUserProfile,
    uploadDataToCloud,
    isSyncing,
    syncStatus,
    syncMessage,
  } = useStudentTwin();

  const profile = isDemo ? propUserProfile : ctxUserProfile || propUserProfile;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    university: profile?.university || '',
    degree: profile?.degree || 'B.Tech',
    branch: profile?.branch || '',
    year: profile?.year || '1st Year',
    careerGoal: profile?.careerGoal || '',
    targetRole: profile?.targetRole || '',
    bio: profile?.bio || '',
    githubUrl: profile?.githubUrl || '',
    linkedinUrl: profile?.linkedinUrl || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    profileImageUrl: profile?.profileImageUrl || profile?.avatarUrl || '',
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        university: profile.university || '',
        degree: profile.degree || 'B.Tech',
        branch: profile.branch || '',
        year: profile.year || '1st Year',
        careerGoal: profile.careerGoal || '',
        targetRole: profile.targetRole || '',
        bio: profile.bio || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        phone: profile.phone || '',
        location: profile.location || '',
        profileImageUrl: profile.profileImageUrl || profile.avatarUrl || '',
      });
    }
  }, [profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please select a valid image file (PNG, JPG, WebP).');
      setSaveStatus('error');
      return;
    }

    // Read and compress image
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          // Show instant preview
          setFormData((prev) => ({
            ...prev,
            profileImageUrl: compressedDataUrl,
          }));

          // Upload directly to Supabase Storage if authenticated
          if (!isDemo && profile?.id) {
            try {
              const { url: storageUrl } = await studentTwinService.uploadProfileImage(profile.id, file);
              if (storageUrl) {
                setFormData((prev) => ({
                  ...prev,
                  profileImageUrl: storageUrl,
                }));
                await updateUserProfile({
                  profileImageUrl: storageUrl,
                  avatarUrl: storageUrl,
                });
                setStatusMessage('Profile photo uploaded and synced to cloud storage.');
                setSaveStatus('success');
                setTimeout(() => {
                  setSaveStatus('idle');
                  setStatusMessage(null);
                }, 3000);
                return;
              }
            } catch (err) {
              console.warn('[ProfileFoundation] Storage upload notice:', err);
            }
          }

          setStatusMessage('Profile photo updated. Click Save Profile or Upload to Cloud to sync.');
          setSaveStatus('idle');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profileImageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setSaveStatus('success');
      setStatusMessage('Demo showcase profile updated in memory.');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');
    setStatusMessage(null);

    const result = await updateUserProfile({
      ...formData,
      program: `${formData.degree} in ${formData.branch}`,
    });

    if (result.success) {
      setSaveStatus('success');
      setStatusMessage('Profile successfully saved to cloud storage.');
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage(null);
      }, 4000);
    } else {
      setSaveStatus('error');
      setStatusMessage(result.error?.message || 'Failed to update profile');
    }
  };

  const handleManualUpload = async () => {
    if (isDemo) return;
    setStatusMessage(null);
    const res = await uploadDataToCloud({
      ...formData,
      program: `${formData.degree} in ${formData.branch}`,
    });
    if (res.success) {
      setStatusMessage('Cloud Sync Successful: Your profile is updated in Supabase.');
    } else {
      setStatusMessage(res.message || 'Failed to sync with Supabase.');
    }
  };

  const degreeOptions = [
    'B.Tech',
    'B.E.',
    'B.S. / B.Sc',
    'BCA',
    'M.Tech',
    'M.S. / M.Sc',
    'MCA',
    'Ph.D.',
    'Other Degree',
  ];

  const yearOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Final Year',
    'Graduate / Alum',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Student Twin Profile Foundation
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            {isDemo
              ? 'Creator showcase profile data (Isolated Demo Mode)'
              : 'Authenticated user profile synced with Supabase (auth.uid() = user_id)'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isDemo && (
            <Button
              id="profile-cloud-sync-btn"
              variant={syncStatus === 'success' ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleManualUpload}
              disabled={isSyncing}
              isLoading={isSyncing}
              leftIcon={
                syncStatus === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : syncStatus === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                )
              }
            >
              {isSyncing
                ? 'Uploading...'
                : syncStatus === 'success'
                ? 'Cloud Sync Successful'
                : syncStatus === 'error'
                ? 'Retry Cloud Upload'
                : 'Upload to Cloud'}
            </Button>
          )}
          <Badge variant={isDemo ? 'amber' : 'blue'} size="md">
            {isDemo ? 'DEMO PROFILE' : 'AUTHENTICATED TWIN'}
          </Badge>
        </div>
      </div>

      {syncMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
            syncStatus === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {syncStatus === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{syncMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Identity Card */}
        <Card className="p-6 flex flex-col items-center text-center">
          {/* Avatar Container with Upload Overlay */}
          <div className="relative group mb-4">
            {formData.profileImageUrl ? (
              <img
                src={formData.profileImageUrl}
                alt={formData.fullName || 'Student Avatar'}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/40 shadow-xl shadow-blue-500/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold font-mono shadow-xl shadow-blue-500/20">
                {formData.fullName
                  ? (formData.fullName || 'ST')
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase() || 'ST'
                  : 'ST'}
              </div>
            )}

            {/* Photo Action Overlay / Button */}
            <button
              id="profile-photo-upload-trigger"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg border border-white/20 transition-all cursor-pointer"
              title="Upload / Change Profile Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Photo Actions Row */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-blue-400 hover:underline font-medium"
            >
              {formData.profileImageUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {formData.profileImageUrl && (
              <>
                <span className="text-slate-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] text-rose-400 hover:underline font-medium"
                >
                  Remove
                </button>
              </>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            {formData.fullName || 'Student User'}
          </h2>
          <p className="text-xs text-slate-400 truncate max-w-[220px] mt-0.5">
            {profile?.email || 'Authenticated User'}
          </p>
          <div className="mt-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {formData.targetRole || formData.careerGoal || 'Student Aspirant'}
            </span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-800 dark:border-slate-800 light:border-sky-100 space-y-3 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Subscription Plan:</span>
              <span className="font-bold text-emerald-400 uppercase">
                {profile?.plan === 'pro' ? `PRO (${formatINR(PRICING_PLANS.pro.annualPrice)}/yr)` : `FREE PLAN (${formatINR(0)})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auth UID:</span>
              <span className="font-mono text-slate-300 truncate max-w-[120px]" title={profile?.id}>
                {profile?.id || 'authenticated-uid'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RLS Ownership:</span>
              <span className="font-semibold text-blue-400">auth.uid() = user_id</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cloud Storage:</span>
              <span className="font-semibold text-slate-200">Supabase PostgreSQL</span>
            </div>
          </div>
        </Card>

        {/* Right Form Fields */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Core Profile & Academic Details
            </h3>
            {saveStatus === 'success' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved to Supabase
              </span>
            )}
          </div>

          {statusMessage && saveStatus !== 'idle' && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                saveStatus === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {saveStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
                >
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alex Johnson"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* University & Degree */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-university"
                  className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
                >
                  University / College <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-university"
                    type="text"
                    required
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    placeholder="e.g. National Institute of Technology"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Degree Program <span className="text-rose-400">*</span>
                </label>
                <select
                  id="profile-degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {degreeOptions.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Branch & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-branch"
                  className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
                >
                  Branch / Major <span className="text-rose-400">*</span>
                </label>
                <input
                  id="profile-branch"
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-year"
                  className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
                >
                  Academic Year <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <select
                    id="profile-year"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {yearOptions.map((yr) => (
                      <option key={yr} value={yr} className="bg-slate-900 text-white">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Career Goal & Target Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-goal"
                  className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
                >
                  Primary Career Goal <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Target className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-goal"
                    type="text"
                    required
                    value={formData.careerGoal}
                    onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
                    placeholder="e.g. AI/ML Engineer"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-target-role"
                  className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
                >
                  Target Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-target-role"
                    type="text"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    placeholder="e.g. Lead ML Engineer"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Social & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  GitHub Profile URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Github className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-github"
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  LinkedIn Profile URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-linkedin"
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Location & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Location / City
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hyderabad, India"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Phone / Mobile
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                Aspirations & Technical Bio
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Detail your engineering passions, core technical interests, and primary twin focus..."
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                id="profile-save-btn"
                type="submit"
                variant="primary"
                size="md"
                isLoading={saveStatus === 'saving'}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile to Supabase
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
