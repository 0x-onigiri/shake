import { useState, use, Suspense } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { truncateAddress } from '@/lib/utils'
import {
  useCurrentAccount,
  useDisconnectWallet,
  ConnectModal,
} from '@mysten/dapp-kit'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WalletAccount } from '@mysten/wallet-standard'
import { fetchUser } from '@/lib/shake-client'
import { UserContext } from '../contexts/user-context'

export default function Header() {
  const [open, setOpen] = useState(false)
  const currentAccount = useCurrentAccount()
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b">
      <Link to="/" className="text-2xl font-bold text-primary">Shake</Link>

      <div className="flex justify-between items-center gap-4">
        <Button asChild variant="link">
          <Link to="/cook">Cook</Link>
        </Button>
        {!currentAccount && (
          <div>
            <ConnectModal
              trigger={(
                <Button>
                  Connect Wallet
                </Button>
              )}
              open={open}
              onOpenChange={isOpen => setOpen(isOpen)}
            />
          </div>
        )}

        {currentAccount && (
          <WalletButton
            walletAccount={currentAccount}
          />
        )}
      </div>
    </header>
  )
}

function WalletButton({
  walletAccount,
}: {
  walletAccount: WalletAccount
}) {
  const { mutate: disconnect } = useDisconnectWallet()
  // const promise = fetchUser(walletAccount.address)
  const promise2 = use(UserContext)

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button>
            <Suspense fallback={truncateAddress(walletAccount.address)}>
              <WalletButtonLabel
                walletAddress={walletAccount.address}
                promise={promise2}
              />
            </Suspense>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="flex flex-col gap-3 p-3">
            {/* {walletAccount?.label && <p>{walletAccount.label}</p>} */}
            <Suspense fallback={<div>Loading...</div>}>
              <UserInfo
                promise={promise2}
              />
            </Suspense>
            <p>{truncateAddress(walletAccount.address)}</p>
            <Button variant="outline" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function WalletButtonLabel({
  walletAddress,
  promise,
}: {
  walletAddress: string
  promise: Promise<any>
}) {
  const user = use(promise)
  if (!user) return truncateAddress(walletAddress)

  return user.username
}

function UserInfo({
  promise,
}: {
  promise: Promise<any>
}) {
  const user = use(promise)
  if (!user) return null

  return (
    <span>{user.username}</span>
  )
}
