import { useEffect } from 'react'

export function useDocumentMetadata(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title ? `${title} | Short Circuit` : 'Short Circuit — Electronics for Makers & Engineers'

    let metaDesc = document.querySelector('meta[name="description"]')
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : ''
    
    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', description)
    }

    return () => {
      document.title = prevTitle
      if (prevDesc && metaDesc) {
        metaDesc.setAttribute('content', prevDesc)
      }
    }
  }, [title, description])
}
