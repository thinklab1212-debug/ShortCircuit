import React, { useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Zap,
  Info
} from 'lucide-react'
import { useProjectKit, useProjectBom, useAddKitToCart } from '@/hooks/useProjectKits'
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import toast from 'react-hot-toast'

// Difficulty colors
const difficultyVariants: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
}

// Helper to render simple markdown formatting
function renderSimpleMarkdown(text: string) {
  if (!text) return null
  return text.split('\n\n').map((paragraph, idx) => {
    if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
      const items = paragraph.split('\n').map((item) => item.replace(/^[-*]\s+/, ''))
      return (
        <ul key={idx} className="list-disc pl-5 mb-4 space-y-2 text-muted-foreground text-sm">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInlineStyles(item)}</li>
          ))}
        </ul>
      )
    }
    return (
      <p key={idx} className="mb-4 leading-relaxed text-muted-foreground text-sm">
        {renderInlineStyles(paragraph)}
      </p>
    )
  })
}

function renderInlineStyles(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-muted text-primary px-1.5 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// ─── Zoomable/Pannable Wiring Diagram Viewer Component ───────────────────────
interface ZoomableWiringProps {
  imageUrl: string
  title?: string
  description?: string
}

function ZoomableWiring({ imageUrl, title, description }: ZoomableWiringProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleZoomIn = () => setScale((s) => Math.min(4, s + 0.25))
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.25))
  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15
    setScale((s) => Math.min(4, Math.max(0.5, s + zoomFactor)))
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div className="relative border border-border rounded-3xl overflow-hidden bg-zinc-950 h-[480px] select-none shadow-inner">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-1 bg-background/80 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow">
        <Button size="icon-sm" variant="ghost" onClick={handleZoomIn} title="Zoom In" className="h-8 w-8 font-bold">+</Button>
        <Button size="icon-sm" variant="ghost" onClick={handleZoomOut} title="Zoom Out" className="h-8 w-8 font-bold">-</Button>
        <Button size="icon-sm" variant="ghost" onClick={handleReset} title="Reset" className="h-8 w-8">↻</Button>
      </div>

      {/* Helper tooltip */}
      <div className="absolute top-4 left-4 z-10 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
        💡 Use Scroll Wheel to Zoom & Drag to Pan
      </div>

      {/* Viewer workspace */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt={title || 'Wiring diagram'}
          draggable="false"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            maxHeight: '90%',
            maxWidth: '90%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Caption footer overlay */}
      {(title || description) && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
          {title && <h4 className="font-bold text-sm text-foreground">{title}</h4>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Main Detail Page ────────────────────────────────────────────────────────
export default function ProjectKitDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'components' | 'instructions' | 'wiring' | 'documents'>('components')

  // Selected wiring diagram index
  const [activeWiringIndex, setActiveWiringIndex] = useState(0)

  // Fetch data
  const { data: project, isLoading, isError } = useProjectKit(slug || '')
  const { data: bomData, isLoading: isLoadingBom } = useProjectBom(slug || '')
  const addToCartMutation = useAddKitToCart()

  // SEO document metadata
  useDocumentMetadata(
    project ? `${project.name} — ElectroKart` : 'Project Builder details',
    project?.shortDescription || 'View detailed schematics, instructions and BOM items for this project.'
  )

  const handleAddFullKit = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add components to cart.')
      return
    }
    if (project) {
      addToCartMutation.mutate(project._id)
    }
  }

  if (isLoading || isLoadingBom) {
    return (
      <div className="min-h-screen bg-gradient-mesh py-12 flex justify-center items-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-muted-foreground text-sm font-semibold">Loading build details & live prices...</p>
        </div>
      </div>
    )
  }

  if (isError || !project || !bomData) {
    return (
      <div className="min-h-screen bg-gradient-mesh py-12 px-6">
        <div className="max-w-md mx-auto text-center glass rounded-3xl p-8 border border-border">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Project Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The project kit might have been deactivated or removed by our admins.
          </p>
          <Button asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-6">
          <Link to="/projects" className="hover:text-primary transition-colors flex items-center gap-1">
            Projects
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{project.name}</span>
        </div>

        {/* Project Header Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Main Title Section */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant={difficultyVariants[project.difficulty] || 'default'} className="capitalize">
                {project.difficulty}
              </Badge>
              <Badge variant="secondary">{project.applicationArea}</Badge>
              {project.estimatedTime && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {project.estimatedTime}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">
              {project.name}
            </h1>
            <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Large Aspect-Video Image */}
          <div className="lg:col-span-4 aspect-video rounded-3xl overflow-hidden shadow-lg border border-border">
            <img src={project.coverImage.url} alt={project.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Tab Selection Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Tab Navigation + Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex border-b border-border overflow-x-auto no-scrollbar gap-6">
              {[
                { id: 'components', label: '📋 Components BOM', icon: Layers },
                { id: 'instructions', label: '📖 Build Guide', icon: BookOpen },
                { id: 'wiring', label: '⚡ Wiring Diagram', icon: Zap },
                { id: 'documents', label: '📄 Documents', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Tabs */}
            <div className="glass rounded-3xl p-6 sm:p-8 shadow border border-border">
              {/* Tab 1: BOM Components */}
              {activeTab === 'components' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Bill of Materials (BOM)</h3>
                    <p className="text-xs text-muted-foreground">
                      Complete list of verified components required for assembly.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold">
                          <th className="pb-3 pr-4">Item Name</th>
                          <th className="pb-3 px-4 text-center">Qty</th>
                          <th className="pb-3 px-4 text-right">Unit Price</th>
                          <th className="pb-3 px-4 text-right">Subtotal</th>
                          <th className="pb-3 pl-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {bomData.components.map((comp) => {
                          const product = comp.product

                          return (
                            <tr key={comp._id} className="group hover:bg-muted/30 transition-colors">
                              <td className="py-4 pr-4">
                                <div className="font-semibold text-foreground">
                                  {product ? (
                                    <Link
                                      to={`/products/${product.slug}`}
                                      className="hover:text-primary hover:underline transition-all flex items-center gap-1.5"
                                    >
                                      {product.name}
                                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                  ) : (
                                    'Unknown Product'
                                  )}
                                </div>
                                {comp.note && <p className="text-xs text-muted-foreground mt-0.5">ℹ️ {comp.note}</p>}
                                {comp.isOptional && (
                                  <Badge variant="outline" className="mt-1 text-[9px] py-0 px-1.5 font-bold">
                                    Optional / Upgrade
                                  </Badge>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center font-bold">{comp.quantity}</td>
                              <td className="py-4 px-4 text-right font-medium">
                                <PriceDisplay price={comp.effectivePrice} />
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-foreground">
                                <PriceDisplay price={comp.subtotal} />
                              </td>
                              <td className="py-4 pl-4 text-center">
                                <Badge variant={comp.inStock ? 'success' : 'destructive'} size="sm">
                                  {comp.inStock ? 'In Stock' : 'Out of Stock'}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Instruction Steps */}
              {activeTab === 'instructions' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Step-by-Step Instructions</h3>
                    <p className="text-xs text-muted-foreground">
                      Follow these build steps to compile your project.
                    </p>
                  </div>

                  {project.instructions && project.instructions.length > 0 ? (
                    <div className="relative border-l-2 border-border/80 pl-6 ml-4 space-y-10">
                      {project.instructions
                        .sort((a, b) => a.stepNumber - b.stepNumber)
                        .map((step, index) => (
                          <div key={index} className="relative">
                            {/* Step number circle badge */}
                            <span className="absolute -left-10 top-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow">
                              {step.stepNumber}
                            </span>

                            <h4 className="text-lg font-bold text-foreground mb-3">{step.title}</h4>

                            {step.imageUrl && (
                              <div className="mb-4 rounded-2xl overflow-hidden max-w-lg border border-border shadow-sm">
                                <img
                                  src={step.imageUrl}
                                  alt={`Step ${step.stepNumber}`}
                                  className="w-full object-cover max-h-[300px]"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            <div className="prose dark:prose-invert max-w-none">
                              {renderSimpleMarkdown(step.content)}
                            </div>

                            {step.tip && (
                              <div className="mt-4 flex gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                  <h5 className="font-bold text-xs text-amber-800 dark:text-amber-400">Pro Tip</h5>
                                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{step.tip}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                      <p className="text-sm text-muted-foreground">No instructions added for this project yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Wiring Diagrams */}
              {activeTab === 'wiring' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Wiring Schematic</h3>
                    <p className="text-xs text-muted-foreground">
                      Use the zoomable panel to inspect details of our circuit connection schema.
                    </p>
                  </div>

                  {project.wiringDiagrams && project.wiringDiagrams.length > 0 ? (
                    <div className="space-y-4">
                      {/* Interactive Viewer */}
                      <ZoomableWiring
                        imageUrl={project.wiringDiagrams[activeWiringIndex].imageUrl}
                        title={project.wiringDiagrams[activeWiringIndex].title}
                        description={project.wiringDiagrams[activeWiringIndex].description}
                      />

                      {/* Thumbnail strip selection */}
                      {project.wiringDiagrams.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {project.wiringDiagrams.map((diag, index) => (
                            <button
                              key={index}
                              onClick={() => setActiveWiringIndex(index)}
                              className={`h-16 w-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                                activeWiringIndex === index ? 'border-primary' : 'border-border'
                              }`}
                            >
                              <img src={diag.imageUrl} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                      <p className="text-sm text-muted-foreground">No wiring diagrams provided for this project.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: External Documents */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Reference Documents</h3>
                    <p className="text-xs text-muted-foreground">
                      Datasheets, class reports, and complete project code files uploaded on Google Drive.
                    </p>
                  </div>

                  {project.documents && project.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 bg-card hover:bg-muted/40 transition-all group shadow-sm hover:shadow"
                        >
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {doc.title}
                            </h4>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                              {doc.type || 'Datasheet'}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                      <p className="text-sm text-muted-foreground">No external files linked for reference.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sticky Summary Sidebar Panel */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="glass rounded-3xl p-6 shadow-xl border border-border">
              <h3 className="text-lg font-bold mb-4">Kit Cost Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Standard Retail Price (MRP)</span>
                  <span className="line-through">
                    <PriceDisplay price={bomData.summary.totalMrp} />
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Bundled Savings</span>
                  <span className="text-success-600 dark:text-success-400 font-semibold">
                    - <PriceDisplay price={bomData.summary.savings} />
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-foreground">Total Kit Price</span>
                  <span className="text-2xl font-extrabold text-foreground">
                    <PriceDisplay price={bomData.summary.totalPrice} />
                  </span>
                </div>
              </div>

              {/* Stock Warning Box */}
              <div
                className={`flex gap-3 p-4 rounded-2xl border mb-6 ${
                  bomData.summary.allInStock
                    ? 'bg-success-50/50 dark:bg-success-950/10 border-success-200 dark:border-success-900/50 text-success-800 dark:text-success-400'
                    : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400'
                }`}
              >
                {bomData.summary.allInStock ? (
                  <>
                    <CheckCircle className="h-5 w-5 shrink-0 text-success-500" />
                    <div>
                      <h4 className="font-bold text-xs">All Components Available</h4>
                      <p className="text-[10px] opacity-80 mt-0.5">Everything is in stock and ready to ship.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-xs">{bomData.summary.outOfStockCount} Item(s) Unavailable</h4>
                      <p className="text-[10px] opacity-80 mt-0.5">
                        Required components are missing. Skip them or order standard parts separately.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Add Kit to Cart Action */}
              <Button
                onClick={handleAddFullKit}
                className="w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold flex items-center justify-center gap-2 text-sm shadow transition-all duration-300"
                disabled={addToCartMutation.isPending}
                loading={addToCartMutation.isPending}
                loadingText="Processing Kit..."
              >
                <ShoppingBag className="h-4 w-4" />
                Add Full Kit to Cart
              </Button>

              {!isAuthenticated && (
                <p className="text-center text-[10px] text-muted-foreground mt-3">
                  Please <Link to="/login" className="underline hover:text-primary transition-all">login</Link> to build kit orders.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
