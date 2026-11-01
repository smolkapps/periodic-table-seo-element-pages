import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

// Offline app shell scoped to the current directory (works at /study/ or /).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then((registration) => {
        const assetUrls = Array.from(
          document.querySelectorAll('script[src], link[rel="stylesheet"][href], link[rel="icon"][href], link[rel="manifest"][href]')
        )
          .map((el) => el.getAttribute('src') || el.getAttribute('href'))
          .filter(Boolean)

        const sendWarm = (worker) => {
          if (worker && assetUrls.length > 0) {
            worker.postMessage({ type: 'WARM_ASSETS', urls: assetUrls })
          }
        }

        sendWarm(registration.installing || registration.waiting || registration.active)
        navigator.serviceWorker.ready.then((readyReg) => sendWarm(readyReg.active)).catch(() => {})
      })
      .catch(() => {
        // Offline caching is a progressive enhancement; the app still works without it.
      })
  })
}