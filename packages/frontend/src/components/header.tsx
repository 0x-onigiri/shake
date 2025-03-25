import { useState, Suspense } from 'react'
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
import { useSuspenseQuery } from '@tanstack/react-query'

const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space'

export default function Header() {
  const [open, setOpen] = useState(false)
  const currentAccount = useCurrentAccount()
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b">
      <Link to="/" className="text-2xl font-bold text-primary">Shake</Link>

      <div className="flex justify-between items-center gap-4">

        {!currentAccount && (
          <div>
            <ConnectModal
              trigger={(
                <Button>
                  Connect Wallet to Cook
                </Button>
              )}
              open={open}
              onOpenChange={isOpen => setOpen(isOpen)}
            />
          </div>
        )}

        {currentAccount && (
          <>
            <Button asChild variant="link">
              <Link to="/cook">Cook</Link>
            </Button>
            <WalletButton
              walletAccount={currentAccount}
            />
          </>
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

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button className="py-6">
            <Suspense fallback={truncateAddress(walletAccount.address)}>
              <WalletButtonLabel
                walletAddress={walletAccount.address}
              />
            </Suspense>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="flex flex-col gap-3 p-3">
            {/* {walletAccount?.label && <p>{walletAccount.label}</p>} */}
            <Suspense fallback={<div>Loading...</div>}>
              <UserInfo
                walletAddress={walletAccount.address}
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
}: {
  walletAddress: string
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', walletAddress],
    queryFn: () => fetchUser(walletAddress),
  })

  if (!user) return truncateAddress(walletAddress)

  return (
    <>
      <img src={`${AGGREGATOR}/v1/blobs/${user.image}`} alt={user.username} className="w-8 h-8 rounded-full" />
      <span>{user.username}</span>
    </>
  )
}

function UserInfo({
  walletAddress,
}: {
  walletAddress: string
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', walletAddress],
    queryFn: () => fetchUser(walletAddress),
  })
  if (!user) return null

  return (
    <span>{user.username}</span>
  )
}
