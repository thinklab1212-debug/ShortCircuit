# Admin Image Upload During Product Review — Implementation Plan

This plan extends the existing vendor product review workflow. When an admin reviews and approves a product (setting its selling price and optional sale price), they can also upload or attach new product images. These images can either overwrite the existing vendor-submitted images or be appended to them.

## User Review Required

> [!IMPORTANT]
> The admin image upload is optional. If the admin provides images, they can select either **Append** (default) or **Override** (Replace) mode to merge with or replace the vendor's submitted images. 
> To safeguard the vendor's ownership, the database will store `imageUploadSource: 'admin'` if admin-added images are approved, preventing vendor modifications from overwriting them later.

## Proposed Changes

---

### Backend Components

#### [MODIFY] [Product.model.ts](file:///d:/ShortCircuit/server/src/models/Product.model.ts)
* Add optional field `imageUploadSource?: 'vendor' | 'admin'` to the `IProduct` interface.
* Add `imageUploadSource` to the Mongoose schema:
  ```typescript
  imageUploadSource: {
    type: String,
    enum: {
      values: ['vendor', 'admin'],
      message: 'imageUploadSource must be vendor or admin',
    },
    default: 'vendor',
  }
  ```
* Increase Mongoose validation limit for `images` from `8` to `15`:
  ```typescript
  validate: {
    validator: (images: IProductImage[]) => images.length <= 15,
    message: 'A product can have at most 15 images',
  }
  ```

#### [MODIFY] [vendor.validator.ts](file:///d:/ShortCircuit/server/src/validators/vendor.validator.ts)
* Update `reviewProductSchema` to include the optional fields `images` and `imageMergeMode` on the `approve` union branch:
  ```typescript
  z.object({
    action: z.literal('approve'),
    price: z.number({ required_error: 'Price is required to approve' }).positive('Price must be positive'),
    salePrice: z.number().positive().optional(),
    images: z.array(z.string().url('Invalid image URL format')).max(15).optional(),
    imageMergeMode: z.enum(['append', 'replace']).optional().default('append'),
  })
  ```

#### [MODIFY] [vendor.service.ts](file:///d:/ShortCircuit/server/src/services/vendor.service.ts)
* Update `reviewProduct` to process admin images when the action is `approve`:
  * Map `dto.images` (array of URL strings) to `IProductImage` objects.
  * Implement a robust Cloudinary public ID parser:
    ```typescript
    function getPublicIdFromUrl(url: string): string {
      try {
        const regex = /\/image\/upload\/(?:v\d+\/)?(electrokart\/[^\/]+\/[^\/\.]+)/i;
        const match = url.match(regex);
        if (match && match[1]) return match[1];

        const fallbackRegex = /\/image\/upload\/(?:v\d+\/)?([^\/\.]+)/i;
        const fallbackMatch = url.match(fallbackRegex);
        if (fallbackMatch && fallbackMatch[1]) return fallbackMatch[1];
      } catch {}
      const parts = url.split('/');
      const filename = parts[parts.length - 1] || 'image';
      const dotIndex = filename.lastIndexOf('.');
      return dotIndex > -1 ? filename.substring(0, dotIndex) : filename;
    }
    ```
  * Perform the merge operation based on `imageMergeMode`:
    * If `dto.imageMergeMode === 'replace'`: `product.images = adminMappedImages`.
    * If `dto.imageMergeMode === 'append'` (default): `product.images = [...product.images, ...adminMappedImages]`.
    * If the admin provided images, set `product.imageUploadSource = 'admin'`.
  * Validate that the final images list does not exceed the limit of 15.

---

### Frontend Components

#### [MODIFY] [index.ts](file:///d:/ShortCircuit/client/src/types/index.ts)
* Update `ReviewProductData` to support `images` and `imageMergeMode`:
  ```typescript
  export interface ReviewProductData {
    action: 'approve' | 'reject'
    price?: number
    salePrice?: number
    reason?: string
    images?: string[]
    imageMergeMode?: 'append' | 'replace'
  }
  ```
* Update `Product` type to include optional `imageUploadSource?: 'vendor' | 'admin'`.

#### [MODIFY] [ReviewQueuePage.tsx](file:///d:/ShortCircuit/client/src/pages/admin/ReviewQueuePage.tsx)
* Import `uploadApi` from `@/services` and Lucide icons `Upload, Star, Loader2`.
* Inside `ReviewQueuePage`:
  * Add state variables:
    * `adminImages` (`ProductImage[]`, initialized to `[]`)
    * `uploading` (`boolean`, initialized to `false`)
    * `imageMergeMode` (`'append' | 'replace'`, initialized to `'append'`)
  * Reset these states inside `openApproveModal`.
  * Implement file upload handler:
    ```typescript
    const handleUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          const res = await uploadApi.image(file)
          const { url, publicId } = res.data.data
          setAdminImages((prev) => [...prev, { url, publicId, isPrimary: false }])
        }
      } catch {
        toast.error('Image upload failed')
      } finally {
        setUploading(false)
      }
    }
    ```
  * Implement remove handler:
    ```typescript
    const removeAdminImage = (publicId: string) => {
      setAdminImages((prev) => prev.filter((img) => img.publicId !== publicId))
    }
    ```
  * In the approval form JSX, show:
    * **Vendor Images** (existing images from `modal.product.images` with a grid layout and a sub-label).
    * **Admin Added Images** section with:
      * A custom file uploader area (click to upload, showing loader during uploads).
      * Thumbnails of uploaded admin images with a hover remove (`X`) button.
      * Radio buttons / select input for choosing the merge mode: "Append to existing vendor images" vs "Replace existing vendor images".
  * In `handleApprove`, map `adminImages` to string URLs and pass them along with `imageMergeMode` to the review mutation request payload.
  * Ensure submit buttons are disabled when `uploading === true`.

---

## Verification Plan

### Automated Tests
* We will verify using existing Jest/Mocha backend testing suits (if available) or verify that compilation/linting succeeds:
  * Run backend typecheck/lint.
  * Run frontend build/typecheck.

### Manual Verification
* Deploy/run the project locally.
* Go to the Review Queue page in the Admin Panel.
* Select a product submitted by a vendor.
* Input customer selling price and optional sale price.
* Upload 2-3 custom admin images.
* Submit approval.
* Confirm that the API request includes:
  * `price`
  * `salePrice`
  * `action: 'approve'`
  * `images: [...]`
  * `imageMergeMode`
* Verify in MongoDB or via UI that:
  * The product shows up on the storefront with the updated prices and appended/replaced images.
  * Reject flows still work normally and reject modal stays unaffected.
