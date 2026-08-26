import { useEffect, useState } from 'react'
import { AppRouter } from './routes/AppRouter'
import './App.css'
import { authApi } from './api/auth'
import { setUserId } from './store/session.store'

function App() {
  const [location, setLocation] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => setLocation(window.location.pathname)
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  // On app mount, attempt to validate session using cookies. This
  // allows the SPA to recognize the user after OAuth redirects that
  // set httpOnly cookies on the gateway.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await authApi.validar()
        if (mounted && res.exito && res.sesion?.id_sesion && res.usuario?.id_usuario) {
          setUserId(res.usuario.id_usuario)
        }
      } catch (err) {
        // ignore; user is not authenticated
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return <AppRouter path={location} />
}

export default App
