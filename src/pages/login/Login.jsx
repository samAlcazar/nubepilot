import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { authenticateUser, getStoredSession, setStoredSession } from '../../utils/auth'

const Login = () => {
  const navigate = useNavigate()
  const session = getStoredSession()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  if (session) {
    return <Navigate to='/' replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData(current => ({
      ...current,
      [name]: value
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const user = authenticateUser(formData)

    if (!user) {
      setError('Credenciales inv\u00e1lidas. Revisa el email y la contrase\u00f1a.')
      return
    }

    setStoredSession(user)
    navigate('/', { replace: true })
  }

  return (
    <main className='min-h-screen overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#172554_40%,#dbeafe_100%)] px-6 py-8 text-slate-950'>
      <div className='mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <section className='relative hidden overflow-hidden rounded-4xl border border-white/10 bg-slate-950 p-10 text-white shadow-[0_40px_120px_rgba(15,23,42,0.45)] lg:flex lg:flex-col lg:justify-between'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.2),transparent_28%)]' />

          <div className='relative'>
            <p className='inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-100'>
              NubePilot
            </p>
            <h1 className='mt-6 max-w-xl text-5xl font-black leading-none tracking-tight'>
              Commerce intelligence para tomar decisiones más rápido.
            </h1>
            <p className='mt-6 max-w-lg text-base leading-7 text-slate-300'>
              Este acceso usa credenciales locales para avanzar con la demo sin depender de base de datos.
            </p>
          </div>

          <div className='relative grid gap-4 md:grid-cols-2'>
            <article className='rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur'>
              <p className='text-sm uppercase tracking-[0.2em] text-slate-400'>Demo admin</p>
              <p className='mt-3 text-lg font-semibold'>admin@nubepilot.com</p>
              <p className='mt-1 text-sm text-slate-300'>Hackaton2026!</p>
            </article>
            <article className='rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur'>
              <p className='text-sm uppercase tracking-[0.2em] text-slate-400'>Demo analyst</p>
              <p className='mt-3 text-lg font-semibold'>analyst@nubepilot.com</p>
              <p className='mt-1 text-sm text-slate-300'>Demo1234!</p>
            </article>
          </div>
        </section>

        <section className='flex items-center justify-center rounded-4xl border border-white/60 bg-white/85 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.25)] backdrop-blur md:p-10'>
          <div className='w-full max-w-md'>
            <div className='mb-8'>
              <p className='text-sm font-semibold uppercase tracking-[0.25em] text-blue-700'>Acceso</p>
              <h2 className='mt-3 text-4xl font-black tracking-tight text-slate-950'>Inicia sesión</h2>
              <p className='mt-3 text-sm leading-6 text-slate-600'>
                Entra con un usuario local para probar el flujo del dashboard sin backend de autenticación.
              </p>
            </div>

            <form className='space-y-5' onSubmit={handleSubmit}>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>Email</span>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='admin@nubepilot.com'
                  className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white'
                  required
                />
              </label>

              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>Contraseña</span>
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='Ingresa tu contraseña'
                  className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white'
                  required
                />
              </label>

              {error && (
                <div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                  {error}
                </div>
              )}

              <button
                type='submit'
                className='w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700'
              >
                Entrar al dashboard
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
