import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, AttributeDefinition, Category, LinkedProductVariant, PaginatedResponse } from '@/types'

export interface BatchImportResult {
  isValid: boolean
  totalRows: number
  validCount: number
  errors: Array<{ index: number; sku?: string; error: string }>
  createdVariants?: LinkedProductVariant[]
}

const variantApi = {
  getByProduct: (productId: string, params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<LinkedProductVariant>>(API_ROUTES.VARIANTS.BY_PRODUCT(productId), { params }),

  parametricSearch: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<LinkedProductVariant>>(API_ROUTES.VARIANTS.PARAMETRIC_SEARCH, { params }),

  // ── Admin ──
  create: (productId: string, data: Partial<LinkedProductVariant>) =>
    apiClient.post<ApiResponse<LinkedProductVariant>>(API_ROUTES.VARIANTS.BY_PRODUCT(productId), data),

  batchCreate: (productId: string, data: { variants: Partial<LinkedProductVariant>[]; dryRun?: boolean }) =>
    apiClient.post<ApiResponse<BatchImportResult>>(
      `${API_ROUTES.VARIANTS.BATCH(productId)}${data.dryRun ? '?dryRun=true' : ''}`,
      data
    ),

  update: (variantId: string, data: Partial<LinkedProductVariant>) =>
    apiClient.patch<ApiResponse<LinkedProductVariant>>(API_ROUTES.VARIANTS.BY_ID(variantId), data),

  remove: (variantId: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.VARIANTS.BY_ID(variantId)),

  updateCategoryAttributeDefs: (categoryId: string, attributeDefinitions: AttributeDefinition[]) =>
    apiClient.put<ApiResponse<Category>>(API_ROUTES.CATEGORIES.ATTRIBUTE_DEFINITIONS(categoryId), {
      attributeDefinitions,
    }),
}

export default variantApi
