import { createBrowserRouter, RouterProvider } from 'react-router'
import App from '../pages/App'
import Home from '../home/Home'

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
    Component: () => <div>Login</div>
  }
])

const Router = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default Router
