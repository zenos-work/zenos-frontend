import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useCompleteEnrollment, useCompleteLesson, useCourse, useCourseEnrollments, useCourseModules, useCourseProgress, useEnrollCourse, useModuleLessons } from '../hooks/useCourses'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useUiStore } from '../stores/uiStore'

export default function CoursePage() {
  const { id = '' } = useParams()
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('courses')
  const course = useCourse(id, enabled)
  const modules = useCourseModules(id, enabled)
  const enrollments = useCourseEnrollments(id, enabled)
  const enroll = useEnrollCourse(id)

  const enrollmentId = enrollments.data?.enrollments?.[0]?.id ?? ''
  const progress = useCourseProgress(id, enrollmentId, enabled && !!enrollmentId)
  const completeLesson = useCompleteLesson(id, enrollmentId)
  const completeEnrollment = useCompleteEnrollment(id)

  const firstModuleId = modules.data?.modules?.[0]?.id ?? ''
  const lessons = useModuleLessons(id, firstModuleId, enabled && !!firstModuleId)

  const progressMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of progress.data?.progress ?? []) {
      map.set(item.lesson_id, item.progress_pct)
    }
    return map
  }, [progress.data?.progress])

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Course player' description='Learner progression and quizzes are gated by the courses feature flag.' />
  }

  if (course.isLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!course.data) return <FeatureComingSoon name='Course unavailable' description='The selected course is not available.' />

  return (
    <div className='space-y-6'>
      <header className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
        <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>{course.data.title}</h1>
        <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>{course.data.description ?? 'No course description provided yet.'}</p>
        <div className='mt-4 flex flex-wrap items-center gap-3'>
          <button
            type='button'
            className='rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white'
            onClick={() => {
              void enroll
                .mutateAsync({})
                .then(() => toast('Enrollment started', 'success'))
                .catch(() => toast('Could not enroll', 'error'))
            }}
          >
            Enroll
          </button>
          {enrollmentId ? (
            <button
              type='button'
              className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold'
              onClick={() => {
                void completeEnrollment
                  .mutateAsync(enrollmentId)
                  .then(() => toast('Enrollment completed', 'success'))
                  .catch(() => toast('Could not complete enrollment', 'error'))
              }}
            >
              Mark course complete
            </button>
          ) : null}
        </div>
      </header>

      <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Lessons</h2>
        <div className='mt-4 space-y-2'>
          {(lessons.data?.lessons ?? []).map((lesson) => (
            <div key={lesson.id} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
              <div>
                <p className='text-sm font-medium text-[color:var(--text-primary)]'>{lesson.title}</p>
                <p className='text-xs text-[color:var(--text-secondary)]'>Progress: {progressMap.get(lesson.id) ?? 0}%</p>
              </div>
              {enrollmentId ? (
                <button
                  type='button'
                  className='text-xs font-semibold text-[color:var(--accent)] hover:underline'
                  onClick={() => {
                    void completeLesson
                      .mutateAsync(lesson.id)
                      .then(() => toast('Lesson marked complete', 'success'))
                      .catch(() => toast('Could not complete lesson', 'error'))
                  }}
                >
                  Complete
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
