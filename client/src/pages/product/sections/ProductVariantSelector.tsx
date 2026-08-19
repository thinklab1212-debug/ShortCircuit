import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, SlidersHorizontal, Table, ShoppingCart, Info, FileText } from 'lucide-react'
import { variantApi } from '@/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/utils'
import type { AttributeDefinition, LinkedProductVariant, Product } from '@/types'

interface ProductVariantSelectorProps {
  product: Product
  onVariantSelect: (variant: LinkedProductVariant | null) => void
  onAddToCartVariant?: (variantId: string, quantity: number) => void
}

export default function ProductVariantSelector({
  product,
  onVariantSelect,
  onAddToCartVariant,
}: ProductVariantSelectorProps) {
  const [viewMode, setViewMode] = useState<'pills' | 'table'>('pills')
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})

  // Category attribute definitions from populated category
  const categoryDefs: AttributeDefinition[] =
    typeof product.category === 'object' && product.category?.attributeDefinitions
      ? product.category.attributeDefinitions
      : []

  // Fetch linked variants for this product family
  const { data: variantData, isLoading } = useQuery({
    queryKey: ['product-variants-public', product._id],
    queryFn: () => variantApi.getByProduct(product._id, { limit: 100 }).then((res) => res.data.data),
    enabled: Boolean(product._id),
  })

  const variants = useMemo(() => variantData ?? [], [variantData])

  // Extract unique options for each attribute key present in variants
  const attributeOptionsMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    variants.forEach((v) => {
      Object.entries(v.attributes || {}).forEach(([key, val]) => {
        if (!map[key]) map[key] = []
        if (!map[key].includes(val)) map[key].push(val)
      })
    })
    return map
  }, [variants])

  // Auto-select first variant on load if nothing selected
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedAttributes).length === 0) {
      const firstVariant = variants[0]
      setSelectedAttributes(firstVariant.attributes || {})
      onVariantSelect(firstVariant)
    }
  }, [variants, selectedAttributes, onVariantSelect])

  // Find exact matching variant based on selected attributes
  const matchedVariant = useMemo(() => {
    if (variants.length === 0) return null
    return (
      variants.find((v) => {
        return Object.entries(selectedAttributes).every(
          ([key, val]) => v.attributes?.[key] === val
        )
      }) || null
    )
  }, [variants, selectedAttributes])

  // Notify parent of variant match
  const handleSelectAttribute = (key: string, value: string) => {
    const updated = { ...selectedAttributes, [key]: value }
    setSelectedAttributes(updated)

    const match =
      variants.find((v) =>
        Object.entries(updated).every(([k, val]) => v.attributes?.[k] === val)
      ) || null

    onVariantSelect(match)
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 rounded-2xl border border-border bg-card/50 animate-pulse">
        <div className="h-4 w-32 skeleton rounded" />
        <div className="h-10 w-full skeleton rounded-xl" />
      </div>
    )
  }

  if (variants.length === 0) {
    return null
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Top Header & View Toggle */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-accent-500" />
          <span className="text-sm font-semibold text-foreground">
            Select Specifications ({variants.length} options available)
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setViewMode('pills')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'pills'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" /> Options
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Table className="h-3 w-3" /> Spec Table
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: Interactive Spec Pills */}
      {viewMode === 'pills' && (
        <div className="space-y-4">
          {Object.entries(attributeOptionsMap).map(([attrKey, options]) => {
            const def = categoryDefs.find((d) => d.key === attrKey)
            const label = def?.label || attrKey.replace(/_/g, ' ')
            const unit = def?.unit ? ` (${def.unit})` : ''

            return (
              <div key={attrKey} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="capitalize">{label}{unit}</span>
                  {selectedAttributes[attrKey] && (
                    <span className="font-semibold text-foreground">{selectedAttributes[attrKey]}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {options.map((optionVal) => {
                    const isSelected = selectedAttributes[attrKey] === optionVal

                    return (
                      <button
                        key={optionVal}
                        type="button"
                        onClick={() => handleSelectAttribute(attrKey, optionVal)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'border-accent-500 bg-accent-500/10 text-accent-500 ring-2 ring-accent-500/20'
                            : 'border-border bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-accent-500" />}
                        {optionVal}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Selected Variant Summary Card */}
          {matchedVariant ? (
            <div className="rounded-xl border border-accent-500/30 bg-accent-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Selected SKU</span>
                  <div className="text-sm font-bold text-foreground font-mono">{matchedVariant.sku}</div>
                  {matchedVariant.mpn && (
                    <div className="text-xs text-muted-foreground">MPN: {matchedVariant.mpn}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {formatPrice(matchedVariant.salePrice ?? matchedVariant.price)}
                  </div>
                  {matchedVariant.stock > 0 ? (
                    <Badge variant="outline" className="border-success-500/50 text-success-500 text-xs">
                      {matchedVariant.stock} in stock
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                  )}
                </div>
              </div>

              {matchedVariant.datasheetUrl && (
                <a
                  href={matchedVariant.datasheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent-500 hover:underline pt-1"
                >
                  <FileText className="h-3.5 w-3.5" /> View Component Datasheet (PDF) →
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-xs text-warning-400 flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              No variant exists matching this exact combination. Please select different options.
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: Distributor Spec Grid Table */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold uppercase text-muted-foreground">
                <th className="p-2.5">SKU / MPN</th>
                <th className="p-2.5">Specifications</th>
                <th className="p-2.5">Price</th>
                <th className="p-2.5">Stock</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v) => {
                const isSelected = matchedVariant?._id === v._id

                return (
                  <tr
                    key={v._id}
                    className={`transition-colors ${
                      isSelected ? 'bg-accent-500/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="p-2.5 font-mono font-medium text-foreground">
                      <div>{v.sku}</div>
                      {v.mpn && <div className="text-[10px] text-muted-foreground">MPN: {v.mpn}</div>}
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.attributes || {}).map(([k, val]) => (
                          <Badge key={k} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {k}: {val}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-2.5 font-semibold text-foreground">
                      {formatPrice(v.salePrice ?? v.price)}
                    </td>
                    <td className="p-2.5">
                      <span className={v.stock > 0 ? 'text-success-500 font-medium' : 'text-error-500'}>
                        {v.stock > 0 ? `${v.stock} avail` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <Button
                        size="sm"
                        disabled={v.stock <= 0}
                        onClick={() => {
                          onVariantSelect(v)
                          onAddToCartVariant?.(v._id, 1)
                        }}
                        leftIcon={<ShoppingCart className="h-3 w-3" />}
                      >
                        Add
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
