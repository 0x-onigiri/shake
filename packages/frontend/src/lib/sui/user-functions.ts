import { Transaction, TransactionResult } from '@mysten/sui/transactions'
import { ObjectInput, objectArg } from '@polymedia/suitcase-core'

/**
 * Build transactions for the blog::user Sui module.
 */
export const UserModule
= {
  get_user_address: (
    tx: Transaction,
    packageId: string,
    userList: string,
    // userList: ObjectInput,
    owner_addr: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::user::get_user_address`,
      arguments: [
        // objectArg(tx, userList),
        tx.object(userList),
        tx.pure.address(owner_addr),
      ],
    })
  },

  get_posts: (
    tx: Transaction,
    packageId: string,
    user: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::user::get_posts`,
      arguments: [
        tx.object(user),
        tx.pure.u64(0),
        tx.pure.u64(50),
        tx.pure.bool(true),
      ],
    })
  },

  create_new_user: (
    tx: Transaction,
    packageId: string,
    userList: string,
    userName: string,
    imageBlobId: string,
    bio: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::user::create_new_user`,
      arguments: [
        tx.object(userList),
        tx.pure.string(userName),
        tx.pure.string(imageBlobId),
        tx.pure.string(bio),
        tx.object('0x6'),
      ],
    })
  },

  existing_user_activity: (
    tx: Transaction,
    packageId: string,
    user: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::user::existing_user_activity`,
      arguments: [
        tx.object(user),
      ],
    })
  },

  delete_user_activity: (
    tx: Transaction,
    packageId: string,
    userActivity: ObjectInput,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::user::delete_user_activity`,
      arguments: [
        objectArg(tx, userActivity),
      ],
    })
  },
}
