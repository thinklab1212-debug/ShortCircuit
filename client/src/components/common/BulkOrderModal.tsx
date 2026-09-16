import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Plus,
  Trash2,
  Boxes,
  CheckCircle2,
  Mail,
  User,
  FileSpreadsheet,
  UploadCloud,
  Download,
  FileCheck,
  ClipboardPaste,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { useAuthStore } from '@/store'
import { bulkOrderApi } from '@/services'
import type { BulkOrderFormData, BulkOrderItem } from '@/types'

interface BulkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  initialProduct?: string
  initialMode?: 'form' | 'upload'
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 20,
    transition: { duration: 0.15 },
  },
}

/**
 * Intelligent parser for 2D array rows (from XLSX file or CSV)
 */
function parseExcelRows(rawRows: any[][]): BulkOrderItem[] {
  if (!rawRows || rawRows.length === 0) return []

  let headerIndex = -1
  let colMap = {
    name: 0,
    qty: 1,
    price: 2,
    notes: 3,
  }

  // Look for header row in top 4 rows
  for (let r = 0; r < Math.min(4, rawRows.length); r++) {
    const row = rawRows[r]
    if (!Array.isArray(row)) continue

    let foundName = -1
    let foundQty = -1
    let foundPrice = -1
    let foundNotes = -1

    row.forEach((cell, idx) => {
      const val = String(cell || '').toLowerCase().trim()
      if (/product|item|component|part|description|title|name/i.test(val) && foundName === -1) {
        foundName = idx
      } else if (/qty|quantity|count|nos|pcs|units/i.test(val) && foundQty === -1) {
        foundQty = idx
      } else if (/price|target|rate|budget|cost|quote/i.test(val) && foundPrice === -1) {
        foundPrice = idx
      } else if (/note|remark|comment|spec/i.test(val) && foundNotes === -1) {
        foundNotes = idx
      }
    })

    if (foundName !== -1 || foundQty !== -1) {
      headerIndex = r
      colMap = {
        name: foundName !== -1 ? foundName : 0,
        qty: foundQty !== -1 ? foundQty : 1,
        price: foundPrice !== -1 ? foundPrice : 2,
        notes: foundNotes !== -1 ? foundNotes : 3,
      }
      break
    }
  }

  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0
  const result: BulkOrderItem[] = []

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r]
    if (!Array.isArray(row) || row.length === 0) continue

    const productName = String(row[colMap.name] || '').trim()
    if (!productName) continue

    // Parse quantity
    let quantity = 10
    const rawQty = row[colMap.qty]
    if (rawQty !== undefined && rawQty !== null && String(rawQty).trim() !== '') {
      const qNum = parseInt(String(rawQty).replace(/[^0-9]/g, ''), 10)
      if (!isNaN(qNum) && qNum > 0) {
        quantity = qNum
      }
    }

    // Parse price
    let targetPrice: number | undefined = undefined
    const rawPrice = row[colMap.price]
    if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== '') {
      const pNum = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''))
      if (!isNaN(pNum) && pNum >= 0) {
        targetPrice = pNum
      }
    }

    // Parse notes
    let notes: string | undefined = undefined
    const rawNotes = row[colMap.notes]
    if (rawNotes !== undefined && rawNotes !== null && String(rawNotes).trim() !== '') {
      notes = String(rawNotes).trim()
    }

    result.push({
      productName,
      quantity,
      targetPrice,
      notes,
    })
  }

  return result
}

/**
 * Intelligent parser for copy-pasted tab/comma separated text
 */
function parseExcelClipboard(text: string): BulkOrderItem[] {
  if (!text || !text.trim()) return []

  const lines = text.trim().split(/\r?\n/)
  const rawRows: string[][] = lines.map((line) => {
    if (line.includes('\t')) return line.split('\t')
    if (line.includes(',')) return line.split(',')
    if (line.includes(';')) return line.split(';')
    return [line]
  })

  return parseExcelRows(rawRows)
}

/**
 * Generates and downloads a clean Excel template
 */
function downloadExcelTemplate() {
  const data = [
    ['Product / Component Name', 'Quantity', 'Target Price (₹) - Optional', 'Notes / Specs - Optional'],
    ['ESP32-WROOM-32D Development Board', 50, 350, 'Type-C, soldered headers'],
    ['Arduino Uno R3 DIP Microcontroller', 25, 450, 'With USB cable'],
    ['SG90 Micro Servo Motor 9g', 100, 65, 'TowerPro'],
    ['HC-SR04 Ultrasonic Distance Sensor', 40, 75, 'Standard 5V version'],
    ['L298N Dual H-Bridge Motor Driver', 30, 120, 'Heatsink attached'],
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)

  // Column width hints
  ws['!cols'] = [
    { wch: 40 },
    { wch: 12 },
    { wch: 28 },
    { wch: 35 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bulk_Order_BOM')
  XLSX.writeFile(wb, 'ShortCircuit_Bulk_Order_Template.xlsx')
}

export default function BulkOrderModal({
  isOpen,
  onClose,
  initialProduct = '',
  initialMode = 'form',
}: BulkOrderModalProps) {
  const { user } = useAuthStore()

  const [form, setForm] = useState<BulkOrderFormData>({
    name: '',
    email: '',
    phone: '',
    organization: '',
    city: '',
    pincode: '',
    items: [{ productName: '', quantity: 10, targetPrice: undefined, notes: '' }],
    notes: '',
  })

  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    items?: string
  }>({})

  const [loading, setLoading] = useState(false)
  const [successQuoteNumber, setSuccessQuoteNumber] = useState<string | null>(null)

  // Excel / BOM import states
  const [showExcelTools, setShowExcelTools] = useState(false)
  const [excelTab, setExcelTab] = useState<'upload' | 'paste'>('upload')
  const [excelPasteText, setExcelPasteText] = useState('')
  const [parsedFileItems, setParsedFileItems] = useState<BulkOrderItem[]>([])
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isParsingFile, setIsParsingFile] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const parsedClipboardItems = useMemo(() => {
    return parseExcelClipboard(excelPasteText)
  }, [excelPasteText])

  // Reset / pre-fill whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccessQuoteNumber(null)
      setShowExcelTools(initialMode === 'upload')
      setExcelTab(initialMode === 'upload' ? 'upload' : 'upload')
      setParsedFileItems([])
      setUploadedFileName(null)
      setExcelPasteText('')
      setForm({
        name: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        email: user?.email || '',
        phone: user?.phone || '',
        organization: '',
        city: '',
        pincode: '',
        items: [
          {
            productName: initialProduct || '',
            quantity: 10,
            targetPrice: undefined,
            notes: '',
          },
        ],
        notes: '',
      })
      setErrors({})
    }
  }, [isOpen, user, initialProduct, initialMode])

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Process uploaded Excel / CSV file
  const processUploadedFile = async (file: File) => {
    if (!file) return
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validExtensions.includes(fileExt)) {
      toast.error('Please upload a valid Excel (.xlsx, .xls) or CSV file.')
      return
    }

    try {
      setIsParsingFile(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        toast.error('The uploaded file does not contain any sheets.')
        return
      }

      const worksheet = workbook.Sheets[firstSheetName]
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      })

      const items = parseExcelRows(rawRows)

      if (items.length === 0) {
        toast.error('No valid products found. Ensure the file has product names and quantities.')
        return
      }

      setParsedFileItems(items)
      setUploadedFileName(file.name)
      toast.success(`Found ${items.length} products in "${file.name}"! Click 'Replace' or 'Add' to import.`)
    } catch (err) {
      console.error('Failed to parse Excel file:', err)
      toast.error('Failed to read file. Please ensure it is a valid spreadsheet.')
    } finally {
      setIsParsingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const handleApplyImportedItems = (items: BulkOrderItem[], mode: 'replace' | 'append') => {
    if (!items.length) return

    setForm((prev) => {
      if (mode === 'replace') {
        return { ...prev, items }
      }
      const existing = prev.items.filter((it) => it.productName.trim() !== '')
      return { ...prev, items: [...existing, ...items] }
    })

    toast.success(
      mode === 'replace'
        ? `Replaced list with ${items.length} products!`
        : `Added ${items.length} products to your list!`
    )
    setParsedFileItems([])
    setUploadedFileName(null)
    setExcelPasteText('')
    setShowExcelTools(false)
  }

  // Item list handlers
  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productName: '', quantity: 10, targetPrice: undefined, notes: '' },
      ],
    }))
  }

  const handleRemoveItem = (index: number) => {
    if (form.items.length <= 1) return
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (
    index: number,
    field: keyof BulkOrderItem,
    value: any
  ) => {
    setForm((prev) => {
      const updated = [...prev.items]
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      return { ...prev, items: updated }
    })
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: undefined }))
    }
  }

  // Validation
  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!form.name.trim()) newErrors.name = 'Full name is required'
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      const digits = form.phone.replace(/[^0-9]/g, '')
      if (digits.length < 10 || digits.length > 13) {
        newErrors.phone = 'Enter a valid 10-digit phone number'
      }
    }

    const validItems = form.items.filter(
      (it) => it.productName.trim() && it.quantity > 0
    )
    if (validItems.length === 0) {
      newErrors.items = 'Please add at least one product with name and quantity'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const sanitizedItems = form.items
      .filter((it) => it.productName.trim())
      .map((it) => ({
        productName: it.productName.trim(),
        quantity: Number(it.quantity) || 1,
        targetPrice: it.targetPrice ? Number(it.targetPrice) : undefined,
        notes: it.notes?.trim() || undefined,
      }))

    try {
      setLoading(true)
      const res = await bulkOrderApi.submitQuoteRequest({
        ...form,
        items: sanitizedItems,
      })

      if (res.data.success && res.data.data) {
        setSuccessQuoteNumber(res.data.data.quoteNumber)
        toast.success('Your bulk order request has been submitted!')
      } else {
        toast.error(res.data.message || 'Failed to submit quote request.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error submitting quote request.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-6 py-5 text-white shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">
                    B2B & Institutional
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-[11px] font-medium text-emerald-400">
                    GST Invoice Available
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-heading font-bold text-white">
                  Request Bulk Order Quotation
                </h3>
              </div>
            </div>
            <p className="text-xs text-white/70 mt-2 max-w-lg leading-relaxed">
              Order development boards, sensors, and robotics hardware in bulk. Upload your BOM spreadsheet or specify parts below for a manual wholesale quotation.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {successQuoteNumber ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-xl font-heading font-bold text-foreground">
                    Quotation Request Received!
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Your inquiry has been assigned reference ID:
                  </p>
                  <span className="inline-block mt-2 font-mono font-bold text-lg text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-xl">
                    {successQuoteNumber}
                  </span>
                </div>

                <div className="bg-muted/40 border border-border rounded-xl p-4 text-xs text-muted-foreground text-left max-w-md mx-auto space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-primary" /> What happens next?
                  </p>
                  <p>
                    1. Our sales and procurement team will calculate volume discounts and availability for your components.
                  </p>
                  <p>
                    2. You will receive an official quotation via email within 24 business hours.
                  </p>
                </div>

                <div className="pt-3">
                  <Button onClick={onClose} className="px-6">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Contact Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> 1. Contact & Delivery Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormField label="Full Name" required error={errors.name}>
                      <Input
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value })
                          if (errors.name) setErrors({ ...errors, name: undefined })
                        }}
                      />
                    </FormField>

                    <FormField label="Email Address" required error={errors.email}>
                      <Input
                        type="email"
                        placeholder="name@college.edu / name@company.com"
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value })
                          if (errors.email) setErrors({ ...errors, email: undefined })
                        }}
                      />
                    </FormField>

                    <FormField label="Phone Number" required error={errors.phone}>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => {
                          setForm({ ...form, phone: e.target.value })
                          if (errors.phone) setErrors({ ...errors, phone: undefined })
                        }}
                      />
                    </FormField>

                    <FormField label="Organization / College / Lab">
                      <Input
                        placeholder="e.g. IIT Delhi Robotics Club / XYZ Tech"
                        value={form.organization || ''}
                        onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Delivery City">
                      <Input
                        placeholder="e.g. Bengaluru, Pune, Delhi"
                        value={form.city || ''}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Pincode">
                      <Input
                        placeholder="e.g. 560001"
                        maxLength={10}
                        value={form.pincode || ''}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      />
                    </FormField>
                  </div>
                </div>

                {/* 2. Products Section & Excel Import */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5" /> 2. Required Products & Quantities
                      </h4>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({form.items.length} {form.items.length === 1 ? 'item' : 'items'})
                      </span>
                    </div>

                    {/* Button to toggle Excel tools */}
                    <button
                      type="button"
                      onClick={() => setShowExcelTools(!showExcelTools)}
                      className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer w-fit"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      <span>{showExcelTools ? 'Hide Excel Tools' : '📊 Upload or Paste Excel / BOM'}</span>
                    </button>
                  </div>

                  {/* Excel Import Panel */}
                  {showExcelTools && (
                    <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.04] p-4 sm:p-5 space-y-4">
                      {/* Top Bar with Tabs and Download Template */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
                        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
                          <button
                            type="button"
                            onClick={() => setExcelTab('upload')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              excelTab === 'upload'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <UploadCloud className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Upload Excel / CSV File</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExcelTab('paste')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              excelTab === 'paste'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <ClipboardPaste className="h-3.5 w-3.5 text-blue-500" />
                            <span>Paste Table</span>
                          </button>
                        </div>

                        {/* Sample template download button */}
                        <button
                          type="button"
                          onClick={downloadExcelTemplate}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors w-fit"
                        >
                          <Download className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Download Sample Template (.xlsx)</span>
                        </button>
                      </div>

                      {/* Tab 1: File Upload Area */}
                      {excelTab === 'upload' && (
                        <div className="space-y-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className="hidden"
                          />

                          <div
                            onDragOver={(e) => {
                              e.preventDefault()
                              setIsDragging(true)
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${
                              isDragging
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-emerald-500/30 hover:border-emerald-500/50 bg-card/60'
                            }`}
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-2">
                              {isParsingFile ? (
                                <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                              ) : (
                                <UploadCloud className="h-6 w-6" />
                              )}
                            </div>

                            <p className="text-xs font-semibold text-foreground">
                              {isParsingFile
                                ? 'Reading & parsing spreadsheet...'
                                : 'Click to browse or drag & drop your Excel file here'}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> spreadsheets
                            </p>
                          </div>

                          {/* Detected File Result */}
                          {uploadedFileName && parsedFileItems.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-card border border-emerald-500/40 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <FileCheck className="h-4 w-4 text-emerald-500" />
                                  <span>{uploadedFileName}</span>
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  {parsedFileItems.length} products found
                                </span>
                              </div>

                              <div className="text-[11px] text-muted-foreground line-clamp-1">
                                Preview: {parsedFileItems.slice(0, 3).map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                                {parsedFileItems.length > 3 ? ` + ${parsedFileItems.length - 3} more` : ''}
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleApplyImportedItems(parsedFileItems, 'replace')}
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Load File (Replace List)
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApplyImportedItems(parsedFileItems, 'append')}
                                  className="h-8 text-xs"
                                >
                                  Add to Existing (+{parsedFileItems.length})
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 2: Copy & Paste Text Area */}
                      {excelTab === 'paste' && (
                        <div className="space-y-3">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Copy cells from Excel or Google Sheets and paste them below. Supported columns: <strong>Product Name</strong> | <strong>Quantity</strong> | <strong>Target Price</strong> | <strong>Notes</strong>.
                          </p>

                          <Textarea
                            rows={4}
                            placeholder={`ESP32-WROOM-32D\t25\t350\tWith soldered headers\nArduino Uno R3\t50\t450\nSG90 Servo Motor\t100\t65\tTowerPro`}
                            value={excelPasteText}
                            onChange={(e) => setExcelPasteText(e.target.value)}
                            className="font-mono text-xs"
                          />

                          {parsedClipboardItems.length > 0 ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-card p-3 rounded-xl border border-emerald-500/30">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" />
                                Detected {parsedClipboardItems.length} valid {parsedClipboardItems.length === 1 ? 'item' : 'items'}
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleApplyImportedItems(parsedClipboardItems, 'replace')}
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Replace List
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApplyImportedItems(parsedClipboardItems, 'append')}
                                  className="h-8 text-xs"
                                >
                                  Append (+{parsedClipboardItems.length})
                                </Button>
                              </div>
                            </div>
                          ) : excelPasteText.trim() ? (
                            <p className="text-xs text-amber-500 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" /> No recognizable product rows found. Please check columns.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.items && (
                    <p className="text-xs text-error-500 font-medium bg-error-500/10 px-3 py-1.5 rounded-lg">
                      {errors.items}
                    </p>
                  )}

                  {/* Product Rows List */}
                  <div className="space-y-3">
                    {form.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border bg-card/50 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Item #{idx + 1}
                          </span>
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-muted-foreground hover:text-error-500 p-1 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-7">
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                              Product Name / Part # / Description *
                            </label>
                            <Input
                              placeholder="e.g. ESP32-WROOM-32D Development Board"
                              value={item.productName}
                              onChange={(e) =>
                                handleItemChange(idx, 'productName', e.target.value)
                              }
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                              Quantity *
                            </label>
                            <Input
                              type="number"
                              min={1}
                              placeholder="10"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  'quantity',
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                              Target Price (₹) <span className="text-muted-foreground/60">(optional)</span>
                            </label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="e.g. 350"
                              value={item.targetPrice || ''}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  'targetPrice',
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                            />
                          </div>

                          <div className="sm:col-span-12">
                            <Input
                              placeholder="Specific requirements (e.g. soldered pin headers, 5V version, bulk packaging)"
                              value={item.notes || ''}
                              onChange={(e) =>
                                handleItemChange(idx, 'notes', e.target.value)
                              }
                              className="text-xs h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="w-full border-dashed"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Another Product Row
                  </Button>
                </div>

                {/* 3. Additional Requirements / Notes */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    3. Additional Instructions or Quotation Notes
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Need GST input invoice with our company GSTIN; required delivery date by next Friday for college hackathon..."
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                {/* Footer Submit Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center sm:text-left">
                    Our sales team manually prepares and sends the official quote to your email.
                  </p>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="w-1/2 sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      className="w-1/2 sm:w-auto shadow-md"
                      leftIcon={<Send className="h-4 w-4" />}
                    >
                      Submit RFQ
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
