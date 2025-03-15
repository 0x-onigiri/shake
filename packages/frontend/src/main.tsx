import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import Provider from './provider'
import './index.css'
import App from './App.tsx'
import Layout from './components/layout.tsx'

createRoot(document.getElementById('root')!)
  .render(
    <StrictMode>
      <Provider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/" element={<App />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  )
