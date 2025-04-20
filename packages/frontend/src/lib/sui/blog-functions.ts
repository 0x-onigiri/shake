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
    price?: number,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::blog::create_post`,
      arguments: [
        tx.object(userObjectId),
        tx.pure.string(title),
        tx.pure.string(postBlobId),
        tx.pure.option('u64', price),
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
  createReview: (
    tx: Transaction,
    packageId: string,
    postMetadataObjectId: string,
    content: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::blog::create_review`,
      arguments: [
        tx.object(postMetadataObjectId),
        tx.pure.string(content),
        tx.object('0x6'),
      ],
    })
  },
  voteForReview: (
    tx: Transaction,
    packageId: string,
    postMetadataObjectId: string,
    reaction: 'Helpful' | 'NotHelpful',
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::blog::vote_for_review`,
      arguments: [
        tx.object(postMetadataObjectId),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(reaction))),
      ],
    })
  },
}
