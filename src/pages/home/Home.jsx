import { useNavigate } from 'react-router'
import { clearStoredSession, getStoredSession } from '../../utils/auth'

const Home = () => {
  const navigate = useNavigate()
  const session = getStoredSession()

  const handleLogout = () => {
    clearStoredSession()
    navigate('/login', { replace: true })
  }

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_45%,#e2e8f0_100%)] px-6 py-10 text-slate-900'>
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-4xl border border-slate-200/80 bg-white/80 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur md:p-10'>
        <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-700'>
              Demo Dashboard
            </p>
            <h1 className='text-4xl font-black tracking-tight text-slate-950'>
              Bienvenido, {session?.name}
            </h1>
            <p className='mt-3 max-w-2xl text-base text-slate-600'>
              La sesión se está resolviendo desde un archivo JSON local para avanzar rápido con el frontend del hackathon.
            </p>
          </div>

          <button
            type='button'
            onClick={handleLogout}
            className='inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100'
          >
            Cerrar sesión
          </button>
        </div>

        <div className='grid gap-4 md:grid-cols-3'>
          <article className='rounded-3xl bg-slate-950 p-6 text-slate-50'>
            <p className='text-sm uppercase tracking-[0.2em] text-slate-400'>Usuario</p>
            <h2 className='mt-4 text-2xl font-bold'>{session?.role}</h2>
            <p className='mt-2 text-sm text-slate-300'>{session?.email}</p>
          </article>

          <article className='rounded-3xl border border-slate-200 bg-slate-50 p-6'>
            <p className='text-sm uppercase tracking-[0.2em] text-slate-500'>Estado</p>
            <h2 className='mt-4 text-2xl font-bold text-slate-950'>Autenticado</h2>
            <p className='mt-2 text-sm text-slate-600'>Ruta protegida habilitada y persistencia local activa.</p>
          </article>

          <article className='rounded-3xl border border-blue-200 bg-blue-50 p-6'>
            <p className='text-sm uppercase tracking-[0.2em] text-blue-700'>Siguiente paso</p>
            <h2 className='mt-4 text-2xl font-bold text-blue-950'>Conectar backend</h2>
            <p className='mt-2 text-sm text-blue-900/75'>Ya puedes usar esta sesi\u00f3n para mostrar analytics, productos y acciones protegidas.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default Home
