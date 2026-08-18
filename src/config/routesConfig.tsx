import { Navigate, RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home'));
const ToolsByCategory = lazy(() => import('../pages/tools-by-category'));
const Pricing = lazy(() => import('../pages/pricing'));
const Welcome = lazy(() => import('../pages/welcome'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/categories/:categoryName',
    element: <ToolsByCategory />
  },
  {
    path: '/pricing',
    element: <Pricing />
  },
  {
    path: '/welcome',
    element: <Welcome />
  },
  {
    path: '*',
    element: <Navigate to="404" />
  }
];

export default routes;
