import { Suspense, use } from 'react'
import { SuiGraphQLClient } from '@mysten/sui/graphql'
import { graphql } from '@mysten/sui/graphql/schemas/latest'
import { useSuiClientQuery } from '@mysten/dapp-kit'
import { Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle } from '@/components/ui/card'
import { truncateAddress } from '@/lib/utils'
import { TESTNET_PACKAGE_ID } from '@/constants'

const gqlClient = new SuiGraphQLClient({
  url: 'https://sui-testnet.mystenlabs.com/graphql',
})

const postListQuery = graphql(`
  query {
    objects(
      filter: {
        type: "${TESTNET_PACKAGE_ID}::blog::Post"
      }
    ) {
      pageInfo {
        hasNextPage
        startCursor
      }
      nodes {
        address
        asMoveObject {
          contents { json}
        }
      }
    }
  }
`)

async function fetchPostList() {
  const result = await gqlClient.query({
    query: postListQuery,
  })

  return result.data?.objects.nodes
}

export default function ShakeList() {
  // const { data } = useSuiClientQuery(
  //   'queryEvents',
  //   {
  //     query: {
  //       MoveEventType: `${TESTNET_PACKAGE_ID}::blog::PostCreatedEvent`,
  //     },
  //   },
  // )

  // if (!data) {
  //   return null
  // }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostList promise={fetchPostList()} />
    </Suspense>
  )
}

function PostList({
  promise,
}: {
  promise: Promise<any>
}) {
  const data = use(promise)

  console.log(data)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ul className="grid grid-cols-3 gap-4">
        {data.map((data) => {
          const parsedJson = data.asMoveObject.contents.json
          return (
            <li key={parsedJson.postId}>
              <Card>
                <CardHeader>
                  <CardTitle>{parsedJson.title}</CardTitle>
                  <CardDescription>記事本文記事本文記事本文記事本文</CardDescription>
                </CardHeader>
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
