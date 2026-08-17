import { useEffect } from 'react'

export interface SeoOptions {
  keywords?: string | string[]
  image?: string
  type?: 'website' | 'product' | 'article' | 'profile'
  canonical?: string
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

export function useDocumentMetadata(
  title: string,
  description?: string,
  options?: SeoOptions
) {
  useEffect(() => {
    const prevTitle = document.title
    const formattedTitle = title
      ? `${title} | Short Circuit`
      : 'Short Circuit — Electronics for Makers & Engineers'
    document.title = formattedTitle

    // Helper to get or create meta tag
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attrName, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // 1. Meta Description
    if (description) {
      setMetaTag('name', 'description', description)
    }

    // 2. Keywords
    if (options?.keywords) {
      const kw = Array.isArray(options.keywords) ? options.keywords.join(', ') : options.keywords
      setMetaTag('name', 'keywords', kw)
    }

    // 3. Canonical Link (Normalized without search query or trailing slash)
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    const currentCanonical = options?.canonical || `${window.location.origin}${window.location.pathname}`
    canonicalLink.setAttribute('href', currentCanonical)

    // 4. OpenGraph Tags
    setMetaTag('property', 'og:title', formattedTitle)
    setMetaTag('property', 'og:site_name', 'Short Circuit')
    setMetaTag('property', 'og:url', currentCanonical)
    setMetaTag('property', 'og:type', options?.type || 'website')
    if (description) {
      setMetaTag('property', 'og:description', description)
    }
    if (options?.image) {
      setMetaTag('property', 'og:image', options.image)
    }

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', options?.image ? 'summary_large_image' : 'summary')
    setMetaTag('name', 'twitter:title', formattedTitle)
    if (description) {
      setMetaTag('name', 'twitter:description', description)
    }
    if (options?.image) {
      setMetaTag('name', 'twitter:image', options.image)
    }

    // 6. Schema.org JSON-LD structured data
    let jsonLdScript = document.getElementById('schema-jsonld') as HTMLScriptElement | null
    if (options?.jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script')
        jsonLdScript.id = 'schema-jsonld'
        jsonLdScript.type = 'application/ld+json'
        document.head.appendChild(jsonLdScript)
      }
      jsonLdScript.textContent = JSON.stringify(options.jsonLd)
    }

    return () => {
      document.title = prevTitle
      if (jsonLdScript && document.head.contains(jsonLdScript)) {
        document.head.removeChild(jsonLdScript)
      }
    }
  }, [
    title,
    description,
    options?.canonical,
    options?.image,
    options?.type,
    JSON.stringify(options?.keywords),
    JSON.stringify(options?.jsonLd),
  ])
}

