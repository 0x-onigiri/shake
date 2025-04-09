import { Transaction, TransactionResult, TransactionArgument } from '@mysten/sui/transactions'

/**
 * Build transactions for the shake::blog Sui module.
 */
export const BlogModule
= {
  createPost: (
    tx: Transaction,
    packageId: string,
    userObjectId: string,
    title: string,
    postBlobId: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::blog::create_post`,
      arguments: [
        tx.object(userObjectId),
        tx.pure.string(title),
        tx.pure.string(postBlobId),
        tx.object('0x6'),
      ],
    })
  },
  purchasePost: (
    tx: Transaction,
    packageId: string,
    postPaymentObjectId: string,
    postMetadataObjectId: string,
    suiCoin: TransactionArgument,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::blog::purchase_post`,
      arguments: [
        tx.object(postPaymentObjectId),
        tx.object(postMetadataObjectId),
        suiCoin,
      ],
    })
  },
  isPurchasedPost: (
    tx: Transaction,
    packageId: string,
    postPaymentObjectId: string,
    postMetadataObjectId: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::blog::is_purchased_post`,
      arguments: [
        tx.object(postPaymentObjectId),
        tx.object(postMetadataObjectId),
      ],
    })
  },
}
