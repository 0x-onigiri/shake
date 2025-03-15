import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn, truncateAddress } from '@/lib/utils'
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

export default function Header() {
  const [open, setOpen] = useState(false)
  const { mutate: disconnect } = useDisconnectWallet()
  const currentAccount = useCurrentAccount()
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b">
      <div className="text-2xl font-bold text-primary">
        Shake
      </div>

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
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
            >
              <Button>{truncateAddress(currentAccount.address)}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="flex flex-col gap-3 p-3">
                {currentAccount?.label && <p>{currentAccount.label}</p>}
                <p>{truncateAddress(currentAccount.address)}</p>
                <Button variant="outline" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  )
}
