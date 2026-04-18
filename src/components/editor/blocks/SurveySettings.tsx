import { useState } from 'react';
import { useMySurveys, useCreateSurvey } from '../../../hooks/useSurveys';
import Spinner from '../../ui/Spinner';
import { X } from 'lucide-react';

interface SurveySettingsProps {
  currentId?: string;
  onSave: (surveyId: string) => void;
  onClose: () => void;
}

export default function SurveySettings({ currentId, onSave, onClose }: SurveySettingsProps) {
  const { data: mySurveys, isLoading } = useMySurveys();
  const createMutation = useCreateSurvey();

  const [mode, setMode] = useState<'SELECT' | 'CREATE'>(currentId ? 'SELECT' : 'CREATE');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const survey = await createMutation.mutateAsync({
        title: newTitle,
        description: newDesc,
        questions: [{
          question_text: "What do you think about this article?",
          question_type: "MULTIPLE_CHOICE",
          options: ["Great", "Good", "Needs improvement"],
          is_required: true
        }]
      });
      onSave(survey.id);
    } catch {
      alert("Failed to create survey.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[color:var(--surface-0)] text-[color:var(--text-primary)]">
      <div className="flex items-center justify-between p-4 border-b border-[color:var(--border)] bg-[color:var(--surface-1)]">
        <h3 className="font-bold text-sm">Survey Block Settings</h3>
        <button onClick={onClose} className="p-1 hover:bg-[color:var(--surface-2)] rounded">
          <X size={16} />
        </button>
      </div>

      <div className="p-2 bg-[color:var(--surface-2)] flex gap-1">
        <button
          onClick={() => setMode('SELECT')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded ${mode === 'SELECT' ? 'bg-[color:var(--surface-0)] shadow-sm' : 'text-[color:var(--text-muted)]'}`}
        >
          My Surveys
        </button>
        <button
          onClick={() => setMode('CREATE')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded ${mode === 'CREATE' ? 'bg-[color:var(--surface-0)] shadow-sm' : 'text-[color:var(--text-muted)]'}`}
        >
          New Survey
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'SELECT' && (
          <div className="space-y-2">
            {isLoading ? <Spinner /> : (mySurveys ?? []).length === 0 ? (
               <p className="text-xs text-center py-10 text-[color:var(--text-muted)]">You haven't created any surveys yet.</p>
            ) : (
              mySurveys?.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSave(s.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    currentId === s.id
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-dim)]'
                    : 'border-[color:var(--border)] hover:border-[color:var(--border-strong)]'
                  }`}
                >
                  <p className="text-sm font-semibold">{s.title}</p>
                  {s.description && <p className="text-[11px] text-[color:var(--text-muted)] line-clamp-1">{s.description}</p>}
                </button>
              ))
            )}
          </div>
        )}

        {mode === 'CREATE' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-1">Survey Title</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Reader Feedback"
                className="w-full bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-1">Description</label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={3}
                placeholder="Brief purpose of the survey..."
                className="w-full bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
              <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium">
                Note: This will create a basic feedback survey with one multiple-choice question. You can edit full survey details in the Survey Dashboard (coming soon).
              </p>
            </div>

            <button
               onClick={handleCreate}
               disabled={createMutation.isPending || !newTitle.trim()}
               className="w-full flex items-center justify-center gap-2 bg-[color:var(--surface-ink)] text-white font-semibold text-sm py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
