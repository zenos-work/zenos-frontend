import { Link } from 'react-router-dom'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useCourses } from '../hooks/useCourses'

export default function CoursesPage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('courses')
  const courses = useCourses(enabled)

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Courses' description='Course catalog and learner workflows are gated by the courses feature flag.' />
  }

  return (
    <div className='space-y-6'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Courses</h1>
          <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Browse available courses and continue learning tracks.</p>
        </div>
        <Link to='/courses/new' className='rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white'>
          Build course
        </Link>
      </header>

      {courses.isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {(courses.data?.courses ?? []).map((course) => (
            <article key={course.id} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>{course.title}</h2>
              <p className='mt-2 text-sm text-[color:var(--text-secondary)] line-clamp-3'>{course.description ?? 'No description yet.'}</p>
              <div className='mt-3 flex items-center justify-between'>
                <span className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>{course.level ?? 'beginner'}</span>
                <Link to={`/courses/${course.id}`} className='text-sm font-semibold text-[color:var(--accent)] hover:underline'>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
