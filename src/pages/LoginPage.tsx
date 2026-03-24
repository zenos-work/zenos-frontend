import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleGoogleLogin = (intent: 'signin' | 'signup') => {
    const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from
    const nextPath = from?.pathname ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/'

    if (nextPath !== '/') {
      sessionStorage.setItem('post_login_redirect', nextPath)
    } else {
      sessionStorage.removeItem('post_login_redirect')
    }

    sessionStorage.setItem('auth_intent', intent)

    loginWithGoogle()
  }

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--surface-0)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(166,124,60,0.07) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 1,
            marginBottom: 12,
            lineHeight: 1,
          }}>
            <span style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 52,
              letterSpacing: '-0.06em',
              color: 'var(--text-primary)',
            }}>Z</span>
            <span style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
            }}>enos</span>
            <span style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: '-0.02em',
              color: 'var(--accent)',
            }}>.work</span>
          </div>
          <p style={{
            fontSize: 14, color: 'var(--text-muted)',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            The enterprise writing platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '32px',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{
              fontSize: 20, fontWeight: 700, marginBottom: 6,
              color: 'var(--text-primary)',
              fontFamily: "'Syne', system-ui, sans-serif",
            }}>
              Sign in or sign up
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Use your Google account to continue
            </p>
          </div>

          {/* Sign in button */}
          <button
            onClick={() => handleGoogleLogin('signin')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: '12px 20px', borderRadius: 12,
              backgroundColor: '#ffffff', color: '#1a1a1a',
              border: '1px solid rgba(0,0,0,0.12)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: 'background-color 0.15s, box-shadow 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <svg width='18' height='18' viewBox='0 0 18 18' fill='none'>
              <path d='M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z' fill='#4285F4'/>
              <path d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z' fill='#34A853'/>
              <path d='M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z' fill='#FBBC05'/>
              <path d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z' fill='#EA4335'/>
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={() => handleGoogleLogin('signup')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: '12px 20px', borderRadius: 12,
              backgroundColor: 'var(--surface-0)', color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 10,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-strong)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Sign up with Google
          </button>

          <p style={{
            textAlign: 'center', fontSize: 12, marginTop: 20,
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            By continuing you agree to our{' '}
            <a
              href='/terms'
              target='_blank'
              rel='noreferrer'
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            >
              Terms of Service
            </a>
            . Sign-in automatically records acceptance.
          </p>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 12, marginTop: 24,
          color: 'var(--text-muted)',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          letterSpacing: '0.05em',
        }}>
          WRITE · REVIEW · PUBLISH
        </p>
      </div>
    </div>
  )
}
