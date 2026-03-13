import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const Metrics = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [savedMetrics, setSavedMetrics] = useState([])
  const [formData, setFormData] = useState({
    product_id: '',
    views: 100,
    purchases: 10
  })

  const selectedProduct = useMemo(() => {
    return products.find(product => String(product.id) === String(formData.product_id))
  }, [products, formData.product_id])

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    setRequestError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/tiendanube/products`)
      const responseBody = await response.json()

      if (!response.ok) {
        throw new Error(responseBody?.message || 'No se pudieron obtener los productos')
      }

      setProducts(responseBody)

      if (responseBody.length > 0) {
        setFormData(current => ({
          ...current,
          product_id: String(responseBody[0].id)
        }))
      }
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const loadSavedMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/product-metrics`)
      const responseBody = await response.json()

      if (!response.ok) {
        throw new Error(responseBody?.message || 'No se pudieron obtener las métricas guardadas')
      }

      setSavedMetrics(responseBody)
    } catch {
      setSavedMetrics([])
    }
  }

  useEffect(() => {
    loadProducts()
    loadSavedMetrics()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData(current => ({
      ...current,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setRequestError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const payload = {
        product_id: Number(formData.product_id),
        views: Number(formData.views),
        purchases: Number(formData.purchases)
      }

      const response = await fetch(`${API_BASE_URL}/api/analytics/product-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const responseBody = await response.json()

      if (!response.ok) {
        throw new Error(responseBody?.message || 'No se pudo guardar la métrica')
      }

      setSavedMetrics(responseBody)
      setSuccessMessage(`Métrica guardada para producto ${payload.product_id}`)
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='min-h-screen bg-[linear-gradient(140deg,#f8fafc_0%,#e0f2fe_50%,#dbeafe_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-10'>
      <section className='mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6 md:rounded-4xl md:p-10'>
        <header className='mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='mb-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white'>
              Tooling
            </p>
            <h1 className='text-2xl font-black tracking-tight text-slate-950 sm:text-3xl md:text-4xl'>Generador de métricas</h1>
            <p className='mt-3 max-w-2xl text-sm text-slate-600'>
              Esta pantalla está separada del flujo principal y sirve para cargar visitas y compras con IDs reales de productos.
            </p>
          </div>

          <button
            type='button'
            onClick={() => navigate('/')}
            className='inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto'
          >
            Volver al dashboard
          </button>
        </header>

        <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <article className='rounded-3xl border border-slate-200 bg-slate-50 p-6'>
            <h2 className='text-xl font-bold text-slate-950'>Crear métrica manual</h2>

            <form className='mt-5 space-y-4' onSubmit={handleSubmit}>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-slate-700'>Producto</span>
                <select
                  name='product_id'
                  value={formData.product_id}
                  onChange={handleChange}
                  disabled={isLoadingProducts || products.length === 0}
                  className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500'
                  required
                >
                  {products.length === 0 && <option value=''>Sin productos disponibles</option>}
                  {products.map(product => (
                    <option key={product.id} value={String(product.id)}>
                      {product.id} - {product.name?.es || product.name?.en || 'Producto sin nombre'}
                    </option>
                  ))}
                </select>
              </label>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <label className='block'>
                  <span className='mb-2 block text-sm font-semibold text-slate-700'>Visitas</span>
                  <input
                    type='number'
                    name='views'
                    min='0'
                    value={formData.views}
                    onChange={handleChange}
                    className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500'
                    required
                  />
                </label>

                <label className='block'>
                  <span className='mb-2 block text-sm font-semibold text-slate-700'>Compras</span>
                  <input
                    type='number'
                    name='purchases'
                    min='0'
                    value={formData.purchases}
                    onChange={handleChange}
                    className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500'
                    required
                  />
                </label>
              </div>

              {selectedProduct && (
                <p className='rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800'>
                  Producto seleccionado: <strong>{selectedProduct.name?.es || selectedProduct.name?.en || selectedProduct.id}</strong>
                </p>
              )}

              {requestError && (
                <p className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                  {requestError}
                </p>
              )}

              {successMessage && (
                <p className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
                  {successMessage}
                </p>
              )}

              <div className='flex flex-wrap gap-3'>
                <button
                  type='submit'
                  disabled={isSubmitting || isLoadingProducts || products.length === 0}
                  className='w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar métrica'}
                </button>

                <button
                  type='button'
                  onClick={loadProducts}
                  disabled={isLoadingProducts}
                  className='w-full rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
                >
                  {isLoadingProducts ? 'Recargando...' : 'Recargar productos'}
                </button>
              </div>
            </form>
          </article>

          <article className='rounded-3xl border border-slate-200 bg-white p-6'>
            <h2 className='text-xl font-bold text-slate-950'>Métricas guardadas</h2>
            <p className='mt-2 text-sm text-slate-600'>
              Resultado actual del endpoint <code>/api/analytics/product-metrics</code>
            </p>

            <div className='mt-5 max-h-105 overflow-auto rounded-2xl border border-slate-200'>
              <table className='w-full min-w-85 text-left text-sm'>
                <thead className='bg-slate-100 text-slate-700'>
                  <tr>
                    <th className='px-4 py-3 font-semibold'>Product ID</th>
                    <th className='px-4 py-3 font-semibold'>Views</th>
                    <th className='px-4 py-3 font-semibold'>Purchases</th>
                  </tr>
                </thead>
                <tbody>
                  {savedMetrics.length === 0 && (
                    <tr>
                      <td className='px-4 py-4 text-slate-500' colSpan='3'>
                        Sin datos por ahora.
                      </td>
                    </tr>
                  )}

                  {savedMetrics.map(metric => (
                    <tr key={metric.product_id} className='border-t border-slate-100'>
                      <td className='px-4 py-3 font-medium text-slate-900'>{metric.product_id}</td>
                      <td className='px-4 py-3 text-slate-700'>{metric.views}</td>
                      <td className='px-4 py-3 text-slate-700'>{metric.purchases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default Metrics