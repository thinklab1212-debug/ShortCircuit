import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { MapPin, Plus, Pencil, Trash2, Star, Home, Building2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/error'
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/hooks'
import { capitalize } from '@/utils'
import type { Address } from '@/types'
import { fadeInUp, staggerContainer } from '@/config/animations'

// ─── Indian States ────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
] as const

// ─── Schema ───────────────────────────────────────────────────────────────────

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.enum(INDIAN_STATES, { message: 'Select a valid state' }),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  type: z.enum(['home', 'office', 'other']),
  isDefault: z.boolean(),
})
type AddressFormValues = z.infer<typeof addressSchema>

const EMPTY: AddressFormValues = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: 'Maharashtra',
  pincode: '',
  type: 'home',
  isDefault: false,
}

const typeIcon = (type: Address['type']) =>
  type === 'office' ? Building2 : type === 'home' ? Home : MapPin

// ─── Address Form Modal ───────────────────────────────────────────────────────

function AddressFormModal({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing: Address | null
  onClose: () => void
}) {
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const isSaving = createAddress.isPending || updateAddress.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: editing
      ? {
          fullName: editing.fullName,
          phone: editing.phone,
          addressLine1: editing.addressLine1,
          addressLine2: editing.addressLine2 ?? '',
          landmark: editing.landmark ?? '',
          city: editing.city,
          state: editing.state as AddressFormValues['state'],
          pincode: editing.pincode,
          type: editing.type,
          isDefault: editing.isDefault,
        }
      : EMPTY,
  })

  if (!open) return null

  const onSubmit = (data: AddressFormValues) => {
    const payload = {
      ...data,
      addressLine2: data.addressLine2 || undefined,
      landmark: data.landmark || undefined,
    }
    if (editing) {
      updateAddress.mutate({ id: editing._id, data: payload }, { onSuccess: onClose })
    } else {
      createAddress.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="my-8 w-full max-w-lg rounded-xl border border-border bg-card shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="text-lg font-semibold text-foreground">
            {editing ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Full name"
              htmlFor="fullName"
              error={errors.fullName?.message}
              required
            >
              <Input id="fullName" error={!!errors.fullName} {...register('fullName')} />
            </FormField>
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit number"
                error={!!errors.phone}
                {...register('phone')}
              />
            </FormField>
          </div>

          <FormField
            label="Address line 1"
            htmlFor="addressLine1"
            error={errors.addressLine1?.message}
            required
          >
            <Input
              id="addressLine1"
              error={!!errors.addressLine1}
              {...register('addressLine1')}
            />
          </FormField>

          <FormField label="Address line 2" htmlFor="addressLine2" error={errors.addressLine2?.message}>
            <Input id="addressLine2" {...register('addressLine2')} />
          </FormField>

          <FormField label="Landmark" htmlFor="landmark" error={errors.landmark?.message}>
            <Input id="landmark" {...register('landmark')} />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="City" htmlFor="city" error={errors.city?.message} required>
              <Input id="city" error={!!errors.city} {...register('city')} />
            </FormField>
            <FormField label="Pincode" htmlFor="pincode" error={errors.pincode?.message} required>
              <Input
                id="pincode"
                placeholder="6-digit pincode"
                error={!!errors.pincode}
                {...register('pincode')}
              />
            </FormField>
          </div>

          <FormField label="State" htmlFor="state" error={errors.state?.message} required>
            <Select id="state" error={!!errors.state} {...register('state')}>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Address type" htmlFor="type" error={errors.type?.message} required>
            <Select id="type" error={!!errors.type} {...register('type')}>
              <option value="home">Home</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </Select>
          </FormField>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              {...register('isDefault')}
            />
            Set as default address
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} loadingText="Saving...">
              {editing ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Address Card ─────────────────────────────────────────────────────────────

function AddressCard({
  address,
  onEdit,
}: {
  address: Address
  onEdit: (a: Address) => void
}) {
  const deleteAddress = useDeleteAddress()
  const setDefault = useSetDefaultAddress()
  const Icon = typeIcon(address.type)

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" size="sm">
            {capitalize(address.type)}
          </Badge>
          {address.isDefault && (
            <Badge variant="success" size="sm">
              Default
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{address.fullName}</p>
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        {address.landmark && <p>{address.landmark}</p>}
        <p>
          {address.city}, {address.state} {address.pincode}
        </p>
        <p>{address.country}</p>
        <p className="mt-1">Phone: {address.phone}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(address)}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        {!address.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            loading={setDefault.isPending}
            onClick={() => setDefault.mutate(address._id)}
          >
            <Star className="h-3.5 w-3.5 mr-1" />
            Set Default
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-error-600 hover:text-error-700"
          loading={deleteAddress.isPending}
          onClick={() => deleteAddress.mutate(address._id)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  )
}

// ─── Addresses Page ───────────────────────────────────────────────────────────

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (a: Address) => {
    setEditing(a)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const list = addresses ?? []

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">
            Saved Addresses
          </h1>
          <p className="mt-1 text-body-md text-muted-foreground">
            Manage your delivery addresses
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add New Address
        </Button>
      </div>

      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader text="Loading addresses..." />
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <EmptyState
          icon={<MapPin className="h-8 w-8 text-muted-foreground" />}
          title="No addresses saved"
          description="Add a delivery address to speed up your checkout."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          }
        />
      )}

      {!isLoading && list.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {list.map((address) => (
            <motion.div key={address._id} variants={fadeInUp}>
              <AddressCard address={address} onEdit={openEdit} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <AddressFormModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  )
}
