import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Grid, Filter } from 'lucide-react'
import ArticleCard from '../components/article/ArticleCard'
import Spinner from '../components/ui/Spinner'
import { useArticles } from '../hooks/useArticles'
import { useTags } from '../hooks/useTags'
import type { Tag } from '../types'

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTag = searchParams.get('tag') || ''
  const selectedContentType = searchParams.get('type') || ''
  const [showFilters, setShowFilters] = useState(false)

  const { data: articles, isLoading: loadingArticles } = useArticles({
    tag: selectedTag || undefined,
    content_type: selectedContentType || undefined,
    page: 1,
  })

  const { data: allTags, isLoading: loadingTags } = useTags()

  const contentTypes = ['HowTo', 'TechArticle', 'BlogPosting', 'NewsArticle']

  const handleTagFilter = (tag: string) => {
    if (selectedTag === tag) {
      setSearchParams({})
    } else {
      setSearchParams({ tag, type: selectedContentType })
    }
  }

  const handleContentTypeFilter = (type: string) => {
    if (selectedContentType === type) {
      setSearchParams({ tag: selectedTag })
    } else {
      setSearchParams({ tag: selectedTag, type })
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-4 py-8 dark:border-gray-700 dark:bg-gray-800'>
        <div className='mx-auto max-w-7xl'>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-gray-50'>Explore</h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            Discover articles from our community of writers
          </p>
        </div>
      </div>

      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='lg:grid lg:grid-cols-4 lg:gap-8'>
          {/* Sidebar Filters - Desktop */}
          <aside className='hidden space-y-6 lg:block'>
            <div>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50'>Topics</h3>
              <div className='space-y-2'>
                {loadingTags ? (
                  <Spinner />
                ) : (
                  allTags?.map((tag: Tag) => (
                    <button
                      key={tag.slug}
                      onClick={() => handleTagFilter(tag.slug)}
                      className={`block w-full rounded px-3 py-2 text-left text-sm font-medium transition ${
                        selectedTag === tag.slug
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50'>Content Type</h3>
              <div className='space-y-2'>
                {contentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleContentTypeFilter(type)}
                    className={`block w-full rounded px-3 py-2 text-left text-sm font-medium transition ${
                      selectedContentType === type
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className='lg:col-span-3'>
            {/* Mobile Filter Toggle */}
            <div className='mb-6 flex items-center gap-2 lg:hidden'>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              >
                <Filter size={18} />
                Filters
              </button>
              {selectedTag && (
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Topic: <span className='font-medium'>{selectedTag}</span>
                </span>
              )}
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className='mb-6 space-y-4 rounded-lg bg-white p-4 dark:bg-gray-800 lg:hidden'>
                <div>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-gray-50'>Topics</h3>
                  <div className='flex flex-wrap gap-2'>
                    {allTags?.map((tag: Tag) => (
                      <button
                        key={tag.slug}
                        onClick={() => {
                          handleTagFilter(tag.slug)
                          setShowFilters(false)
                        }}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                          selectedTag === tag.slug
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {loadingArticles ? (
              <div className='flex justify-center py-12'>
                <Spinner />
              </div>
            ) : articles?.items?.length ? (
              <div className='grid gap-6 md:grid-cols-2'>
                {articles.items.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-lg bg-white py-12 dark:bg-gray-800'>
                <Grid size={48} className='mb-4 text-gray-400' />
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-50'>No articles found</h3>
                <p className='mt-2 text-gray-600 dark:text-gray-400'>
                  Try adjusting your filters or explore other topics
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
