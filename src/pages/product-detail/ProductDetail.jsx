import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import logo from '../../assets/logo.jpeg'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const RECOMMENDED_DISCOUNT_PERCENTAGE = 10

const ProductDetail = () => {
  const navigate = useNavigate()
  const { productId } = useParams()

  const [product, setProduct] = useState(null)
  const [metrics, setMetrics] = useState([])
  const [views, setViews] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountActionMessage, setDiscountActionMessage] = useState('')
  const [isDiscountConfirmationOpen, setIsDiscountConfirmationOpen] = useState(false)

  const loadProductDetail = useCallback(async () => {
    setIsLoading(true)
    setRequestError('')

    try {
      const [productResponse, metricsResponse, viewsResponse, recommendationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tiendanube/products/${productId}`),
        fetch(`${API_BASE_URL}/api/analytics/product-metrics`),
        fetch(`${API_BASE_URL}/api/analytics/product-views`),
        fetch(`${API_BASE_URL}/api/analytics/discount-recommendations`)
      ])

      const [productBody, metricsBody, viewsBody, recommendationsBody] = await Promise.all([
        productResponse.json(),
        metricsResponse.json(),
        viewsResponse.json(),
        recommendationsResponse.json()
      ])

      if (!productResponse.ok) {
        throw new Error(productBody?.message || 'No se pudo cargar el detalle del producto')
      }

      if (!metricsResponse.ok) {
        throw new Error(metricsBody?.message || 'No se pudieron cargar las metricas')
      }

      if (!viewsResponse.ok) {
        throw new Error(viewsBody?.message || 'No se pudieron cargar las vistas')
      }

      if (!recommendationsResponse.ok) {
        throw new Error(recommendationsBody?.message || 'No se pudieron cargar las recomendaciones')
      }

      setProduct(productBody)
      setMetrics(metricsBody)
      setViews(viewsBody)
      setRecommendations(recommendationsBody)
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  const handleApplyDiscount = async () => {
    setIsApplyingDiscount(true)
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
        `Descuento aplicado correctamente. Precio original: ${responseBody.original_price}. ` +
        `Precio final: ${responseBody.new_price}`
      )
      await loadProductDetail()
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  useEffect(() => {
    loadProductDetail()
  }, [loadProductDetail])

  const productMetric = useMemo(() => {
    return metrics.find(metric => String(metric.product_id) === String(productId))
  }, [metrics, productId])

  const productViews = useMemo(() => {
    return views.find(view => String(view.product_id) === String(productId))
  }, [views, productId])

  const productRecommendation = useMemo(() => {
    return recommendations.find(recommendation => String(recommendation.product_id) === String(productId))
  }, [recommendations, productId])

  const productName = useMemo(() => {
    return product?.name?.es || product?.name?.en || `Producto ${productId}`
  }, [product, productId])

  const conversionRate = useMemo(() => {
    if (!productMetric?.views || Number(productMetric.views) === 0) {
      return '0.0'
    }

    return ((Number(productMetric.purchases) / Number(productMetric.views)) * 100).toFixed(1)
  }, [productMetric])

  const productDescription = useMemo(() => {
    return product?.description?.es || product?.description?.en || ''
  }, [product])

  const primaryVariant = useMemo(() => {
    return product?.variants?.[0] || null
  }, [product])

  const mainImage = useMemo(() => {
    return product?.images?.[0]?.src || product?.images?.[0]?.url || ''
  }, [product])

  const galleryImages = useMemo(() => {
    return (product?.images || []).slice(0, 4)
  }, [product])

  const categoryNames = useMemo(() => {
    if (!product?.categories || product.categories.length === 0) {
      return 'Sin categoria'
    }

    return product.categories
      .map(category => category?.name?.es || category?.name?.en || category?.id)
      .join(', ')
  }, [product])

  const hasDiscountApplied = Boolean(primaryVariant?.promotional_price)

  const openDiscountConfirmation = () => {
    setIsDiscountConfirmationOpen(true)
  }

  const closeDiscountConfirmation = () => {
    setIsDiscountConfirmationOpen(false)
  }

  const confirmApplyDiscount = async () => {
    closeDiscountConfirmation()
    await handleApplyDiscount()
  }

  return (
    <main className='min-h-screen bg-[linear-gradient(145deg,#f8fafc_0%,#eff6ff_40%,#e0f2fe_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-10'>
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6 md:rounded-4xl md:p-10'>
        <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <div className='mb-2 inline-flex items-center gap-3 rounded-full bg-slate-900 px-3 py-2'>
              <img src={logo} alt='NubePilot logo' className='h-8 w-8 rounded-full border border-slate-500 object-cover' />
              <p className='text-xs font-semibold uppercase tracking-[0.22em] text-white'>Product View</p>
            </div>
            <h1 className='text-2xl font-black tracking-tight text-slate-950 sm:text-3xl md:text-4xl'>{productName}</h1>
            <p className='mt-2 text-sm text-slate-600'>ID {productId}</p>
          </div>

          <div className='grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap'>
            <button
              type='button'
              onClick={loadProductDetail}
              className='w-full rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 sm:w-auto'
            >
              Actualizar
            </button>
            <button
              type='button'
              onClick={() => navigate('/')}
              className='w-full rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto'
            >
              Volver al dashboard
            </button>
          </div>
        </header>

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
          <article className='rounded-3xl bg-slate-950 p-6 text-white'>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-300'>Precio</p>
            <p className='mt-3 text-3xl font-black'>{primaryVariant?.price || '-'}</p>
          </article>

          <article className='rounded-3xl border border-slate-200 bg-slate-50 p-6'>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-500'>Views (metrics)</p>
            <p className='mt-3 text-3xl font-black text-slate-950'>{isLoading ? '...' : productMetric?.views ?? 0}</p>
          </article>

          <article className='rounded-3xl border border-blue-200 bg-blue-50 p-6'>
            <p className='text-xs uppercase tracking-[0.2em] text-blue-700'>Purchases</p>
            <p className='mt-3 text-3xl font-black text-blue-950'>{isLoading ? '...' : productMetric?.purchases ?? 0}</p>
          </article>

          <article className='rounded-3xl border border-emerald-200 bg-emerald-50 p-6'>
            <p className='text-xs uppercase tracking-[0.2em] text-emerald-700'>Conversión</p>
            <p className='mt-3 text-3xl font-black text-emerald-950'>{isLoading ? '...' : `${conversionRate}%`}</p>
          </article>
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.25fr_0.75fr]'>
          <article className='rounded-3xl border border-slate-200 bg-white p-6'>
            <h2 className='text-2xl font-black text-slate-950'>Vista del producto</h2>
            <p className='mt-2 text-sm text-slate-600'>Información relevante como si estuvieras viendo la ficha en la tienda.</p>

            <div className='mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]'>
              <div className='space-y-3'>
                <div className='overflow-hidden rounded-3xl border border-slate-200 bg-slate-100'>
                  {mainImage
                    ? (
                      <img src={mainImage} alt={productName} className='h-72 w-full object-cover sm:h-96' />
                      )
                    : (
                      <div className='flex h-72 items-center justify-center px-6 text-sm text-slate-500 sm:h-96'>
                        Este producto no tiene imagen principal.
                      </div>
                      )}
                </div>

                {galleryImages.length > 1 && (
                  <div className='grid grid-cols-4 gap-2'>
                    {galleryImages.map((image, index) => (
                      <img
                        key={image.id || index}
                        src={image.src || image.url}
                        alt={`${productName} ${index + 1}`}
                        className='h-18 w-full rounded-xl border border-slate-200 object-cover'
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className='space-y-4'>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>Nombre</p>
                  <p className='mt-2 text-xl font-bold text-slate-950'>{productName}</p>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>Precio base</p>
                    <p className='mt-2 text-lg font-bold text-slate-950'>{primaryVariant?.price || '-'}</p>
                  </div>
                  <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>Promocional</p>
                    <p className='mt-2 text-lg font-bold text-slate-950'>{primaryVariant?.promotional_price || 'Sin promo'}</p>
                  </div>
                  <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>Stock</p>
                    <p className='mt-2 text-lg font-bold text-slate-950'>{primaryVariant?.stock ?? '-'}</p>
                  </div>
                  <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>SKU</p>
                    <p className='mt-2 text-lg font-bold text-slate-950'>{primaryVariant?.sku || '-'}</p>
                  </div>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                  <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>Categoria</p>
                  <p className='mt-2 text-sm text-slate-700'>{categoryNames}</p>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                  <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>Descripcion</p>
                  {productDescription
                    ? (
                      <div
                        className='prose prose-sm mt-2 max-w-none text-slate-700'
                        dangerouslySetInnerHTML={{ __html: productDescription }}
                      />
                      )
                    : (
                      <p className='mt-2 text-sm text-slate-600'>Este producto no tiene descripcion cargada.</p>
                      )}
                </div>
              </div>
            </div>
          </article>

          <article className='rounded-3xl border border-amber-200 bg-amber-50 p-6'>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-amber-700'>Recomendacion</p>
            <h2 className='mt-2 text-2xl font-black text-amber-950'>Estado para este producto</h2>

            <div className='mt-4 space-y-3'>
              <div className='rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700'>
                Views tracking: <strong>{productViews?.views ?? 0}</strong>
              </div>

              <div className='rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700'>
                Views metrics: <strong>{productMetric?.views ?? 0}</strong>
              </div>

              <div className='rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700'>
                Purchases: <strong>{productMetric?.purchases ?? 0}</strong>
              </div>

              <div className='rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700'>
                Precio original: <strong>{primaryVariant?.compare_at_price || primaryVariant?.price || '-'}</strong>
              </div>

              <div className='rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700'>
                Precio final: <strong>{primaryVariant?.promotional_price || primaryVariant?.price || '-'}</strong>
              </div>

              {productRecommendation
                ? (
                  <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800'>
                    <p className='font-semibold'>Este producto tiene recomendación activa</p>
                    <p className='mt-2'>{productRecommendation.message}</p>
                    <button
                      type='button'
                      onClick={openDiscountConfirmation}
                      disabled={isApplyingDiscount || hasDiscountApplied}
                      className='mt-4 w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
                    >
                      {isApplyingDiscount
                        ? 'Aplicando descuento...'
                        : hasDiscountApplied
                          ? 'Descuento ya aplicado'
                          : `Aplicar ${RECOMMENDED_DISCOUNT_PERCENTAGE}%`}
                    </button>
                  </div>
                  )
                : (
                  <div className='rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600'>
                    Este producto no cumple la regla de recomendación en este momento.
                  </div>
                  )}
            </div>
          </article>
        </div>
      </section>

      {isDiscountConfirmationOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4'>
          <div className='w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.35)]'>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700'>Confirmar acción</p>
            <h3 className='mt-2 text-xl font-black text-slate-950'>Aplicar descuento al producto</h3>
            <p className='mt-3 text-sm text-slate-600'>
              Vas a aplicar un {RECOMMENDED_DISCOUNT_PERCENTAGE}% de descuento a{' '}
              <span className='font-semibold text-slate-950'>{productName}</span>.
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
                className='rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700'
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

export default ProductDetail