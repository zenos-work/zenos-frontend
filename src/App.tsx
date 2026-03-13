import { useAuth } from './hooks/useAuth'
import LoginButton from './components/LoginButton'

export default function App() {
  const { user, logout, loading } = useAuth()

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center',
                  alignItems:'center', height:'100vh',
                  background:'#080C14', color:'#fff' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column',
                  justifyContent:'center', alignItems:'center',
                  height:'100vh', background:'#080C14', gap:'20px' }}>
      {user ? (
        <>
          <p style={{ color:'#00D4AA', fontSize:'18px' }}>
            Welcome, {user.name}!
          </p>
          <p style={{ color:'#5A7A99' }}>Role: {user.role}</p>
          <button onClick={logout}
            style={{ padding:'10px 24px', background:'#1A2535',
                     color:'#fff', border:'1px solid #2A3545',
                     borderRadius:'8px', cursor:'pointer' }}>
            Logout
          </button>
        </>
      ) : (
        <>
          <h1 style={{ color:'#fff', fontSize:'32px',
                       fontWeight:800, marginBottom:'8px' }}>
            zenos.work
          </h1>
          <p style={{ color:'#5A7A99', marginBottom:'24px' }}>
            Sign in to continue
          </p>
          <LoginButton />
        </>
      )}
    </div>
  )
}
