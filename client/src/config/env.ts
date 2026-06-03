// ─── Environment Configuration ─────────────────────────────────────────────────

const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string || '/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME as string || 'Short Circuit',
  APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION as string || 'Electronics for Makers & Engineers',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID as string || '',
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string || '',
  NODE_ENV: import.meta.env.MODE as string,
  IS_DEV: import.meta.env.DEV as boolean,
  IS_PROD: import.meta.env.PROD as boolean,
} as const

export default env
