interface ProductJsonLdProps {
  product: {
    name: string
    description?: string
    shortDescription?: string
    sku: string
    price: number
    salePrice?: number
    stock: number
    images?: { url: string }[]
    brand?: { name: string } | string
    ratingsAverage?: number
    ratingsCount?: number
  }
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  if (!product) return null

  const effectivePrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price
  const brandName = typeof product.brand === 'object' && product.brand ? product.brand.name : 'Short Circuit'
  const imageUrl = product.images && product.images.length > 0 ? product.images[0].url : ''

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: imageUrl ? [imageUrl] : undefined,
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? window.location.href : '',
      priceCurrency: 'INR',
      price: effectivePrice,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.ratingsCount && product.ratingsCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingsAverage || 5,
            reviewCount: product.ratingsCount,
          },
        }
      : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ProjectKitJsonLdProps {
  kit: {
    name: string
    shortDescription?: string
    coverImage?: { url: string }
    applicationArea?: string
    estimatedTimeMinutes?: number
  }
}

export function ProjectKitJsonLd({ kit }: ProjectKitJsonLdProps) {
  if (!kit) return null

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'TechArticle',
    headline: kit.name,
    description: kit.shortDescription,
    image: kit.coverImage?.url ? [kit.coverImage.url] : undefined,
    inLanguage: 'en-US',
    author: {
      '@type': 'Organization',
      name: 'Short Circuit Electronics',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Short Circuit',
      url: 'https://www.shortcircuit.co.in',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
