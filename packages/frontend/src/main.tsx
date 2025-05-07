import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import '@/index.css'
import { Provider } from '@/provider'
import { Layout } from '@/components/common/layout'
import { RequireWallet } from '@/components/auth/require-wallet.tsx'
import { RequireAuth } from '@/components/auth/require-auth.tsx'
import TopPage from '@/pages/top/page'
import CookPage from '@/pages/cook/page'
import NewUserPage from '@/pages/new-user/page'
import UserPage from '@/pages/user/page'
import PostPage from '@/pages/post/page'

createRoot(document.getElementById('root')!)
  .render(
    <StrictMode>
      <Provider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/" element={<TopPage />} />
              <Route
                path="/cook"
                element={(
                  <RequireAuth>
                    <CookPage />
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
              <Route path="/user/:walletAddress" element={<UserPage />} />
              <Route path="/:postId" element={<PostPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  )
