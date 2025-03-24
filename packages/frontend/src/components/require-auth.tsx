import React from 'react'
import { Button } from '@/components/ui/button'
import {
  useCurrentAccount,
  ConnectModal,
} from '@mysten/dapp-kit'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchUser } from '@/lib/shake-client'

type Props = {
  children: React.ReactNode
}

export default function RequireAuth({ children }: Props) {
  const currentAccount = useCurrentAccount()

  if (!currentAccount) {
    return (
      <div>
        <ConnectModal
          trigger={(
            <Button>
              Connect Wallet to Cook
            </Button>
          )}
        />
      </div>
    )
  }

  return <CheckAuth walletAddress={currentAccount.address}>{children}</CheckAuth>
};

function CheckAuth({
  walletAddress,
  children,
}: {
  walletAddress: string
  children: React.ReactNode
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', walletAddress],
    queryFn: () => fetchUser(walletAddress),
  })

  if (!user) {
    window.location.href = '/new-user'
    // FIXME: this is not working (navigate of useNavigate)
    // return navigate('/new-user')
  }

  return children
}
