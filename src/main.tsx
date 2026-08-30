import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { NotificationProvider } from './context/NotificationContext'
import ToastContainer from './components/ToastContainer'
import AlertContainer from './components/AlertContainer'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
      <ToastContainer />
      <AlertContainer />
    </NotificationProvider>
  </React.StrictMode>,
)
