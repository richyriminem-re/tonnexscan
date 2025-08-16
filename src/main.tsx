import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'  // ✅ correct import

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />   {/* ✅ mount Speed Insights */}
  </React.StrictMode>
);


