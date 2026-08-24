import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home'));
const ToolsByCategory = lazy(() => import('../pages/tools-by-category'));
const BlogIndex = lazy(() => import('../pages/blog'));
const BlogPost = lazy(() => import('../pages/blog/BlogPost'));
const PrivacyPolicy = lazy(() => import('../pages/privacy-policy'));
const TermsAndConditions = lazy(() => import('../pages/terms'));
const RefundPolicy = lazy(() => import('../pages/refund-policy'));
const Pricing = lazy(() => import('../pages/pricing'));
const Welcome = lazy(() => import('../pages/welcome'));
const Account = lazy(() => import('../pages/account'));
const Settings = lazy(() => import('../pages/settings'));
const NotFound = lazy(() => import('../pages/404'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />
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
    path: '/account',
    element: <Account />
  },
  {
    path: '/settings',
    element: <Settings />
  },
  {
    path: '/categories/:categoryName',
    element: <ToolsByCategory />
  },
  {
    path: '/blog',
    element: <BlogIndex />
  },
  {
    path: '/blog/:slug',
    element: <BlogPost />
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />
  },
  {
    path: '/terms',
    element: <TermsAndConditions />
  },
  {
    path: '/terms-of-service',
    element: <TermsAndConditions />
  },
  {
    path: '/refund-policy',
    element: <RefundPolicy />
  },
  {
    path: '/404',
    element: <NotFound />
  }
];

export default routes;
