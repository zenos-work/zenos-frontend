import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SpacePage from '../../src/pages/SpacePage'

const useFeatureFlagMock = vi.fn()
const useCommunitySpaceMock = vi.fn()
const useSpacePostsMock = vi.fn()
const useSpaceMembersMock = vi.fn()
const useJoinSpaceMock = vi.fn()
const useCreatePostMock = vi.fn()
const useLikePostMock = vi.fn()
const usePostRepliesMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useCommunity', () => ({
  useCommunitySpace: (...args: unknown[]) => useCommunitySpaceMock(...args),
  useSpacePosts: (...args: unknown[]) => useSpacePostsMock(...args),
  useSpaceMembers: (...args: unknown[]) => useSpaceMembersMock(...args),
  useJoinSpace: (...args: unknown[]) => useJoinSpaceMock(...args),
  useCreatePost: (...args: unknown[]) => useCreatePostMock(...args),
  useLikePost: (...args: unknown[]) => useLikePostMock(...args),
  usePostReplies: (...args: unknown[]) => usePostRepliesMock(...args),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (s: { toast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ toast: vi.fn() }),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

const mockMutation = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
const mockSpace = {
  isLoading: false,
  data: { id: 'space-1', name: 'Fintech Builders', description: 'Discuss fintech' },
}
const mockPosts = {
  isLoading: false,
  data: {
    posts: [
      { id: 'p-1', title: 'Hello there', body: 'First post', post_type: 'discussion', like_count: 3 },
      { id: 'p-2', title: 'Event', body: 'Join us', post_type: 'event', like_count: 0 },
    ],
  },
}
const mockMembers = { isLoading: false, data: { members: [{ user_id: 'u-1', org_role: 'member' }] } }
const mockReplies = { isLoading: false, data: { replies: [] } }

function renderSpacePage(spaceId = 'space-1') {
  return render(
    <MemoryRouter initialEntries={[`/community/spaces/${spaceId}`]}>
      <Routes>
        <Route path='/community/spaces/:id' element={<SpacePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SpacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useCommunitySpaceMock.mockReturnValue(mockSpace)
    useSpacePostsMock.mockReturnValue(mockPosts)
    useSpaceMembersMock.mockReturnValue(mockMembers)
    useJoinSpaceMock.mockReturnValue(mockMutation)
    useCreatePostMock.mockReturnValue(mockMutation)
    useLikePostMock.mockReturnValue(mockMutation)
    usePostRepliesMock.mockReturnValue(mockReplies)
  })

  it('renders coming soon when feature flag disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })
    renderSpacePage()
    expect(screen.getByText(/space view is coming soon/i)).toBeInTheDocument()
  })

  it('renders space name and description', () => {
    renderSpacePage()
    expect(screen.getByText('Fintech Builders')).toBeInTheDocument()
    expect(screen.getByText('Discuss fintech')).toBeInTheDocument()
  })

  it('renders post type badges for posts', () => {
    renderSpacePage()
    expect(screen.getAllByText('Discussion').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Event').length).toBeGreaterThan(0)
  })

  it('renders post titles', () => {
    renderSpacePage()
    expect(screen.getByText('Hello there')).toBeInTheDocument()
    expect(screen.getAllByText('Event').length).toBeGreaterThan(0)
  })

  it('renders create post form with post type selector', () => {
    renderSpacePage()
    expect(screen.getByPlaceholderText('Post title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discussion' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Announcement' })).toBeInTheDocument()
  })

  it('shows reply toggle when Reply button clicked', () => {
    usePostRepliesMock.mockReturnValue({ isLoading: false, data: { replies: [] } })
    renderSpacePage()

    const replyButtons = screen.getAllByRole('button', { name: /reply/i })
    fireEvent.click(replyButtons[0])
    expect(screen.getByPlaceholderText(/write a reply/i)).toBeInTheDocument()
  })

  it('shows empty replies message when no replies', () => {
    renderSpacePage()
    const replyButtons = screen.getAllByRole('button', { name: /reply/i })
    fireEvent.click(replyButtons[0])
    expect(screen.getByText(/no replies yet/i)).toBeInTheDocument()
  })

  it('renders member list', () => {
    renderSpacePage()
    expect(screen.getByText(/u-1/)).toBeInTheDocument()
    expect(screen.getByText(/member/)).toBeInTheDocument()
  })

  it('renders loading spinner when space is loading', () => {
    useCommunitySpaceMock.mockReturnValue({ isLoading: true, data: null })
    renderSpacePage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders unavailable when space is null', () => {
    useCommunitySpaceMock.mockReturnValue({ isLoading: false, data: null })
    renderSpacePage()
    expect(screen.getByText(/space unavailable is coming soon/i)).toBeInTheDocument()
  })
})
