import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App.tsx'
import Sample from './Sample.tsx'
import Layout from './components/layout.tsx'

createRoot(document.getElementById('root')!)
  .render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<App />} />
            <Route path="/sample" element={<Sample />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  )
