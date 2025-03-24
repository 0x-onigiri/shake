import { SuiGraphQLClient } from '@mysten/sui/graphql'
import { graphql } from '@mysten/sui/graphql/schemas/latest'
import { Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle } from '@/components/ui/card'
import { truncateAddress } from '@/lib/utils'
import { SHAKE_ONIGIRI } from '@/constants'
import { useSuspenseQuery } from '@tanstack/react-query'

const gqlClient = new SuiGraphQLClient({
  url: 'https://sui-testnet.mystenlabs.com/graphql',
})

const postListQuery = graphql(`
  query {
    objects(
      filter: {
        type: "${SHAKE_ONIGIRI.testnet.packageId}::blog::Post"
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
  const response = await gqlClient.query({
    query: postListQuery,
  })

  return response.data?.objects.nodes
}

export default function ShakeList() {
  const { data: posts } = useSuspenseQuery({
    queryKey: ['fetchPostList'],
    queryFn: fetchPostList,
  })

  // const { data } = useSuiClientQuery(
  //   'queryEvents',
  //   {
  //     query: {
  //       MoveEventType: `${TESTNET_PACKAGE_ID}::blog::PostCreatedEvent`,
  //     },
  //   },
  // )

  if (!posts) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ul className="grid grid-cols-3 gap-4">
        {posts.map((post) => {
          const parsedJson = post.asMoveObject.contents.json
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
