import { createBrowserRouter, RouterProvider } from 'react-router'
import App from '../pages/App'
import Home from '../pages/home/Home'
import Login from '../pages/login/Login'

const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: Home
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
