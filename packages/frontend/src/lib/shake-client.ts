import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { UserModule } from '@/lib/sui/user-functions'
import { devInspectAndGetReturnValues, objResToFields } from '@polymedia/suitcase-core'
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import { bcs } from '@mysten/sui/bcs'
import { UserPostBcs, type UserPost } from './sui/user-objects'
import type { User, Post } from '@/types'

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
    }
    return post
  })
  return posts
}

export async function fetchUserPosts2(
  userId: string,
) {
  const tx = new Transaction()

  UserModule.get_posts(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    userId,
  )

  const blockReturns = await devInspectAndGetReturnValues(suiClient, tx, [
    [
      bcs.vector(UserPostBcs),
      bcs.Bool,
      bcs.U64,
    ],
  ])

  const postsRaw = blockReturns[0][0] as UserPost[]

  const postAddresses = postsRaw.map(post => post.post_address)

  const response = await suiClient.multiGetObjects({
    ids: postAddresses,
    options: {
      showContent: true,
    },
  })

  const fields = response.map(objResToFields)
  const posts = fields.map((field) => {
    const post: Post = {
      id: field.id.id,
      author: field.author,
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
    },
  })
  const fields = objResToFields(postObject)
  const post: Post = {
    id: fields.id.id,
    author: fields.author,
    title: fields.title,
  }
  return post
}

export async function createPost(userObjectId: string, title: string) {
  const tx = new Transaction()
  tx.moveCall({
    target: `${SHAKE_ONIGIRI.testnet.packageId}::blog::create_post`,
    arguments: [tx.object(userObjectId), tx.pure.string(title), tx.object('0x6')],
  })
  return tx
}
