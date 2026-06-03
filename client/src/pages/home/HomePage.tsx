import { useFeaturedProducts, useBestSellers, useNewArrivals } from '@/hooks/useHomeData'
import {
  HeroBanner,
  CategoryShowcase,
  ProductSection,
  PopularBrands,
  PromoBanners,
  WhyChooseUs,
  Newsletter,
  FooterCTA,
} from './sections'

// ─── Home Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const featured = useFeaturedProducts()
  const bestSellers = useBestSellers()
  const newArrivals = useNewArrivals()

  return (
    <>
      {/* 1. Hero Banner Carousel */}
      <HeroBanner />

      {/* 2. Category Showcase */}
      <CategoryShowcase />

      {/* 3. Featured Products */}
      <ProductSection
        title="Featured Products"
        subtitle="Handpicked electronics you'll love"
        link="/shop?featured=true"
        linkText="See All Featured"
        products={featured.data}
        isLoading={featured.isLoading}
        isError={featured.isError}
      />

      {/* 4. Promotional Banners */}
      <PromoBanners />

      {/* 5. Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Our most popular products this month"
        link="/shop?sort=-sold"
        linkText="View Best Sellers"
        products={bestSellers.data}
        isLoading={bestSellers.isLoading}
        isError={bestSellers.isError}
      />

      {/* 6. Popular Brands */}
      <PopularBrands />

      {/* 7. New Arrivals */}
      <ProductSection
        title="New Arrivals"
        subtitle="The latest additions to our collection"
        link="/shop?sort=-createdAt"
        linkText="View New Arrivals"
        products={newArrivals.data}
        isLoading={newArrivals.isLoading}
        isError={newArrivals.isError}
      />

      {/* 8. Why Choose Short Circuit */}
      <WhyChooseUs />

      {/* 9. Newsletter */}
      <Newsletter />

      {/* 10. Footer CTA */}
      <FooterCTA />
    </>
  )
}
