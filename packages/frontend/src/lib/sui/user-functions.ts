import { Transaction, TransactionResult } from '@mysten/sui/transactions'

/**
 * Build transactions for the shake::user Sui module.
 */
export const UserModule
= {
  createUser: (
    tx: Transaction,
    packageId: string,
    userListObjectId: string,
    userName: string,
    imageBlobId: string,
    bio: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::user::create_user`,
      arguments: [
        tx.object(userListObjectId),
        tx.pure.string(userName),
        tx.pure.string(imageBlobId),
        tx.pure.string(bio),
        tx.object('0x6'),
      ],
    })
  },

}
