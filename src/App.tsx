import { Routes, Route } from 'react-router-dom'
import { useAuth }    from './hooks/useAuth'
import AppShell       from './components/layout/AppShell'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute     from './routes/AdminRoute'
import TermsRoute     from './routes/TermsRoute'
import Spinner        from './components/ui/Spinner'
import HomePage       from './pages/HomePage'
import ArticlePage    from './pages/ArticlePage'
import WritePage      from './pages/WritePage'
import ProfilePage    from './pages/ProfilePage'
import BookmarksPage  from './pages/BookmarksPage'
import LibraryPage    from './pages/LibraryPage'
import StatsPage      from './pages/StatsPage'
import SearchPage     from './pages/SearchPage'
import TagPage        from './pages/TagPage'
import AdminPage      from './pages/AdminPage'
import NotificationsPage from './pages/NotificationsPage'
import LoginPage      from './pages/LoginPage'
import TermsPage      from './pages/TermsPage'
import MembershipPage from './pages/MembershipPage'
import InfoPage       from './pages/InfoPage'
import NotFoundPage   from './pages/NotFoundPage'

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
      <Route element={<ProtectedRoute />}>
        <Route path='/terms' element={<TermsPage />} />
      </Route>
      {/* OAuth callback — render blank spinner while AuthContext exchanges the code */}
      <Route path='/auth/google/callback' element={
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-0)', display: 'grid', placeItems: 'center' }}>
          <Spinner size='lg' />
        </div>
      } />

      <Route element={<AppShell />}>
        <Route index                 element={<HomePage />}    />
        <Route path='/article/:slug' element={<ArticlePage />} />
        <Route path='/search'        element={<SearchPage />}  />
        <Route path='/tag/:slug'     element={<TagPage />}     />
        <Route path='/profile/:id'   element={<ProfilePage />} />
        <Route path='/membership'    element={<MembershipPage />} />
        <Route path='/info/:slug'    element={<InfoPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<TermsRoute />}>
            <Route path='/write'      element={<WritePage />}     />
            <Route path='/write/:id'  element={<WritePage />}     />
            <Route path='/bookmarks'  element={<BookmarksPage />} />
            <Route path='/library'    element={<LibraryPage />}   />
            <Route path='/notifications' element={<NotificationsPage />} />
            <Route path='/stats'      element={<StatsPage />}     />
            <Route path='/profile'    element={<ProfilePage />}   />
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
