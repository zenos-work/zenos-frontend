import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className='flex flex-col items-center justify-center py-24 space-y-4 text-center'>
      <p className='text-6xl font-black text-gray-800'>404</p>
      <h1 className='text-xl font-bold text-white'>Page not found</h1>
      <p className='text-gray-500 text-sm'>The page you're looking for doesn't exist.</p>
      <Link to='/' className='mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm transition-colors'>
        ← Back to home
      </Link>
    </div>
  )
}
