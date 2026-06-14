// ============================================================================
// ElectroKart — Invoice Settings Page (Admin)
// ============================================================================
// Allows administrators to customize invoicing headers, tax settings, stamp
// and logo assets, and download instant preview PDFs.
// ============================================================================

import { useEffect, useState, useRef } from 'react'
import { Image as ImageIcon, Download, Loader2 } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { orderApi, uploadApi } from '@/services'
import { toast } from 'sonner'

export default function InvoiceSettingsPage() {
  const [settings, setSettings] = useState<any>({
    companyName: 'EngineersBuy Instruments',
    gstin: '29AAAAA0000A1Z5',
    businessAddress: '102 Maker Space Hub, Science City Block, Bangalore, Karnataka - 560001',
    contactNumber: '+91 80 1234 5678',
    supportEmail: 'billing@electrokart.com',
    companyLogo: '',
    companyStamp: '',
    invoicePrefix: 'SC',
    startingInvoiceNumber: 1,
    autoIncrementInvoiceNumber: true,
    currencySymbol: '₹',
    footerMessage: 'This is a computer-generated invoice.',
    gstPercentage: 18,
    cgstPercentage: 9,
    sgstPercentage: 9,
    igstPercentage: 18,
    allowOnlyDeliveredAndPaid: true,
    isInvoiceEnabled: true,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [logoUploading, setLogoUploading] = useState(false)
  const [stampUploading, setStampUploading] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const stampInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await orderApi.getInvoiceSettings()
      if (res.data?.data) {
        setSettings(res.data.data)
      }
    } catch {
      toast.error('Failed to load invoice settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await orderApi.updateInvoiceSettings(settings)
      toast.success('Invoice settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const res = await uploadApi.image(file)
      if (res.data?.data?.url) {
        handleFieldChange('companyLogo', res.data.data.url)
        toast.success('Logo uploaded successfully')
      }
    } catch {
      toast.error('Logo upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleUploadStamp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStampUploading(true)
    try {
      const res = await uploadApi.image(file)
      if (res.data?.data?.url) {
        handleFieldChange('companyStamp', res.data.data.url)
        toast.success('Stamp uploaded successfully')
      }
    } catch {
      toast.error('Stamp upload failed')
    } finally {
      setStampUploading(false)
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const response = await orderApi.getInvoicePreview()
      // response.data will be a Blob because responseType was 'blob'
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Invoice-Preview.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Invoice preview downloaded successfully')
    } catch {
      toast.error('Failed to generate preview invoice')
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Invoice Settings"
        description="Configure dynamic headers, branding assets, tax parameters, and download permissions."
        action={
          <Button
            onClick={handlePreview}
            loading={previewLoading}
            leftIcon={<Download />}
            variant="outline"
          >
            Preview Invoice
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Business Information</CardTitle>
              <CardDescription>Setup seller company name, address, and contacts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Company Name" required>
                <Input
                  value={settings.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  required
                />
              </FormField>
              
              <FormField label="GSTIN" required>
                <Input
                  value={settings.gstin}
                  onChange={(e) => handleFieldChange('gstin', e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Business Address" required>
                <Input
                  value={settings.businessAddress}
                  onChange={(e) => handleFieldChange('businessAddress', e.target.value)}
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Contact Number" required>
                  <Input
                    value={settings.contactNumber}
                    onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Support Email" required>
                  <Input
                    value={settings.supportEmail}
                    onChange={(e) => handleFieldChange('supportEmail', e.target.value)}
                    type="email"
                    required
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Brand Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Brand Assets</CardTitle>
              <CardDescription>Upload transparent logo and authorized stamp images.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleUploadLogo}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      Change Logo
                    </Button>
                    <p className="mt-1 text-[11px] text-muted-foreground">JPEG, PNG, or WEBP. Max 5MB.</p>
                  </div>
                </div>
              </div>

              {/* Stamp Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Stamp</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
                    {settings.companyStamp ? (
                      <img src={settings.companyStamp} alt="Stamp" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={stampInputRef}
                      onChange={handleUploadStamp}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={stampUploading}
                      onClick={() => stampInputRef.current?.click()}
                    >
                      Change Stamp
                    </Button>
                    <p className="mt-1 text-[11px] text-muted-foreground">Supports transparent background PNG. Max 5MB.</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Invoice Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Invoice Preferences</CardTitle>
              <CardDescription>Setup invoice format, starting count, and labels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Invoice Prefix" required>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => handleFieldChange('invoicePrefix', e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Starting Invoice Number" required>
                  <Input
                    value={settings.startingInvoiceNumber}
                    onChange={(e) => handleFieldChange('startingInvoiceNumber', parseInt(e.target.value) || 1)}
                    type="number"
                    min="1"
                    required
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Currency Symbol" required>
                  <Input
                    value={settings.currencySymbol}
                    onChange={(e) => handleFieldChange('currencySymbol', e.target.value)}
                    required
                  />
                </FormField>
                <div className="flex items-end pb-3">
                  <Checkbox
                    label="Auto Increment Invoice Number"
                    description="Automatically increment sequence counts"
                    checked={settings.autoIncrementInvoiceNumber}
                    onChange={(e) => handleFieldChange('autoIncrementInvoiceNumber', e.target.checked)}
                  />
                </div>
              </div>

              <FormField label="Footer Message" required>
                <Input
                  value={settings.footerMessage}
                  onChange={(e) => handleFieldChange('footerMessage', e.target.value)}
                  required
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tax Settings</CardTitle>
              <CardDescription>Setup default taxation brackets (percentage rates).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Total GST Rate (%)" required>
                <Input
                  value={settings.gstPercentage}
                  onChange={(e) => handleFieldChange('gstPercentage', parseFloat(e.target.value) || 0)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </FormField>
              <FormField label="CGST Rate (%)" required>
                <Input
                  value={settings.cgstPercentage}
                  onChange={(e) => handleFieldChange('cgstPercentage', parseFloat(e.target.value) || 0)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </FormField>
              <FormField label="SGST Rate (%)" required>
                <Input
                  value={settings.sgstPercentage}
                  onChange={(e) => handleFieldChange('sgstPercentage', parseFloat(e.target.value) || 0)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </FormField>
              <FormField label="IGST Rate (%)" required>
                <Input
                  value={settings.igstPercentage}
                  onChange={(e) => handleFieldChange('igstPercentage', parseFloat(e.target.value) || 0)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </FormField>
            </CardContent>
          </Card>
        </div>

        {/* Rules & Save */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Invoicing Rules & Permissions</CardTitle>
            <CardDescription>Manage user permissions and switch capabilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
              <div className="space-y-3">
                <Checkbox
                  label="Allow Invoice Download Only After Delivery + Payment"
                  description="Block invoice retrieval for pending, shipped, or unpaid status"
                  checked={settings.allowOnlyDeliveredAndPaid}
                  onChange={(e) => handleFieldChange('allowOnlyDeliveredAndPaid', e.target.checked)}
                />
                
                <Checkbox
                  label="Enable Invoice Downloads Globally"
                  description="Enable or disable customer billing document downloads"
                  checked={settings.isInvoiceEnabled}
                  onChange={(e) => handleFieldChange('isInvoiceEnabled', e.target.checked)}
                />
              </div>

              <Button
                type="submit"
                loading={saving}
                className="w-full sm:w-auto"
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
