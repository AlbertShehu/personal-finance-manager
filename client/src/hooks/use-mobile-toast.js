// src/hooks/use-mobile-toast.js
import { useCallback } from 'react'

export const useMobileToast = () => {
  const showToast = useCallback(({ title, description, variant = 'success', duration = 3000 }) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (!isMobile) {
      // Për desktop, përdor toast-in normal
      import('@/hooks/use-toast').then(({ toast }) => {
        return toast({ title, description, variant, duration })
      })
      return
    }

    // Për mobile, krijo një toast të thjeshtë
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    }

    const mobileToast = document.createElement('div')
    mobileToast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: ${colors[variant] || colors.success};
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        text-align: center;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        ${description ? `<div style="font-size: 12px; opacity: 0.9;">${description}</div>` : ''}
      </div>
    `

    // Shto CSS për animacion
    if (!document.getElementById('mobile-toast-styles')) {
      const style = document.createElement('style')
      style.id = 'mobile-toast-styles'
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(mobileToast)
    
    setTimeout(() => {
      if (document.body.contains(mobileToast)) {
        document.body.removeChild(mobileToast)
      }
    }, duration)

    return { id: Date.now(), dismiss: () => {
      if (document.body.contains(mobileToast)) {
        document.body.removeChild(mobileToast)
      }
    }}
  }, [])

  return { toast: showToast }
}
