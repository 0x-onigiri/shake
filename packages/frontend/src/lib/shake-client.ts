import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { UserModule } from '@/lib/sui/user-functions'
import { devInspectAndGetReturnValues, objResToFields } from '@polymedia/suitcase-core'
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import { bcs } from '@mysten/sui/bcs'
import { UserPostBcs, type UserPost } from './sui/user-objects'
import type { User, Post } from '@/types'

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') })
const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space'

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
  const owner = postObject.data?.owner ?? null
  // const authorAddress = owner && typeof owner === 'object' && 'ObjectOwner' in owner ? owner.ObjectOwner : ''

  const post: Post = {
    id: fields.id.id,
    // author: authorAddress,
    author: postObject.data?.owner?.AddressOwner || '',
    title: fields.title,
  }
  return post
}

export async function createPost(userId: string, title: string, content: string) {
  // まずWalrusにコンテンツをアップロード
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

  // 次にSuiにポストを作成
  const tx = new Transaction()
  tx.moveCall({
    target: `${SHAKE_ONIGIRI.testnet.packageId}::blog::create_post`,
    arguments: [
      tx.object(userId),
      tx.pure.string(title),
      tx.pure.string(blobId),
      tx.object('0x6'),
    ],
  })

  return tx
}
