import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'RATING';
  options: string[] | null;
  is_required: boolean;
};

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  author_id: string;
  questions?: SurveyQuestion[];
};

export function useSurvey(surveyId: string) {
  return useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const res = await api.get<{questions: SurveyQuestion[]} & Survey>(`/api/surveys/${surveyId}`);
      return res.data;
    },
    enabled: !!surveyId,
  });
}

export function useMySurveys() {
  return useQuery({
    queryKey: ['my-surveys'],
    queryFn: async () => {
      const res = await api.get<Survey[]>('/api/surveys');
      return res.data ?? [];
    },
  });
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string, description?: string, questions: Partial<SurveyQuestion>[] }) => {
      const res = await api.post<Survey>('/api/surveys', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-surveys'] });
    }
  });
}

export function useSubmitSurveyResponse() {
  return useMutation({
    mutationFn: async ({ surveyId, answers, sessionId }: { surveyId: string, answers: any[], sessionId?: string }) => {
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['X-Session-ID'] = sessionId;
      }
      const res = await api.post(`/api/surveys/${surveyId}/responses`, { answers }, { headers });
      return res.data;
    }
  });
}
