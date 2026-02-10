import { useEffect, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BackToTop from './BackToTop'
import GlobalSearch from './GlobalSearch'
import Breadcrumbs from './Breadcrumbs'
import { useDocumentHead } from '../seo/useDocumentHead'

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" aria-hidden>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

export default function Layout() {
  const { pathname, hash } = useLocation()

  useDocumentHead(pathname)

  useEffect(() => {
    if (!hash || (hash !== '#quote' && hash !== '#callback')) return
    const id = hash.slice(1)
    const scrollToEl = () => {
      const el = document.getElementById(id)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    const t = setTimeout(scrollToEl, 100)
    return () => clearTimeout(t)
  }, [pathname, hash])

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <div className="max-w-landing mx-auto px-5 sm:px-6 lg:px-8 xl:px-20 py-6">
          <Breadcrumbs />
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
      <BackToTop />
      <GlobalSearch />
    </div>
  )
}
