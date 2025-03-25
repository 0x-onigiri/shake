import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import Provider from './provider'
import './index.css'
import Layout from './components/layout.tsx'
import RequireWallet from './components/require-wallet.tsx'
import RequireAuth from './components/require-auth.tsx'
import ShakeList from './pages/shakes/shake-list.tsx'
import Cook from './pages/shakes/cook.tsx'
import NewUserPage from './pages/shakes/new-user.tsx'
import UserPage from './pages/shakes/user.tsx'
import PostPage from './pages/shakes/post.tsx'

createRoot(document.getElementById('root')!)
  .render(
    <StrictMode>
      <Provider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/" element={<ShakeList />} />
              <Route
                path="/cook"
                element={(
                  <RequireAuth>
                    <Cook />
                  </RequireAuth>
                )}
              />
              <Route
                path="/new-user"
                element={(
                  <RequireWallet>
                    <NewUserPage />
                  </RequireWallet>
                )}
              />
              <Route path="/user/:userId" element={<UserPage />} />
              <Route path="/:postId" element={<PostPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  )
