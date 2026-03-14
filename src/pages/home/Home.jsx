import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { clearStoredSession, getStoredSession } from '../../utils/auth'
import logo from '../../assets/logo.jpeg'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const RECOMMENDED_DISCOUNT_PERCENTAGE = 10

const Home = () => {
  const navigate = useNavigate()
  const session = getStoredSession()
  const [dashboardData, setDashboardData] = useState({
    products: [],
    productMetrics: [],
    productViews: [],
    recommendations: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [applyingDiscountProductId, setApplyingDiscountProductId] = useState(null)
  const [discountActionMessage, setDiscountActionMessage] = useState('')
  const [pendingDiscountProductId, setPendingDiscountProductId] = useState(null)

  const handleLogout = () => {
    clearStoredSession()
    navigate('/login', { replace: true })
  }

  const handleOpenMetrics = () => {
    navigate('/metrics')
  }

  const handleOpenProductDetail = (productId) => {
    navigate(`/products/${productId}`)
  }

  const loadDashboard = async () => {
    const requestStartedAt = Date.now()
    setIsLoading(true)
    setIsRecommendationsLoading(true)
    setRequestError('')

    try {
      const [productsResponse, metricsResponse, viewsResponse, recommendationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tiendanube/products`),
        fetch(`${API_BASE_URL}/api/analytics/product-metrics`),
        fetch(`${API_BASE_URL}/api/analytics/product-views`),
        fetch(`${API_BASE_URL}/api/analytics/discount-recommendations`)
      ])

      const [productsBody, metricsBody, viewsBody, recommendationsBody] = await Promise.all([
        productsResponse.json(),
        metricsResponse.json(),
        viewsResponse.json(),
        recommendationsResponse.json()
      ])

      if (!productsResponse.ok) {
        throw new Error(productsBody?.message || 'No se pudieron cargar los productos')
      }

      if (!metricsResponse.ok) {
        throw new Error(metricsBody?.message || 'No se pudieron cargar las métricas')
      }

      if (!viewsResponse.ok) {
        throw new Error(viewsBody?.message || 'No se pudieron cargar las vistas')
      }

      if (!recommendationsResponse.ok) {
        throw new Error(recommendationsBody?.message || 'No se pudieron cargar las recomendaciones')
      }

      // Load main dashboard data first, then reveal AI recommendations with a small delay.
      setDashboardData({
        products: productsBody,
        productMetrics: metricsBody,
        productViews: viewsBody,
        recommendations: []
      })

      setIsLoading(false)

      const minimumThinkingTimeMs = 2200
      const elapsedMs = Date.now() - requestStartedAt
      const remainingMs = Math.max(minimumThinkingTimeMs - elapsedMs, 0)

      if (remainingMs > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingMs))
      }

      setDashboardData(current => ({
        ...current,
        recommendations: recommendationsBody
      }))

      setIsRecommendationsLoading(false)
    } catch (error) {
      setRequestError(error.message)
      setIsLoading(false)
      setIsRecommendationsLoading(false)
    }
  }

  const handleApplyDiscount = async (productId) => {
    setApplyingDiscountProductId(productId)
    setDiscountActionMessage('')
    setRequestError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/apply-discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: Number(productId),
          discount_percentage: RECOMMENDED_DISCOUNT_PERCENTAGE
        })
      })

      const responseBody = await response.json()

      if (!response.ok) {
        throw new Error(responseBody?.message || 'No se pudo aplicar el descuento')
      }

      setDiscountActionMessage(
        `Descuento aplicado a ${productNameById[String(productId)] || `Producto ${productId}`}. ` +
        `Precio original: ${responseBody.original_price}. Precio final: ${responseBody.new_price}`
      )
      await loadDashboard()
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setApplyingDiscountProductId(null)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const productNameById = useMemo(() => {
    return dashboardData.products.reduce((accumulator, product) => {
      accumulator[String(product.id)] = product.name?.es || product.name?.en || `Producto ${product.id}`
      return accumulator
    }, {})
  }, [dashboardData.products])

  const productById = useMemo(() => {
    return dashboardData.products.reduce((accumulator, product) => {
      accumulator[String(product.id)] = product
      return accumulator
    }, {})
  }, [dashboardData.products])

  const getPriceInfoByProductId = (productId) => {
    const product = productById[String(productId)]
    const variant = product?.variants?.[0]
    const originalPrice = variant?.compare_at_price || variant?.price || '-'
    const finalPrice = variant?.promotional_price || variant?.price || '-'
    const hasDiscountApplied = Boolean(variant?.promotional_price)

    return {
      originalPrice,
      finalPrice,
      hasDiscountApplied
    }
  }

  const openDiscountConfirmation = (productId) => {
    setPendingDiscountProductId(productId)
  }

  const closeDiscountConfirmation = () => {
    setPendingDiscountProductId(null)
  }

  const confirmApplyDiscount = async () => {
    if (!pendingDiscountProductId) {
      return
    }

    const productId = pendingDiscountProductId
    closeDiscountConfirmation()
    await handleApplyDiscount(productId)
  }

  const performanceRows = useMemo(() => {
    return dashboardData.productMetrics
      .map(metric => {
        const viewsEntry = dashboardData.productViews.find(view => String(view.product_id) === String(metric.product_id))
        const conversionRate = metric.views > 0 ? ((metric.purchases / metric.views) * 100).toFixed(1) : '0.0'

        return {
          ...metric,
          name: productNameById[String(metric.product_id)] || `Producto ${metric.product_id}`,
          trackedViews: viewsEntry?.views || 0,
          conversionRate
        }
      })
      .sort((left, right) => right.views - left.views)
  }, [dashboardData.productMetrics, dashboardData.productViews, productNameById])

  const summary = useMemo(() => {
    const totalViews = dashboardData.productMetrics.reduce((total, metric) => total + Number(metric.views || 0), 0)
    const totalPurchases = dashboardData.productMetrics.reduce((total, metric) => total + Number(metric.purchases || 0), 0)
    const topPerformer = performanceRows[0]

    return {
      totalProducts: dashboardData.products.length,
      totalViews,
      totalPurchases,
      recommendations: dashboardData.recommendations.length,
      topPerformer
    }
  }, [dashboardData.products.length, dashboardData.productMetrics, dashboardData.recommendations.length, performanceRows])

  const chartRows = useMemo(() => {
    return performanceRows.slice(0, 6).map(row => ({
      ...row,
      shortName: row.name.length > 18 ? `${row.name.slice(0, 18)}...` : row.name,
      conversionRateValue: Number(row.conversionRate)
    }))
  }, [performanceRows])

  const recommendationChartData = useMemo(() => {
    const recommendedProducts = dashboardData.recommendations.length
    const productMetricsWithoutRecommendation = Math.max(dashboardData.productMetrics.length - recommendedProducts, 0)

    return [
      {
        name: 'Con recomendacion',
        value: recommendedProducts,
        color: '#0f766e'
      },
      {
        name: 'Sin recomendacion',
        value: productMetricsWithoutRecommendation,
        color: '#cbd5e1'
      }
    ]
  }, [dashboardData.productMetrics.length, dashboardData.recommendations.length])

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_45%,#e2e8f0_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-10'>
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur sm:gap-8 sm:p-6 md:rounded-4xl md:p-10'>
        <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
          <div>
            <div className='mb-3 inline-flex items-center gap-3 rounded-full bg-blue-100 px-3 py-2'>
              <img src={logo} alt='NubePilot logo' className='h-10 w-10 rounded-full border border-blue-200 object-cover sm:h-12 sm:w-12' />
              <p className='text-xs font-semibold uppercase tracking-[0.25em] text-blue-700'>Demo Dashboard</p>
            </div>
            <h1 className='text-2xl font-black tracking-tight text-slate-950 sm:text-3xl md:text-4xl'>
              Bienvenido, {session?.name}
            </h1>
            <p className='mt-3 max-w-2xl text-sm text-slate-600 sm:text-base'>
              La sesión se está resolviendo desde un archivo JSON local para avanzar rápido con el frontend del hackathon.
            </p>
          </div>

          <div className='grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap'>
            <button
              type='button'
              onClick={handleOpenMetrics}
              className='inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto'
            >
              Generar métricas
            </button>

            <button
              type='button'
              onClick={loadDashboard}
              className='inline-flex w-full items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 sm:w-auto'
            >
              Actualizar dashboard
            </button>

            <button
              type='button'
              onClick={handleLogout}
              className='inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 sm:w-auto'
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {requestError && (
          <div className='rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700'>
            {requestError}
          </div>
        )}

        {discountActionMessage && (
          <div className='rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700'>
            {discountActionMessage}
          </div>
        )}

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <article className='rounded-3xl bg-slate-950 p-6 text-slate-50'>
            <p className='text-sm uppercase tracking-[0.2em] text-slate-400'>Catálogo</p>
            <h2 className='mt-4 text-4xl font-black'>{isLoading ? '...' : summary.totalProducts}</h2>
            <p className='mt-2 text-sm text-slate-300'>Productos sincronizados desde Tiendanube</p>
          </article>

          <article className='rounded-3xl border border-slate-200 bg-slate-50 p-6'>
            <p className='text-sm uppercase tracking-[0.2em] text-slate-500'>Visitas cargadas</p>
            <h2 className='mt-4 text-4xl font-black text-slate-950'>{isLoading ? '...' : summary.totalViews}</h2>
            <p className='mt-2 text-sm text-slate-600'>Total de visitas registradas en product-metrics</p>
          </article>

          <article className='rounded-3xl border border-blue-200 bg-blue-50 p-6'>
            <p className='text-sm uppercase tracking-[0.2em] text-blue-700'>Compras registradas</p>
            <h2 className='mt-4 text-4xl font-black text-blue-950'>{isLoading ? '...' : summary.totalPurchases}</h2>
            <p className='mt-2 text-sm text-blue-900/75'>Volumen total cargado para recomendaciones</p>
          </article>

          <article className='rounded-3xl border border-emerald-200 bg-emerald-50 p-6'>
            <p className='text-sm uppercase tracking-[0.2em] text-emerald-700'>Descuentos sugeridos</p>
            <h2 className='mt-4 text-4xl font-black text-emerald-950'>{isLoading ? '...' : summary.recommendations}</h2>
            <p className='mt-2 text-sm text-emerald-900/75'>Recomendaciones listas para revisar o aplicar</p>
          </article>
        </div>

        <article className='rounded-3xl border border-amber-300 bg-[linear-gradient(140deg,#fef9c3_0%,#fffbeb_45%,#ffffff_100%)] p-6 shadow-[0_20px_80px_rgba(120,53,15,0.12)]'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-amber-700'>Sugerencias IA</p>
              <h2 className='mt-2 text-2xl font-black text-amber-950'>Recomendaciones de descuento</h2>
              <p className='mt-2 text-sm text-amber-900/80'>
                Esta sección muestra la decisión inteligente principal de la app basada en vistas, compras y precio.
              </p>
            </div>

            <div className='flex flex-col items-start gap-2 sm:items-end'>
              <p className='rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800'>
                {isRecommendationsLoading ? 'IA analizando productos...' : `${dashboardData.recommendations.length} sugerencia(s)`}
              </p>

              <div className='group relative w-full sm:w-auto'>
                <button
                  type='button'
                  aria-disabled='true'
                  onClick={(event) => event.preventDefault()}
                  className='w-full cursor-not-allowed rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 sm:w-auto'
                >
                  Automatizar (Premium)
                </button>

                <div className='pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-72 rounded-2xl border border-amber-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.2)] group-hover:block group-focus-within:block'>
                  <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-700'>Función bloqueada</p>
                  <h3 className='mt-2 text-sm font-bold text-slate-950'>Automatización con IA</h3>
                  <p className='mt-2 text-xs leading-5 text-slate-600'>
                    Esta función aplica descuentos automáticamente y luego reporta todo lo ejecutado.
                    Disponible en el plan premium.
                  </p>
                  <p className='mt-3 text-xs font-semibold text-blue-700'>Sugerencia: sube tu plan para activarla.</p>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-5 grid gap-4 lg:grid-cols-2'>
            {isRecommendationsLoading && (
              <div className='lg:col-span-2 rounded-2xl border border-amber-200 bg-white px-5 py-5'>
                <div className='h-4 w-52 animate-pulse rounded bg-amber-100' />
                <div className='mt-3 h-3 w-full animate-pulse rounded bg-amber-100' />
                <div className='mt-2 h-3 w-3/4 animate-pulse rounded bg-amber-100' />
              </div>
            )}

            {!isRecommendationsLoading && dashboardData.recommendations.length === 0 && (
              <p className='lg:col-span-2 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-sm text-amber-900'>
                La IA no detectó productos críticos para descuento en esta corrida.
              </p>
            )}

            {!isRecommendationsLoading && dashboardData.recommendations.map(recommendation => (
              <div key={recommendation.product_id} className='rounded-2xl border border-amber-200 bg-white px-4 py-4'>
                {(() => {
                  const priceInfo = getPriceInfoByProductId(recommendation.product_id)
                  const isApplying = applyingDiscountProductId === recommendation.product_id

                  return (
                    <>
                      <p className='text-sm font-semibold text-slate-950'>
                        {productNameById[String(recommendation.product_id)] || `Producto ${recommendation.product_id}`}
                      </p>
                      <p className='mt-1 text-xs text-slate-500'>ID {recommendation.product_id}</p>
                      <p className='mt-3 text-sm text-slate-700'>{recommendation.message}</p>

                      <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700'>
                        <p>
                          Precio original: <span className='font-semibold'>{priceInfo.originalPrice}</span>
                        </p>
                        <p className='mt-1'>
                          Precio final: <span className='font-semibold'>{priceInfo.finalPrice}</span>
                        </p>
                      </div>

                      <button
                        type='button'
                        onClick={() => openDiscountConfirmation(recommendation.product_id)}
                        disabled={isApplying || priceInfo.hasDiscountApplied}
                        className='mt-4 w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
                      >
                        {isApplying
                          ? 'Aplicando descuento...'
                          : priceInfo.hasDiscountApplied
                            ? 'Descuento ya aplicado'
                            : `Aplicar ${RECOMMENDED_DISCOUNT_PERCENTAGE}%`}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleOpenProductDetail(recommendation.product_id)}
                        className='mt-2 w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto'
                      >
                        Ver detalle
                      </button>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        </article>

        <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
          <article className='rounded-3xl border border-slate-200 bg-white p-6'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>Grafica principal</p>
                <h2 className='mt-2 text-2xl font-black text-slate-950'>Views vs purchases por producto</h2>
              </div>
              <p className='text-sm text-slate-500'>Top 6 por volumen de visitas</p>
            </div>

            <div className='mt-6 h-64 sm:h-80 lg:h-88'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={chartRows} barGap={10}>
                  <CartesianGrid stroke='#e2e8f0' strokeDasharray='4 4' vertical={false} />
                  <XAxis dataKey='shortName' tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
                  />
                  <Bar dataKey='views' name='Views' radius={[10, 10, 0, 0]} fill='#0f172a' />
                  <Bar dataKey='purchases' name='Purchases' radius={[10, 10, 0, 0]} fill='#3b82f6' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className='rounded-3xl border border-slate-200 bg-slate-50 p-6'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>Cobertura</p>
              <h2 className='mt-2 text-2xl font-black text-slate-950'>Estado de recomendaciones</h2>
            </div>

            <div className='mt-6 flex flex-col gap-6 lg:flex-row lg:items-center'>
              <div className='h-56 flex-1 sm:h-72'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={recommendationChartData}
                      dataKey='value'
                      nameKey='name'
                      innerRadius={68}
                      outerRadius={102}
                      paddingAngle={4}
                    >
                      {recommendationChartData.map(slice => (
                        <Cell key={slice.name} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className='flex-1 space-y-3'>
                {recommendationChartData.map(item => (
                  <div key={item.name} className='rounded-2xl border border-slate-200 bg-white px-4 py-4'>
                    <div className='flex items-center gap-3'>
                      <span className='h-3 w-3 rounded-full' style={{ backgroundColor: item.color }} />
                      <p className='text-sm font-semibold text-slate-900'>{item.name}</p>
                    </div>
                    <p className='mt-2 text-3xl font-black text-slate-950'>{isLoading ? '...' : item.value}</p>
                  </div>
                ))}

                <div className='rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4'>
                  <p className='text-sm text-blue-900/80'>
                    La regla actual recomienda descuento cuando las vistas superan a las compras por al menos 100 puntos.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.3fr_0.7fr]'>
          <article className='rounded-3xl border border-slate-200 bg-white p-6'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>Rendimiento</p>
                <h2 className='mt-2 text-2xl font-black text-slate-950'>Productos con métricas</h2>
              </div>

              {summary.topPerformer && !isLoading && (
                <p className='text-sm text-slate-600'>
                  Top actual: <span className='font-semibold text-slate-950'>{summary.topPerformer.name}</span>
                </p>
              )}
            </div>

            <div className='mt-5 overflow-auto rounded-3xl border border-slate-200'>
              <table className='w-full min-w-140 text-left text-sm'>
                <thead className='bg-slate-100 text-slate-700'>
                  <tr>
                    <th className='px-4 py-3 font-semibold'>Producto</th>
                    <th className='px-4 py-3 font-semibold'>Views</th>
                    <th className='px-4 py-3 font-semibold'>Purchases</th>
                    <th className='px-4 py-3 font-semibold'>Conv.</th>
                    <th className='px-4 py-3 font-semibold'>Views tracking</th>
                    <th className='px-4 py-3 font-semibold'>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && performanceRows.length === 0 && (
                    <tr>
                      <td className='px-4 py-4 text-slate-500' colSpan='6'>
                        Aún no hay métricas cargadas. Usa la pantalla de generación para poblar el dashboard.
                      </td>
                    </tr>
                  )}

                  {performanceRows.map(row => (
                    <tr key={row.product_id} className='border-t border-slate-100'>
                      <td className='px-4 py-3'>
                        <div className='font-semibold text-slate-950'>{row.name}</div>
                        <div className='text-xs text-slate-500'>ID {row.product_id}</div>
                      </td>
                      <td className='px-4 py-3 text-slate-700'>{row.views}</td>
                      <td className='px-4 py-3 text-slate-700'>{row.purchases}</td>
                      <td className='px-4 py-3 text-slate-700'>{row.conversionRate}%</td>
                      <td className='px-4 py-3 text-slate-700'>{row.trackedViews}</td>
                      <td className='px-4 py-3'>
                        <button
                          type='button'
                          onClick={() => handleOpenProductDetail(row.product_id)}
                          className='rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100'
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className='grid gap-6'>
            <article className='rounded-3xl border border-slate-200 bg-slate-50 p-6'>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>Sesión</p>
              <h2 className='mt-2 text-2xl font-black text-slate-950'>{session?.name}</h2>
              <p className='mt-3 text-sm text-slate-600'>{session?.email}</p>
              <p className='mt-1 text-sm text-slate-500'>Rol: {session?.role}</p>
            </article>

            <article className='rounded-3xl border border-blue-200 bg-blue-50 p-6'>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-blue-700'>Acción rápida</p>
              <h2 className='mt-2 text-2xl font-black text-blue-950'>Generar más datos</h2>
              <p className='mt-3 text-sm text-blue-900/80'>
                Si quieres cambiar el comportamiento del dashboard, crea nuevas métricas desde la herramienta separada.
              </p>
              <button
                type='button'
                onClick={handleOpenMetrics}
                className='mt-5 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto'
              >
                Abrir generador de métricas
              </button>
            </article>
          </div>
        </div>
      </section>

      {pendingDiscountProductId && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4'>
          <div className='w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.35)]'>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-amber-700'>Confirmar acción</p>
            <h3 className='mt-2 text-xl font-black text-slate-950'>Aplicar descuento ahora</h3>
            <p className='mt-3 text-sm text-slate-600'>
              Vas a aplicar un {RECOMMENDED_DISCOUNT_PERCENTAGE}% de descuento al producto{' '}
              <span className='font-semibold text-slate-950'>
                {productNameById[String(pendingDiscountProductId)] || `Producto ${pendingDiscountProductId}`}
              </span>
              .
            </p>

            <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <button
                type='button'
                onClick={closeDiscountConfirmation}
                className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={confirmApplyDiscount}
                className='rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600'
              >
                Sí, aplicar descuento
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home
