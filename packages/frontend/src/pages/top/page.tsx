import type { Post } from '@/types'
import { SuiGraphQLClient } from '@mysten/sui/graphql'
import { graphql } from '@mysten/sui/graphql/schemas/latest'
import { SHAKE_ONIGIRI } from '@/constants'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PostCard } from '@/components/posts/post-card'

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
        owner {
          ... on AddressOwner {
            owner {
              address
            }
          }
        }
      }
    }
  }
`)

async function fetchPostList() {
  const response = await gqlClient.query({
    query: postListQuery,
  })

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return response.data?.objects.nodes.filter((node: any) => {
    return node?.owner?.owner?.address !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  })
}

export default function Page() {
  const { data: posts } = useSuspenseQuery({
    queryKey: ['fetchPostList'],
    queryFn: fetchPostList,
  })

  if (!posts) {
    return null
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {posts.map((p: any) => {
          const field = p?.asMoveObject?.contents?.json
          const post: Post = {
            id: field.id,
            thumbnailBlobId: field.thumbnail_blob_id,
            title: field.title,
            postBlobId: field.post_blob_id,
            createdAt: new Date(Number(field.created_at)).toLocaleString('ja-JP'),
            author: p?.owner.owner?.address,
          } as Post

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
