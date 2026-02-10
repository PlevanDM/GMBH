import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { ProtectedRoute } from './auth/AuthContext'
import { BuyerLocaleProvider } from './i18n/BuyerLocaleContext'

const SecurityManagement = lazy(() => import('./pages/SecurityManagement'))
const GlobalLogistics = lazy(() => import('./pages/GlobalLogistics'))
const EquipmentSupport = lazy(() => import('./pages/EquipmentSupport'))
const Offices = lazy(() => import('./pages/Offices'))
const Solutions = lazy(() => import('./pages/Solutions'))
const Faq = lazy(() => import('./pages/Faq'))
const Impressum = lazy(() => import('./pages/Impressum'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Stock = lazy(() => import('./pages/marketplace/Stock'))
const MarketplaceCatalog = lazy(() => import('./pages/marketplace/MarketplaceCatalog'))
const MarketplaceCategory = lazy(() => import('./pages/marketplace/MarketplaceCategory'))
const MarketplaceItem = lazy(() => import('./pages/marketplace/MarketplaceItem'))
const PartnersPage = lazy(() => import('./pages/Partners'))
const BuyerLayout = lazy(() => import('./pages/buyer/BuyerLayout'))
const BuyerLogin = lazy(() => import('./pages/buyer/BuyerLogin'))
const BuyerStock = lazy(() => import('./pages/buyer/BuyerStock'))
const BuyerRequests = lazy(() => import('./pages/buyer/BuyerRequests'))
const BuyerProfile = lazy(() => import('./pages/buyer/BuyerProfile'))
const BuyerRequestCard = lazy(() => import('./pages/buyer/BuyerRequestCard'))
const MyLayout = lazy(() => import('./pages/my/MyLayout'))
const MyLogin = lazy(() => import('./pages/my/MyLogin'))
const MyDashboard = lazy(() => import('./pages/my/MyDashboard'))
const MyInventory = lazy(() => import('./pages/my/MyInventory'))
const MyLaptopRecommendations = lazy(() => import('./pages/my/MyLaptopRecommendations'))
const MySettings = lazy(() => import('./pages/my/MySettings'))
const MyUsers = lazy(() => import('./pages/my/MyUsers'))
const MyRfqManagement = lazy(() => import('./pages/my/MyRfqManagement'))
const MyActivityLog = lazy(() => import('./pages/my/MyActivityLog'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ToolsLayout = lazy(() => import('./pages/tools/ToolsLayout'))
const ToolsLogin = lazy(() => import('./pages/tools/ToolsLogin'))
const KnowledgeList = lazy(() => import('./pages/tools/KnowledgeList'))
const KnowledgeArticlePage = lazy(() => import('./pages/tools/KnowledgeArticlePage'))
const ReferencesNexx = lazy(() => import('./pages/tools/ReferencesNexx'))

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

/** Scroll to top on route change (unless hash anchor) */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BuyerLocaleProvider>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="solutions" element={<Solutions />} />
            <Route path="solutions/:slug" element={<Solutions />} />
            <Route path="security-management" element={<SecurityManagement />} />
            <Route path="equipment-support" element={<EquipmentSupport />} />
            <Route path="global-logistics" element={<GlobalLogistics />} />
            <Route path="offices" element={<Offices />} />
            <Route path="faq" element={<Faq />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="impressum" element={<Impressum />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="marketplace/stock" element={<Stock />} />
            <Route path="marketplace/catalog" element={<MarketplaceCatalog />} />
            <Route path="marketplace/category/:slug" element={<MarketplaceCategory />} />
            <Route path="marketplace/item/:id" element={<MarketplaceItem />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="buyer/login" element={<BuyerLogin />} />
            <Route
              path="buyer"
              element={
                <ProtectedRoute role="buyer">
                  <BuyerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<BuyerStock />} />
              <Route path="stock" element={<Navigate to="/buyer" replace />} />
              <Route path="requests" element={<BuyerRequests />} />
              <Route path="requests/:id" element={<BuyerRequestCard />} />
              <Route path="profile" element={<BuyerProfile />} />
            </Route>
            <Route path="my/login" element={<MyLogin />} />
            <Route
              path="my"
              element={
                <ProtectedRoute role="my">
                  <MyLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MyDashboard />} />
              <Route path="users" element={<MyUsers />} />
              <Route path="inventory" element={<MyInventory />} />
              <Route path="rfqs" element={<MyRfqManagement />} />
              <Route path="laptops" element={<MyLaptopRecommendations />} />
              <Route path="activity" element={<MyActivityLog />} />
              <Route path="settings" element={<MySettings />} />
            </Route>
            <Route path="tools/login" element={<ToolsLogin />} />
            <Route
              path="tools"
              element={
                <ProtectedRoute role="tools">
                  <ToolsLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/tools/knowledge" replace />} />
              <Route path="knowledge" element={<KnowledgeList />} />
              <Route path="knowledge/article/:id" element={<KnowledgeArticlePage />} />
              <Route path="references" element={<ReferencesNexx />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BuyerLocaleProvider>
  )
}
