import { } from 'react'
import { fetchUser } from '@/lib/shake-client'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { use, createContext, useContext, useMemo } from 'react'

interface User {
  username: string
}

type UserContextType = Promise<User | null> | null

export const UserContext = createContext<UserContextType>(null)

interface UserProviderProps {
  children: React.ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const currentAccount = useCurrentAccount()

  const userPromise = useMemo(() => {
    if (currentAccount) {
      return fetchUser(currentAccount.address).then(user => user || null)
    }
    return null
  }, [currentAccount])

  return (
    <UserContext value={userPromise}>
      {children}
    </UserContext>
  )
}

// カスタムフック (null チェックをここで行う)
// export function useUser() {
//   const context = useContext(UserContext)
//   if (!context) {
//     return null // Providerがない場合はnullを返す.
//   }
//   return use(context) // use を使って Promise を処理
// }
