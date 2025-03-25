import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { UserModule } from '@/lib/sui/user-functions'
import { devInspectAndGetReturnValues, objResToFields, objResToContent } from '@polymedia/suitcase-core'
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import { bcs } from '@mysten/sui/bcs'
import { UserPostBcs, type UserPost } from './sui/user-objects'
import type { Post } from '@/types'

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') })

export async function fetchUser(
  address: string,
) {
  const tx = new Transaction()

  UserModule.get_user_address(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    SHAKE_ONIGIRI.testnet.userListObjectId,
    address,
  )

  const blockReturns = await devInspectAndGetReturnValues(suiClient, tx, [
    [
      bcs.Address,
    ],
  ])
  const userAddress = blockReturns[0][0] as string

  if (userAddress === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return null
  }

  const userObject = await suiClient.getObject({
    id: userAddress,
    options: {
      showContent: true,
    },
  })
  const fields = objResToFields(userObject)
  const user = {
    id: fields.id.id,
    username: fields.username,
    image: fields.image,
  }
  return user
}

export async function fetchUserPosts(
  userObject: string,
) {
  const tx = new Transaction()

  UserModule.get_posts(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    userObject,
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
