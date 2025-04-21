import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { objResToFields, objResToOwner } from '@polymedia/suitcase-core'
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import type { User, Post, PostMetadata, ReviewReaction } from '@/types'
import { PUBLISHER, AGGREGATOR } from '@/constants'
import { BlogModule } from '@/lib/sui/blog-functions'

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') })

export async function fetchUser(
  userAddress: string,
) {
  const response = await suiClient.getOwnedObjects({
    owner: userAddress,
    filter: {
      MatchAll: [
        {
          StructType: `${SHAKE_ONIGIRI.testnet.packageId}::user::User`,
        },
      ],
    },
    options: {
      showContent: true,
    },
  })
  const userObject = response.data[0]
  if (!userObject) {
    return null
  }
  const fields = objResToFields(userObject)
  const user: User = {
    id: fields.id.id,
    username: fields.name,
    image: fields.profile_image_id,
    bio: fields.bio,
  }
  return user
}

export async function fetchUserByUserId(
  userId: string,
) {
  const userObject = await suiClient.getObject({
    id: userId,
    options: {
      showContent: true,
    },
  })
  const fields = objResToFields(userObject)
  const user: User = {
    id: fields.id.id,
    username: fields.username,
    image: fields.image,
    bio: fields.bio,
  }
  return user
}

export async function fetchUserPosts(
  userAddress: string,
) {
  const response = await suiClient.getOwnedObjects({
    owner: userAddress,
    filter: {
      MatchAll: [
        {
          StructType: `${SHAKE_ONIGIRI.testnet.packageId}::blog::Post`,
        },
      ],
    },
    options: {
      showContent: true,
    },
  })

  const fields = response.data.map(objResToFields)
  const posts = fields.map((field) => {
    const post: Post = {
      id: field.id.id,
      author: userAddress,
      title: field.title,
      postBlobId: field.post_blob_id,
    }
    return post
  })
  return posts
}

export async function fetchPost(
  postId: string,
) {
  const postObject = await suiClient.getObject({
    id: postId,
    options: {
      showContent: true,
      showOwner: true,
    },
  })
  const fields = objResToFields(postObject)
  const authorAddress = objResToOwner(postObject)

  if (authorAddress === 'unknown') {
    throw new Error('Invalid post owner')
  }

  const postMetadataObject = await suiClient.getObject({
    id: fields.post_metadata_id,
    options: {
      showContent: true,
      showOwner: true,
    },
  })
  const postMetadataFields = objResToFields(postMetadataObject)
  const postMetadata: PostMetadata = {
    id: postMetadataFields.id.id,
    price: postMetadataFields.price ? Number(postMetadataFields.price) : 0,
    reviewObjId: postMetadataFields.reviews.fields.id.id,
  }

  const post: Post = {
    id: fields.id.id,
    author: authorAddress,
    title: fields.title,
    postBlobId: fields.post_blob_id,
    metadata: postMetadata,
  }

  console.log('post', post)

  return post
}

export async function fetchPostContent(
  blobId: string,
) {
  try {
    const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`)

    if (!response.ok) {
      throw new Error(
        `コンテンツの取得に失敗しました: ${response.statusText}`,
      )
    }

    return await response.text()
  }
  catch (err) {
    console.error('コンテンツ取得エラー:', err)
  }
}

// TODO: contentが暗号化前提になっているが、無料記事の場合は暗号化しないようにする（別関数でもok）
export async function createPaidPost(tx: Transaction, userObjectId: string, title: string, encryptedContent: Uint8Array, price: number) {
  const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=5`, {
    method: 'PUT',
    body: encryptedContent,
  })

  if (!response.ok) {
    throw new Error(`アップロード失敗: ${response.statusText}`)
  }

  const result = await response.json()
  const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified.blobId
  if (!blobId) {
    throw new Error('Blob IDが見つかりません')
  }

  console.log('Blob ID:', blobId)

  return BlogModule.createPost(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    userObjectId,
    title,
    blobId,
    price,
  )
}
export async function createFreePost(tx: Transaction, userObjectId: string, title: string, content: string) {
  const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=5`, {
    method: 'PUT',
    body: content,
  })

  if (!response.ok) {
    throw new Error(`アップロード失敗: ${response.statusText}`)
  }

  const result = await response.json()
  const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified.blobId
  if (!blobId) {
    throw new Error('Blob IDが見つかりません')
  }

  console.log('Blob ID:', blobId)

  return BlogModule.createPost(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    userObjectId,
    title,
    blobId,
  )
}

export async function createReview(tx: Transaction, postMetadataId: string, content: string) {
  if (!content.trim()) {
    throw new Error('レビュー内容を入力してください')
  }

  return BlogModule.createReview(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    postMetadataId,
    content,
  )
}

export async function voteForReview(tx: Transaction, postMetadataId: string, reaction: ReviewReaction) {
  return BlogModule.voteForReview(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    postMetadataId,
    reaction,
  )
}

export async function fetchPostReviews(postId: string, existingPost?: Post): Promise<any[]> {
  try {
    const post = existingPost || await fetchPost(postId)

    if (!post || !post.metadata) {
      throw new Error('データが見つかりません')
    }
    const reviews = []

    const dynamicFields = await suiClient.getDynamicFields({
      parentId: post.metadata.reviewObjId,
    })

    console.log('dynamicFields', dynamicFields)

    for (const field of dynamicFields.data) {
      console.log('field', field)
      try {
        const reviewObj = await suiClient.getDynamicFieldObject({
          parentId: post.metadata.reviewObjId,
          name: {
            type: field.name.type,
            value: field.name.value,
          },
        })

        if (reviewObj.error) {
          console.error('レビュー取得エラー:', reviewObj.error)
          continue
        }

        let authorData: { name: string, image: undefined | string } = {
          name: '匿名ユーザー',
          image: undefined,
        }
        try {
          console.log('field.name', field.name)
          if (field.name.value) {
            const userId = field.name.value
            if (userId && typeof userId === 'string') {
              const author = await fetchUser(userId)
              if (author) {
                authorData = {
                  name: author.username || '匿名ユーザー',
                  image: author.image,
                }
              }
            }
          }
        }
        catch (err) {
          console.error('レビュー作成者取得エラー:', err)
        }

        const fields = objResToFields(reviewObj)
        console.log('fields', fields)

        // レビューオブジェクトを作成
        if (fields && fields.id && fields.content) {
          const review = {
            id: fields.id.id,
            content: fields.content,
            author: authorData,
            createdAt: new Date(Number(fields.created_at)).toLocaleString('ja-JP'),
            helpfulCount: 0, // todo 評価の取得処理
            notHelpfulCount: 0, // todo 評価の取得処理
          }

          reviews.push(review)
        }
      }
      catch (err) {
        console.error('レビューデータ取得エラー:', err)
      }
    }

    return reviews
  }
  catch (error) {
    console.error('レビュー取得エラー:', error)
    return []
  }
}
