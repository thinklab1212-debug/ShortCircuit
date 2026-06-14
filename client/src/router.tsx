import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { DefaultLayout, AuthLayout, AdminLayout, VendorLayout } from '@/layouts'
import { ProtectedRoute, AdminRoute, GuestRoute, VendorRoute } from '@/components/guards'
import { NotFound } from '@/components/ui/error'

// Auth
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth'
// Storefront
import { HomePage } from '@/pages/home'
import { ShopPage } from '@/pages/shop'
import { ProductDetailPage } from '@/pages/product'
import { CategoriesPage, CategoryProductsPage, BrandsPage, BrandProductsPage } from '@/pages/catalog'
import {
  ContactPage,
  AboutPage,
  FaqPage,
  PrivacyPage,
  TermsPage,
  ShippingPage,
  ReturnsPage,
} from '@/pages/content'
// Customer (protected)
import { CartPage } from '@/pages/cart'
import { WishlistPage } from '@/pages/wishlist'
import { CheckoutPage } from '@/pages/checkout'
import { OrdersPage, OrderDetailPage } from '@/pages/orders'
import { ProfilePage } from '@/pages/profile'
import { AddressesPage } from '@/pages/account'

// Admin (lazy loaded for SEO performance)
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/ProductsAdminPage'))
const AdminProductFormPage = lazy(() => import('@/pages/admin/ProductFormPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/CategoriesAdminPage'))
const AdminBrandsPage = lazy(() => import('@/pages/admin/BrandsAdminPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/OrdersAdminPage'))
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/OrderDetailAdminPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersAdminPage'))
const AdminCouponsPage = lazy(() => import('@/pages/admin/CouponsAdminPage'))
const AdminBannersPage = lazy(() => import('@/pages/admin/BannersAdminPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage'))
const AdminVendorsPage = lazy(() => import('@/pages/admin/VendorsAdminPage'))
const AdminReviewQueuePage = lazy(() => import('@/pages/admin/ReviewQueuePage'))
const AdminInvoiceSettingsPage = lazy(() => import('@/pages/admin/InvoiceSettingsPage'))
const AdminInvoicesPage = lazy(() => import('@/pages/admin/InvoicesPage'))
const AdminCancellationRequestsPage = lazy(() => import('@/pages/admin/CancellationRequestsAdminPage'))
const AdminProjectKitsPage = lazy(() => import('@/pages/admin/ProjectKitsAdminPage'))

const ProjectKitsPage = lazy(() => import('@/pages/projects/ProjectKitsPage'))
const ProjectKitDetailPage = lazy(() => import('@/pages/projects/ProjectKitDetailPage'))

// Vendor (lazy loaded for SEO performance)
const VendorDashboardPage = lazy(() => import('@/pages/vendor/DashboardPage'))
const VendorProductsPage = lazy(() => import('@/pages/vendor/ProductsPage'))
const VendorProductFormPage = lazy(() => import('@/pages/vendor/ProductFormPage'))
const VendorProfilePage = lazy(() => import('@/pages/vendor/ProfilePage'))


// ─── Router Configuration ───────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Public + Customer Routes (Default Layout) ──
  {
    element: <DefaultLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'deals', element: <ShopPage /> },
      { path: 'product/:slug', element: <ProductDetailPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'category/:slug', element: <CategoryProductsPage /> },
      { path: 'brands', element: <BrandsPage /> },
      { path: 'brand/:slug', element: <BrandProductsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'shipping', element: <ShippingPage /> },
      { path: 'returns', element: <ReturnsPage /> },
      { path: 'projects', element: <ProjectKitsPage /> },
      { path: 'projects/:slug', element: <ProjectKitDetailPage /> },

      // ── Protected Customer Routes ──
      { path: 'cart', element: <ProtectedRoute><CartPage /></ProtectedRoute> },
      { path: 'wishlist', element: <ProtectedRoute><WishlistPage /></ProtectedRoute> },
      { path: 'checkout', element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'orders/:id', element: <ProtectedRoute><OrderDetailPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'addresses', element: <ProtectedRoute><AddressesPage /></ProtectedRoute> },
    ],
  },

  // ── Auth Routes (Auth Layout) ──
  {
    element: <GuestRoute><AuthLayout /></GuestRoute>,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password/:token', element: <ResetPasswordPage /> },
    ],
  },

  // ── Admin Routes (Admin Layout) ──
  {
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    path: 'admin',
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:id/edit', element: <AdminProductFormPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'brands', element: <AdminBrandsPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'coupons', element: <AdminCouponsPage /> },
      { path: 'banners', element: <AdminBannersPage /> },
      { path: 'project-kits', element: <AdminProjectKitsPage /> },
      { path: 'analytics', element: <AdminAnalyticsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'vendors', element: <AdminVendorsPage /> },
      { path: 'review-queue', element: <AdminReviewQueuePage /> },
      { path: 'invoice-settings', element: <AdminInvoiceSettingsPage /> },
      { path: 'invoices', element: <AdminInvoicesPage /> },
      { path: 'cancellation-requests', element: <AdminCancellationRequestsPage /> },
    ],
  },

  // ── Vendor Routes (Vendor Layout) ──
  {
    element: <VendorRoute><VendorLayout /></VendorRoute>,
    path: 'vendor',
    children: [
      { index: true, element: <VendorDashboardPage /> },
      { path: 'products', element: <VendorProductsPage /> },
      { path: 'products/new', element: <VendorProductFormPage /> },
      { path: 'products/:id/edit', element: <VendorProductFormPage /> },
      { path: 'profile', element: <VendorProfilePage /> },
    ],
  },

  // ── 404 ──
  {
    path: '*',
    element: <DefaultLayout />,
    children: [{ path: '*', element: <NotFound /> }],
  },
])
