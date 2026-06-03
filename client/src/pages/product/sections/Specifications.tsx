import type { ProductSpecification } from '@/types'

// ─── Specifications Table ───────────────────────────────────────────────────────

interface SpecificationsProps {
  specifications: ProductSpecification[]
  features: string[]
}

export default function Specifications({ specifications, features }: SpecificationsProps) {
  if (specifications.length === 0 && features.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-heading text-foreground">
        Technical Specifications
      </h2>

      {/* Specs Table */}
      {specifications.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-border">
              {specifications.map((spec, i) => (
                <tr
                  key={spec.key}
                  className={i % 2 === 0 ? 'bg-muted/20' : 'bg-background'}
                >
                  <td className="px-4 py-3 text-sm font-medium text-muted-foreground w-1/3 sm:w-2/5">
                    {spec.key}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Key Features</h3>
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
