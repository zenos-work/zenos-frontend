import { useEffect, useState } from 'react'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrolled = window.scrollY

      if (documentHeight > 0) {
        const percentage = (scrolled / documentHeight) * 100
        setProgress(Math.min(percentage, 100))
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className='reading-progress fixed left-0 right-0 top-0 z-40 h-1 bg-gradient-to-r from-blue-400 to-blue-600'
      data-testid='reading-progress'
      role='progressbar'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className='h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300'
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
