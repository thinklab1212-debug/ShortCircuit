# Walkthrough — Admin Image Upload Feature

We successfully extended the product review queue to support optional admin image uploads during the pricing/approval phase, including configurable append/replace modes.

## Summary of Changes

### Backend Changes

1. **Product Schema Update**
   * File: [Product.model.ts](file:///d:/ShortCircuit/server/src/models/Product.model.ts)
   * Added field `imageUploadSource?: 'vendor' | 'admin'` to document how the final set of images was curated.
   * Increased the maximum image count limit from `8` to `15` to support appending images safely without throwing MongoDB validation errors.

2. **Zod Validator Update**
   * File: [vendor.validator.ts](file:///d:/ShortCircuit/server/src/validators/vendor.validator.ts)
   * Modified the `reviewProductSchema` (the `approve` literal case) to allow optional inputs:
     * `images: z.array(z.string().url()).max(15).optional()`
     * `imageMergeMode: z.enum(['append', 'replace']).optional().default('append')`

3. **Service Logic Update**
   * File: [vendor.service.ts](file:///d:/ShortCircuit/server/src/services/vendor.service.ts)
   * Added `getPublicIdFromUrl(url)` utility to resolve Cloudinary public IDs from URL strings.
   * Implemented image merge logic matching the chosen merge mode (append vs replace).
   * Automatically flagged the product's `imageUploadSource = 'admin'` if admin images were uploaded.
   * Ensured a primary image (`isPrimary: true`) exists in the updated image set.
   * Enforced the 15-image limit constraints.

### Frontend Changes

1. **Frontend Types Update**
   * File: [index.ts](file:///d:/ShortCircuit/client/src/types/index.ts)
   * Updated `Product` and `ReviewProductData` definitions.

2. **Review Queue UI Updates**
   * File: [ReviewQueuePage.tsx](file:///d:/ShortCircuit/client/src/pages/admin/ReviewQueuePage.tsx)
   * Rendered the existing vendor images as a read-only list with a label.
   * Added the drag & drop / file picker component using the project's existing Cloudinary uploader service.
   * Rendered preview thumbnails for admin-added images with interactive removal triggers.
   * Added image strategy radio controls to select "Append" vs "Replace" modes.
   * Appended images lists to the `reviewProduct` mutation payload.
   * Prevented form submission while image uploads are in progress by disabling the "Approve" button and showing loading statuses.

---

## Verification Results

* **Backend Typecheck**: Run `npx tsc --noEmit` on the server folder → **Successful (0 errors)**.
* **Frontend Typecheck**: Run `npx tsc --noEmit` on the client folder → **Successful (0 errors)**.
