import { useState } from 'react';
import { useSurvey, useSubmitSurveyResponse } from '../../../hooks/useSurveys';
import Spinner from '../Spinner';

interface SurveyBlockProps {
  surveyId: string;
}

type SurveyAnswer = {
  question_id: string;
  answer_option_index?: number;
  answer_text?: string;
};

export default function SurveyBlock({ surveyId }: SurveyBlockProps) {
  const { data: survey, isLoading, error } = useSurvey(surveyId);
  const submitMutation = useSubmitSurveyResponse();
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) return <div className="p-4 flex justify-center"><Spinner /></div>;
  if (error || !survey) return <div className="p-4 text-red-500 border border-red-200 rounded-md bg-red-50">Unable to load survey.</div>;
  if (submitted) return <div className="p-6 bg-[color:var(--surface-1)] border border-[color:var(--border)] rounded-xl text-center text-[color:var(--text-primary)] font-medium">Thank you for your feedback!</div>

  const handleOptionChange = (qId: string, index: number) => {
    setAnswers(prev => ({ ...prev, [qId]: { question_id: qId, answer_option_index: index } }));
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { question_id: qId, answer_text: text } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadAnswers = Object.values(answers);

    // Simple validation
    for (const q of survey.questions || []) {
      if (q.is_required && !answers[q.id]) {
        alert("Please answer all required questions.");
        return;
      }
    }

    try {
      // For anonymous context, you can generate or grab a session ID from cookies/localStorage
      let sessionId = localStorage.getItem('zenos_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2);
        localStorage.setItem('zenos_session_id', sessionId);
      }

      await submitMutation.mutateAsync({ surveyId, answers: payloadAnswers, sessionId });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit survey. Please try again later.");
    }
  };

  return (
    <div className="my-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] overflow-hidden shadow-sm">
      <div className="bg-[color:var(--surface-1)] p-5 border-b border-[color:var(--border)]">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[color:var(--text-primary)]">{survey.title}</h3>
        {survey.description && <p className="text-sm mt-1 text-[color:var(--text-muted)] line-clamp-2">{survey.description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6 bg-[color:var(--surface-0)]">
        {survey.questions?.map((q, idx) => (
          <div key={q.id}>
            <p className="font-semibold text-[color:var(--text-primary)] mb-3 text-[15px]">
              {idx + 1}. {q.question_text} {q.is_required && <span className="text-red-500 ml-1">*</span>}
            </p>

            {q.question_type === 'MULTIPLE_CHOICE' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <label key={optIdx} className="flex flex-row items-center cursor-pointer group text-[color:var(--text-primary)]">
                    <input
                      type="radio"
                      name={`survey_q_${q.id}`}
                      className="mr-3 w-4 h-4 text-[color:var(--accent)] border-[color:var(--border)] focus:ring-[color:var(--accent)] cursor-pointer"
                      onChange={() => handleOptionChange(q.id, optIdx)}
                      checked={answers[q.id]?.answer_option_index === optIdx}
                      required={q.is_required}
                    />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.question_type === 'SHORT_ANSWER' && (
              <input
                type="text"
                placeholder="Type your answer here..."
                required={q.is_required}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                className="w-full p-3 text-sm border-b border-[color:var(--border)] bg-transparent focus:outline-none focus:border-[color:var(--accent)] text-[color:var(--text-primary)] transition-colors"
                value={answers[q.id]?.answer_text || ''}
              />
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[color:var(--surface-ink)] text-[color:var(--surface-ink-foreground)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}
