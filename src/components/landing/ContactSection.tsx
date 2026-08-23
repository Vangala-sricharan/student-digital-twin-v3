import React, { useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle2, User, MessageSquare, Tag, Building2, Users, Phone } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const ContactSection: React.FC = () => {
  const [inquiryType, setInquiryType] = useState<'general' | 'campus'>('general');

  const [formData, setFormData] = useState({
    name: '',
    university: '',
    email: '',
    phone: '',
    cohortSize: '200 - 500 Students',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<{
    show: boolean;
    data?: typeof formData;
    inquiryType?: 'general' | 'campus';
  }>({ show: false });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please provide your full name.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    if (inquiryType === 'campus' && !formData.university.trim()) {
      newErrors.university = 'Please specify your college, university, or institution.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please provide your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (inquiryType === 'general' && !formData.subject.trim()) {
      newErrors.subject = 'Please specify a subject.';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please enter your message or requirements.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedStatus({
        show: true,
        data: { ...formData },
        inquiryType,
      });
      // Clear form inputs
      setFormData({
        name: '',
        university: '',
        email: '',
        phone: '',
        cohortSize: '200 - 500 Students',
        subject: '',
        message: '',
      });
    }, 600);
  };

  const handleReset = () => {
    setSubmittedStatus({ show: false });
  };

  return (
    <section id="contact" className="py-20 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="blue" size="md" className="mb-4">
            Contact & Campus Partnerships
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            Get in Touch with our Engineering Team
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600">
            Have questions about student digital twins, curriculum mapping, or campus placement cohorts? Send us a message.
          </p>

          {/* Inquiry Type Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-sky-100 border border-slate-800 dark:border-slate-800 light:border-sky-200 text-xs">
            <button
              id="contact-type-general-btn"
              type="button"
              onClick={() => setInquiryType('general')}
              className={`px-4 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                inquiryType === 'general'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              General Inquiry
            </button>
            <button
              id="contact-type-campus-btn"
              type="button"
              onClick={() => setInquiryType('campus')}
              className={`px-4 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                inquiryType === 'campus'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Campus / Institutional Cohort</span>
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8 border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
            {submittedStatus.show ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {submittedStatus.inquiryType === 'campus' ? 'Campus Partnership Inquiry Received' : 'Message Received'}
                </h3>
                
                <div className="p-4 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 text-left text-xs space-y-1.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                  <p><strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Name:</strong> {submittedStatus.data?.name}</p>
                  {submittedStatus.data?.university && (
                    <p><strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Institution:</strong> {submittedStatus.data.university}</p>
                  )}
                  <p><strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Email:</strong> {submittedStatus.data?.email}</p>
                  {submittedStatus.data?.phone && (
                    <p><strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Phone:</strong> {submittedStatus.data.phone}</p>
                  )}
                  {submittedStatus.inquiryType === 'campus' && (
                    <p><strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Cohort Size:</strong> {submittedStatus.data?.cohortSize}</p>
                  )}
                  {submittedStatus.data?.subject && (
                    <p><strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Subject:</strong> {submittedStatus.data.subject}</p>
                  )}
                  <p><strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Message:</strong> {submittedStatus.data?.message}</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Thank you for reaching out. Our team will review your inquiry and follow up at <strong>{submittedStatus.data?.email}</strong> within 24 business hours.
                </p>

                <div className="pt-2">
                  <Button
                    id="contact-another-message-btn"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    Send Another Message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
                  >
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      placeholder="e.g. Dr. Ramesh Gupta"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                        errors.name
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                      } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-rose-400 font-medium">{errors.name}</p>
                  )}
                </div>

                {/* University / Institution */}
                {inquiryType === 'campus' && (
                  <div>
                    <label
                      htmlFor="contact-university"
                      className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
                    >
                      College / University / Organization <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        id="contact-university"
                        type="text"
                        value={formData.university}
                        onChange={(e) => {
                          setFormData({ ...formData, university: e.target.value });
                          if (errors.university) setErrors({ ...errors, university: '' });
                        }}
                        placeholder="e.g. National Institute of Technology"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                          errors.university
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-purple-500'
                        } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                      />
                    </div>
                    {errors.university && (
                      <p className="mt-1 text-xs text-rose-400 font-medium">{errors.university}</p>
                    )}
                  </div>
                )}

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
                    >
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder="ramesh@university.edu.in"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                          errors.email
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                        } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
                    >
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Cohort Size for Campus */}
                {inquiryType === 'campus' && (
                  <div>
                    <label
                      htmlFor="contact-cohort"
                      className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
                    >
                      Estimated Student Cohort Size
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Users className="w-4 h-4" />
                      </div>
                      <select
                        id="contact-cohort"
                        value={formData.cohortSize}
                        onChange={(e) => setFormData({ ...formData, cohortSize: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      >
                        <option value="50 - 200 Students">50 - 200 Students (Single Department)</option>
                        <option value="200 - 500 Students">200 - 500 Students (Department Cohort)</option>
                        <option value="500 - 2000 Students">500 - 2,000 Students (Multi-Department)</option>
                        <option value="2000+ Students">2,000+ Students (Institution-Wide License)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Subject for General Inquiry */}
                {inquiryType === 'general' && (
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
                    >
                      Subject <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Tag className="w-4 h-4" />
                      </div>
                      <input
                        id="contact-subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => {
                          setFormData({ ...formData, subject: e.target.value });
                          if (errors.subject) setErrors({ ...errors, subject: '' });
                        }}
                        placeholder="e.g. Question about Digital Twin Career Roadmap"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                          errors.subject
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                        } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                      />
                    </div>
                    {errors.subject && (
                      <p className="mt-1 text-xs text-rose-400 font-medium">{errors.subject}</p>
                    )}
                  </div>
                )}

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
                  >
                    {inquiryType === 'campus' ? 'Department Objectives & Requirements' : 'Message'} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: '' });
                      }}
                      placeholder={inquiryType === 'campus' ? 'Describe your department cohorts, placement objectives, and curriculum mapping timeline...' : 'Describe your inquiry or feedback...'}
                      className={`w-full p-3.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                        errors.message
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                      } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-y`}
                    />
                  </div>
                  {errors.message && (
                    <p className="mt-1 text-xs text-rose-400 font-medium">{errors.message}</p>
                  )}
                </div>

                <Button
                  id="contact-submit-btn"
                  type="submit"
                  variant={inquiryType === 'campus' ? 'secondary' : 'primary'}
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                  className="w-full"
                >
                  {inquiryType === 'campus' ? 'Submit Campus Partnership Inquiry' : 'Send Inquiry'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};
