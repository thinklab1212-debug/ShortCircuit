import { createBrowserRouter } from 'react-router'
import { DefaultLayout, AuthLayout, AdminLayout } from '@/layouts'
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/components/guards'
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
// Admin
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import AdminProductsPage from '@/pages/admin/ProductsAdminPage'
import AdminProductFormPage from '@/pages/admin/ProductFormPage'
import AdminCategoriesPage from '@/pages/admin/CategoriesAdminPage'
import AdminBrandsPage from '@/pages/admin/BrandsAdminPage'
import AdminOrdersPage from '@/pages/admin/OrdersAdminPage'
import AdminOrderDetailPage from '@/pages/admin/OrderDetailAdminPage'
import AdminUsersPage from '@/pages/admin/UsersAdminPage'
import AdminCouponsPage from '@/pages/admin/CouponsAdminPage'
import AdminBannersPage from '@/pages/admin/BannersAdminPage'
import AdminAnalyticsPage from '@/pages/admin/AnalyticsPage'
import AdminSettingsPage from '@/pages/admin/SettingsPage'

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
      { path: 'analytics', element: <AdminAnalyticsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },

  // ── 404 ──
  {
    path: '*',
    element: <DefaultLayout />,
    children: [{ path: '*', element: <NotFound /> }],
  },
])
