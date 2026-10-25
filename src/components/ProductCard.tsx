import { Link } from 'react-router'
import type { ProductCard as Product } from '../api/types'
import { discountPercent, formatRupees, packSize } from '../lib/format'
import { ProductImage } from './ProductImage'

export function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product)
  return (
    <Link
      to={`/product/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="relative aspect-[6/5]">
        <ProductImage url={product.imageUrl} label={product.brand ?? product.name} className="h-full w-full" />
        {discount !== null && (
          <span className="absolute top-2 left-2 rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-white">{discount}% OFF</span>
        )}
        {product.badge && (
          <span className="absolute top-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">{product.badge}</span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded bg-black/80 px-2 py-0.5 text-xs font-bold text-white">Out of stock</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {product.brand && <span className="truncate text-[11px] font-semibold tracking-wide text-brand uppercase">{product.brand}</span>}
        <span className="line-clamp-2 text-sm font-medium group-hover:text-brand">{product.name}</span>
        <span className="text-xs text-slate-500">{packSize(product.unitVolumeMl, product.unitsPerCase)}</span>
        <span className="mt-auto pt-2">
          <span className="font-semibold">{formatRupees(product.price)}/case</span>
          {discount !== null && product.originalPrice !== null && (
            <span className="ml-1.5 text-xs text-slate-500 line-through">{formatRupees(product.originalPrice)}</span>
          )}
        </span>
        {product.lowestPrice < product.price && (
          <span className="text-xs font-semibold text-green-700">as low as {formatRupees(product.lowestPrice)}</span>
        )}
      </div>
    </Link>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
