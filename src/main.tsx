import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import BrandBar from './BrandBar.tsx'
import { FallingPetals } from './Decor.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FallingPetals />
    <BrandBar />
    <App />
  </StrictMode>,
)
