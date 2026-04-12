import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useCreateCourse, useCourse, useCreateModule, useCourseModules, useCreateLesson } from '../hooks/useCourses'
import { useMyOrgs } from '../hooks/useOrg'
import { useUiStore } from '../stores/uiStore'

export default function CourseBuilderPage() {
  const { id = '' } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('courses')

  const orgs = useMyOrgs(enabled)
  const orgId = orgs.data?.organizations?.[0]?.id ?? ''
  const createCourse = useCreateCourse()
  const course = useCourse(id, enabled && isEdit)
  const modules = useCourseModules(id, enabled && isEdit)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')

  const selectedCourseId = useMemo(() => (isEdit ? id : ''), [id, isEdit])
  const firstModuleId = modules.data?.modules?.[0]?.id ?? ''
  const createModule = useCreateModule(selectedCourseId)
  const createLesson = useCreateLesson(selectedCourseId, firstModuleId)

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Course builder' description='Course authoring is currently gated behind the courses flag.' />
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>{isEdit ? 'Edit course' : 'Create course'}</h1>
        <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Compose modules, lessons, and learner flow assets.</p>
      </header>

      <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
        <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Course metadata</h2>
        {isEdit && course.isLoading ? (
          <div className='mt-4'><Spinner /></div>
        ) : (
          <div className='mt-3 grid gap-3'>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={course.data?.title ?? 'Course title'} className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm' />
            <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder={course.data?.slug ?? 'course-slug'} className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm' />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={course.data?.description ?? 'Description'} className='min-h-24 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] p-3 text-sm' />
            {!isEdit ? (
              <button
                type='button'
                className='w-fit rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white'
                onClick={() => {
                  if (!orgId || !title.trim() || !slug.trim()) {
                    toast('Provide org, title and slug', 'warning')
                    return
                  }
                  void createCourse
                    .mutateAsync({ org_id: orgId, title: title.trim(), slug: slug.trim(), description: description.trim(), status: 'draft' })
                    .then((created) => {
                      toast('Course created', 'success')
                      navigate(`/courses/${created.id}/edit`)
                    })
                    .catch(() => toast('Could not create course', 'error'))
                }}
              >
                Create draft
              </button>
            ) : null}
          </div>
        )}
      </section>

      {isEdit ? (
        <section className='grid gap-4 lg:grid-cols-2'>
          <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
            <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Modules</h2>
            <div className='mt-3 flex gap-2'>
              <input
                value={moduleTitle}
                onChange={(event) => setModuleTitle(event.target.value)}
                placeholder='Module title'
                className='h-10 flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
              />
              <button
                type='button'
                className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold'
                onClick={() => {
                  if (!moduleTitle.trim() || !selectedCourseId) return
                  void createModule
                    .mutateAsync({ title: moduleTitle.trim() })
                    .then(() => {
                      setModuleTitle('')
                      toast('Module created', 'success')
                    })
                    .catch(() => toast('Could not create module', 'error'))
                }}
              >
                Add module
              </button>
            </div>
            <ul className='mt-3 space-y-2'>
              {(modules.data?.modules ?? []).map((module) => (
                <li key={module.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'>
                  {module.title}
                </li>
              ))}
            </ul>
          </div>

          <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
            <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Lessons</h2>
            <div className='mt-3 flex gap-2'>
              <input
                value={lessonTitle}
                onChange={(event) => setLessonTitle(event.target.value)}
                placeholder='Lesson title'
                className='h-10 flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
              />
              <button
                type='button'
                className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold'
                onClick={() => {
                  if (!lessonTitle.trim() || !selectedCourseId || !firstModuleId) {
                    toast('Create at least one module first', 'warning')
                    return
                  }
                  void createLesson
                    .mutateAsync({ title: lessonTitle.trim() })
                    .then(() => {
                      setLessonTitle('')
                      toast('Lesson created', 'success')
                    })
                    .catch(() => toast('Could not create lesson', 'error'))
                }}
              >
                Add lesson
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
