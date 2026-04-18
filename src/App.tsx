import { Routes, Route } from 'react-router-dom'
import { useAuth }    from './hooks/useAuth'
import AppShell       from './components/layout/AppShell'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute     from './routes/AdminRoute'
import TermsRoute     from './routes/TermsRoute'
import Spinner        from './components/ui/Spinner'
import HomePage       from './pages/HomePage'
import ArticlePage    from './pages/ArticlePage'
import ExplorePage    from './pages/ExplorePage'
import WritePage      from './pages/WritePage'
import ProfilePage    from './pages/ProfilePage'
import BookmarksPage  from './pages/BookmarksPage'
import LibraryPage    from './pages/LibraryPage'
import WorkflowPage   from './pages/WorkflowPage'
import StatsPage      from './pages/StatsPage'
import SearchPage     from './pages/SearchPage'
import TagPage        from './pages/TagPage'
import AdminPage      from './pages/AdminPage'
import NotificationsPage from './pages/NotificationsPage'
import ReadingHistoryPage from './pages/ReadingHistoryPage'
import ReadingListsPage from './pages/ReadingListsPage'
import NewsletterPage from './pages/NewsletterPage'
import CoursesPage from './pages/CoursesPage'
import CoursePage from './pages/CoursePage'
import CourseBuilderPage from './pages/CourseBuilderPage'
import CommunityPage from './pages/CommunityPage'
import SpacePage from './pages/SpacePage'
import MarketplacePage from './pages/MarketplacePage'
import MarketplaceItemPage from './pages/MarketplaceItemPage'
import PodcastsPage from './pages/PodcastsPage'
import PodcastBuilderPage from './pages/PodcastBuilderPage'
import PublicationsPage from './pages/PublicationsPage'
import MarketingPage from './pages/MarketingPage'
import LeadsPage from './pages/LeadsPage'
import LoginPage      from './pages/LoginPage'
import TermsPage      from './pages/TermsPage'
import MembershipPage from './pages/MembershipPage'
import EarningsPage from './pages/EarningsPage'
import OrgPage from './pages/OrgPage'
import OrgSettingsPage from './pages/OrgSettingsPage'
import InfoPage       from './pages/InfoPage'
import OnboardingPreferencesPage from './pages/OnboardingPreferencesPage'
import WriterOnboardingPage from './pages/WriterOnboardingPage'
import NotFoundPage   from './pages/NotFoundPage'
import SeriesPage     from './pages/SeriesPage'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      // Use inline style — CSS var works even before Tailwind loads
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--surface-0)',
        display: 'grid',
        placeItems: 'center',
      }}>
        <Spinner size='lg' />
      </div>
    )
  }

  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/terms' element={<TermsPage />} />
      {/* OAuth callback — render blank spinner while AuthContext exchanges the code */}
      <Route path='/auth/google/callback' element={
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-0)', display: 'grid', placeItems: 'center' }}>
          <Spinner size='lg' />
        </div>
      } />
      <Route element={<ProtectedRoute />}>
        <Route path='/onboarding/preferences' element={<OnboardingPreferencesPage />} />
        <Route path='/onboarding/writer' element={<WriterOnboardingPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route index                 element={<HomePage />}    />
        <Route path='/article/:slug' element={<ArticlePage />} />
        <Route path='/explore'       element={<ExplorePage />} />
        <Route path='/search'        element={<SearchPage />}  />
        <Route path='/tag/:slug'     element={<TagPage />}     />
        <Route path='/profile/:id'   element={<ProfilePage />} />
        <Route path='/settings/:id'  element={<ProfilePage />} />
        <Route path='/series/:id'    element={<SeriesPage />}  />
        <Route path='/membership'    element={<MembershipPage />} />
        <Route path='/info/:slug'    element={<InfoPage />} />
        <Route path='/courses'       element={<CoursesPage />} />
        <Route path='/courses/:id'   element={<CoursePage />} />
        <Route path='/marketplace'   element={<MarketplacePage />} />
        <Route path='/marketplace/:id' element={<MarketplaceItemPage />} />
        <Route path='/podcasts' element={<PodcastsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path='/community' element={<CommunityPage />} />
          <Route path='/community/:id' element={<SpacePage />} />
          <Route path='/publications' element={<PublicationsPage />} />
          <Route element={<TermsRoute />}>
            <Route path='/write'      element={<WritePage />}     />
            <Route path='/write/:id'  element={<WritePage />}     />
            <Route path='/bookmarks'  element={<BookmarksPage />} />
            <Route path='/library'    element={<LibraryPage />}   />
            <Route path='/workflow'   element={<WorkflowPage />}  />
            <Route path='/notifications' element={<NotificationsPage />} />
            <Route path='/history'    element={<ReadingHistoryPage />} />
            <Route path='/reading-lists' element={<ReadingListsPage />} />
            <Route path='/newsletters' element={<NewsletterPage />} />
            <Route path='/courses/new' element={<CourseBuilderPage />} />
            <Route path='/courses/:id/edit' element={<CourseBuilderPage />} />
            <Route path='/stats'      element={<StatsPage />}     />
            <Route path='/earnings'   element={<EarningsPage />}  />
            <Route path='/org/:id'    element={<OrgPage />}       />
            <Route path='/org/:id/settings' element={<OrgSettingsPage />} />
            <Route path='/podcasts/manage' element={<PodcastBuilderPage />} />
            <Route path='/marketing' element={<MarketingPage />} />
            <Route path='/leads' element={<LeadsPage />} />
            <Route path='/profile'    element={<ProfilePage />}   />
            <Route path='/settings'   element={<ProfilePage />}   />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path='/admin'      element={<AdminPage />} />
          </Route>
        </Route>

        <Route path='*' element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
