import { bcs } from '@mysten/sui/bcs'

export const UserPostBcs = bcs.struct('UsePost', {
  post_address: bcs.Address,
})

export type UserPost = {
  post_address: string
}
