import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import type { User } from '../types'
import Avatar      from '../components/ui/Avatar'
import Badge       from '../components/ui/Badge'
import Spinner     from '../components/ui/Spinner'
import FollowButton from '../components/social/FollowButton'

export default function ProfilePage() {
  const { id }   = useParams()
  const { user } = useAuth()
  // If no id in route, show own profile
  const userId = id || user?.id

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn:  () =>
      api.get<{ user: User }>(`/api/users/${userId === user?.id ? 'me' : userId}`)
         .then(r => r.data.user),
    enabled: !!userId,
  })

  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!profile)  return <p className='text-gray-400'>User not found</p>

  const isOwnProfile = profile.id === user?.id

  return (
    <div className='max-w-2xl mx-auto space-y-8'>
      <div className='flex items-start gap-6 p-6 rounded-2xl bg-gray-900 border border-gray-800'>
        <Avatar name={profile.name} src={profile.avatar_url} size='lg' />
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='text-xl font-bold text-white'>{profile.name}</h1>
            <Badge variant={profile.role === 'AUTHOR' ? 'info' : profile.role === 'SUPERADMIN' ? 'warning' : 'default'}>
              {profile.role}
            </Badge>
          </div>
          {profile.email && (
            <p className='text-sm text-gray-500 mt-1'>{profile.email}</p>
          )}
          <p className='text-xs text-gray-600 mt-1'>
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
          {!isOwnProfile && (
            <div className='mt-3'>
              <FollowButton authorId={profile.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
