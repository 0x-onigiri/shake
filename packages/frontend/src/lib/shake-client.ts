import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { objResToFields, objResToOwner } from '@polymedia/suitcase-core'
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import type { User, Post, PostMetadata } from '@/types'
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
  const response = await fetch(`${PUBLISHER}/v1/blobs`, {
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
  const response = await fetch(`${PUBLISHER}/v1/blobs`, {
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
    content
  )
}

export async function voteForReview(tx: Transaction, postMetadataId: string, reaction: 'Helpful' | 'NotHelpful') {
  return BlogModule.voteForReview(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    postMetadataId,
    reaction
  )
}
