import type { Post } from '@/types'
import { SuiGraphQLClient } from '@mysten/sui/graphql'
import { graphql } from '@mysten/sui/graphql/schemas/latest'
import { SHAKE_ONIGIRI } from '@/constants'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PostCard } from '@/components/post-card'

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
        {posts.map((p) => {
          const post = p?.asMoveObject?.contents?.json as Post
          return (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
