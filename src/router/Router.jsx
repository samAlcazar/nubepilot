import { createBrowserRouter, RouterProvider } from 'react-router'
import App from '../pages/App'
import Home from '../pages/home/Home'
import Login from '../pages/login/Login'
import Metrics from '../pages/metrics/Metrics'
import ProductDetail from '../pages/product-detail/ProductDetail'

const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: Home
      },
      {
        path: 'metrics',
        Component: Metrics
      },
      {
        path: 'products/:productId',
        Component: ProductDetail
      }
    ]
  },
  {
    path: '/login',
    Component: Login
  }
])

const Router = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default Router
