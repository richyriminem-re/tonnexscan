import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ✅ Vercel Analytics + Speed Insights
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Analytics />       {/* Tracks visitors & page views */}
    <SpeedInsights />   {/* Tracks performance metrics */}
  </React.StrictMode>
);


