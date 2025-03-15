import { useSuiClientQuery } from '@mysten/dapp-kit'
import { Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle } from '@/components/ui/card'
import { truncateAddress } from '@/lib/utils'
import { TESTNET_PACKAGE_ID } from '@/constants'

export default function ShakeList() {
  const { data } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType: `${TESTNET_PACKAGE_ID}::blog::PostCreatedEvent`,
      },
    },
  )

  if (!data) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ul className="grid grid-cols-3 gap-4">
        {data.data.map((item) => {
          const parsedJson = item.parsedJson
          return (
            <li key={parsedJson.postId}>
              <Card>
                <CardHeader>
                  <CardTitle>{parsedJson.title}</CardTitle>
                  <CardDescription>記事本文記事本文記事本文記事本文</CardDescription>
                </CardHeader>
                {/* <CardContent>
              <p>Card Content</p>
            </CardContent> */}
                <CardFooter>
                  <p>
                    by
                    {' '}
                    {truncateAddress(parsedJson.author)}
                  </p>
                </CardFooter>
              </Card>

            </li>
          )
        })}
      </ul>

    </div>
  )
}
