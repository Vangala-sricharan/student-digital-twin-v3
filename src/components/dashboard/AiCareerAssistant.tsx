import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  HelpCircle,
  Briefcase,
  AlertCircle,
  AlertTriangle,
  FileText,
  Code2,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { AssistantMessage } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface AiCareerAssistantProps {
  isDemo?: boolean;
}

const DEFAULT_PROMPTS = [
  'What technical skills should I prioritize next for my target role?',
  'How can I improve my project architectures to stand out to recruiters?',
  'What are the key gaps in my profile for summer internships?',
  'How should I prepare for technical interviews based on my skills?',
  'What should be my 30-day focus roadmap?',
];

export const AiCareerAssistant: React.FC<AiCareerAssistantProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile, skills = [], projects = [], achievements = [], careerGoals = [] } = useStudentTwin();

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const studentName = activeStudentProfile?.name || 'Student';
    const defaultWelcome: AssistantMessage = {
      id: 'welcome',
      sender: 'assistant',
      content: `Hello **${studentName}**! I am your AI Career Intelligence Assistant.

I am grounded directly in your active Student Digital Twin:
- **Target Role:** ${activeStudentProfile?.targetRole || activeStudentProfile?.careerGoal || 'Software Engineer'}
- **Verified Skills:** ${skills.length} skills recorded
- **Portfolio Projects:** ${projects.length} projects recorded
- **Achievements & Certs:** ${achievements.length} recorded

Ask me anything about skill roadmaps, project improvements, resume alignment, interview preparation, or career strategies.`,
      timestamp: new Date().toISOString(),
      suggestedPrompts: DEFAULT_PROMPTS.slice(0, 3),
    };
    return [defaultWelcome];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTransientError, setIsTransientError] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage || '').trim();
    if (!query || isLoading) return;

    setErrorMessage(null);
    setIsTransientError(false);
    setInputMessage('');
    setLastQuery(query);

    const userMsg: AssistantMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const assistantTempId = `ast_${Date.now() + 1}`;
    const assistantPlaceholder: AssistantMessage = {
      id: assistantTempId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      suggestedPrompts: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsLoading(true);

    const res = await aiService.askCareerAssistantStream(
      {
        message: query,
        activeProfile: activeStudentProfile,
        skills: Array.isArray(skills) ? skills : [],
        projects: Array.isArray(projects) ? projects : [],
        achievements: Array.isArray(achievements) ? achievements : [],
        careerGoals: Array.isArray(careerGoals) ? careerGoals : [],
        history: messages.slice(-6),
      },
      (accumulatedText) => {
        let cleanDisplay = accumulatedText;
        if (cleanDisplay.includes('SUGGESTED NEXT QUESTIONS:')) {
          cleanDisplay = cleanDisplay.split('SUGGESTED NEXT QUESTIONS:')[0].trim();
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTempId
              ? { ...m, content: cleanDisplay, isStreaming: true }
              : m
          )
        );
      }
    );

    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
      setIsTransientError(Boolean(res.isTransient));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantTempId
            ? {
                ...m,
                content: `⚠️ **Evaluation Notice:** ${res.error}`,
                isStreaming: false,
                suggestedPrompts: [],
              }
            : m
        )
      );
    } else {
      const assistantContent =
        typeof res.content === 'string' && res.content.trim().length > 0
          ? res.content
          : 'I evaluated your profile context, but no detailed response was generated. Please try asking a more specific question.';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantTempId
            ? {
                ...m,
                content: assistantContent,
                suggestedPrompts: Array.isArray(res.suggestedPrompts) ? res.suggestedPrompts : [],
                isStreaming: false,
              }
            : m
        )
      );
      setErrorMessage(null);
      setIsTransientError(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setErrorMessage(null);
    setIsTransientError(false);
    setLastQuery(null);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        content: `Chat history cleared. I'm ready with your active Digital Twin context for **${activeStudentProfile?.name || 'Student'}**. What would you like to explore?`,
        timestamp: new Date().toISOString(),
        suggestedPrompts: DEFAULT_PROMPTS.slice(0, 3),
      },
    ]);
  };

  const renderMessageContent = (rawContent: any, isStreaming?: boolean) => {
    const content = typeof rawContent === 'string' ? rawContent : String(rawContent || '');
    if (!content.trim()) {
      if (isStreaming) {
        return (
          <div className="flex items-center gap-2 text-slate-400 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span className="text-xs">Analyzing your digital twin context...</span>
          </div>
        );
      }
      return <p className="italic text-slate-400">No message content available.</p>;
    }

    const paragraphs = content.split('\n\n').filter(Boolean);

    return (
      <>
        {paragraphs.map((paragraph, pIdx) => {
          const trimmedPara = paragraph.trim();
          // Formatting bullet points
          if (trimmedPara.startsWith('- ') || trimmedPara.startsWith('* ')) {
            const items = trimmedPara.split('\n').filter(Boolean);
            return (
              <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1.5">
                {items.map((it, i) => {
                  const cleanText = it.replace(/^[-*]\s+/, '').trim();
                  return <li key={i}>{cleanText}</li>;
                })}
              </ul>
            );
          }

          return <p key={pIdx}>{trimmedPara}</p>;
        })}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-blue-400 animate-pulse ml-1 align-middle rounded-xs" />
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  AI Career Assistant
                </h1>
                <Badge variant={isDemo ? 'amber' : 'blue'} size="sm">
                  {isDemo ? 'DEMO SHOWCASE' : 'ACTIVE DIGITAL TWIN GROUNDED'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Evidence-based intelligence calibrated to {activeStudentProfile?.name || 'your profile'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear Conversation
            </Button>
          </div>
        </div>

        {/* Active Grounding Evidence Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Target Role</span>
            <span className="font-semibold text-blue-400 truncate block">
              {activeStudentProfile?.targetRole || activeStudentProfile?.careerGoal || 'Not Specified'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Skills In Context</span>
            <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
              {(skills || []).length} Recorded
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Projects In Context</span>
            <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
              {(projects || []).length} Recorded
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Achievements</span>
            <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
              {(achievements || []).length} Verified
            </span>
          </div>
        </div>
      </Card>

      {/* Main Chat Interface */}
      <Card className="p-0 overflow-hidden flex flex-col h-[620px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isErrorMessage = typeof msg.content === 'string' && msg.content.startsWith('⚠️');

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : isErrorMessage
                      ? 'bg-rose-900/50 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-blue-400 dark:text-blue-400 light:text-blue-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : isErrorMessage ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative group rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : isErrorMessage
                      ? 'bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-tl-none'
                      : 'bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {renderMessageContent(msg.content, msg.isStreaming)}
                  </div>

                  {/* Retry option on error messages */}
                  {isErrorMessage && lastQuery && (
                    <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-rose-400/80">Want to retry this request?</span>
                      <button
                        type="button"
                        onClick={() => handleSendMessage(lastQuery)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Retry Query</span>
                      </button>
                    </div>
                  )}

                  {/* Copy Button */}
                  {!isUser && !isErrorMessage && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, typeof msg.content === 'string' ? msg.content : '')}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Suggested follow-up prompts from assistant */}
                  {Array.isArray(msg.suggestedPrompts) && msg.suggestedPrompts.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                        Suggested Follow-ups
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSendMessage(prompt)}
                            disabled={isLoading}
                            className="text-left text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator for non-streaming fallback */}
          {isLoading && !messages.some((m) => m.isStreaming) && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-blue-400">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="rounded-2xl rounded-tl-none p-4 bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Analyzing student twin data and synthesizing guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Global Error Banner if active */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-950/40 border-t border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{isTransientError ? 'Gemini is temporarily unavailable.' : errorMessage}</span>
            </div>
            {lastQuery && (
              <button
                type="button"
                onClick={() => handleSendMessage(lastQuery)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="p-3 sm:p-4 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              id="assistant-input-field"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask anything about your ${activeStudentProfile?.targetRole || 'career'} roadmap, skills, or projects...`}
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 disabled:opacity-60"
            />
            <Button
              id="assistant-send-btn"
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputMessage.trim() || isLoading}
              leftIcon={<Send className="w-4 h-4 shrink-0" />}
              className="h-11 px-5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2"
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
