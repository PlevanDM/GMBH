import { useEffect } from 'react'
import { getPageSEO } from './config'

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Updates document title, meta description, keywords, Open Graph, Twitter Card, and canonical URL.
 */
export function useDocumentHead(pathname: string) {
  useEffect(() => {
    const { title, description, keywords, ogImage, canonical } = getPageSEO(pathname)

    document.title = title

    setMeta('description', description)
    setMeta('keywords', keywords ?? '')

    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:url', canonical, 'property')
    if (ogImage) setMeta('og:image', ogImage, 'property')

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    if (ogImage) setMeta('twitter:image', ogImage)

    setLink('canonical', canonical)
  }, [pathname])
}
