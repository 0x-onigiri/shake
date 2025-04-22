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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { WalletAccount } from '@mysten/wallet-standard'
import { fetchUser } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AGGREGATOR } from '@/constants'

export function Header() {
  const [open, setOpen] = useState(false)
  const currentAccount = useCurrentAccount()
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b">
      <Link to="/" className="text-2xl font-bold text-primary">Shake</Link>

      <div className="flex justify-between items-center gap-4">

        {!currentAccount && (
          <ConnectModal
            trigger={(
              <Button>
                Connect Wallet
              </Button>
            )}
            open={open}
            onOpenChange={isOpen => setOpen(isOpen)}
          />
        )}

        {currentAccount && (
          <WalletMenu
            walletAccount={currentAccount}
          />
        )}
      </div>
    </header>
  )
}

function WalletMenu({
  walletAccount,
}: {
  walletAccount: WalletAccount
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', walletAccount.address],
    queryFn: () => fetchUser(walletAccount.address),
  })

  return (
    <>
      {!user && (
        <Alert>
          <AlertTitle>Create Profile!</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            Create a profile to get started.
            <Button asChild variant="link">
              <Link to="/new-user">Create</Link>
            </Button>
          </AlertDescription>

        </Alert>
      )}
      {user && (
        <Button asChild variant="link">
          <Link to="/cook">Cook</Link>
        </Button>
      )}
      <WalletButton
        walletAccount={walletAccount}
      />
    </>
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
      <Avatar>
        <AvatarImage src={`${AGGREGATOR}/v1/blobs/${user.image}`} alt={user.username} />
        <AvatarFallback>💧</AvatarFallback>
      </Avatar>
      <span className="text-white">{user.username}</span>
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
    <Link to={`/user/${walletAddress}`} className="font-bold">{user.username}</Link>

  )
}
