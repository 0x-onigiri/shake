import { PUBLISHER } from '@/constants'

export async function uploadToWalrus(body: File | Uint8Array | string) {
  try {
    const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=5`, {
      method: 'PUT',
      body,
    })

    if (!response.ok) {
      throw new Error(`Walrus アップロード失敗: ${response.statusText}`)
    }

    const result = await response.json()
    const blobId = (result.newlyCreated?.blobObject?.blobId || result.alreadyCertified.blobId) as string
    if (!blobId) {
      throw new Error('Blob IDが見つかりません')
    }
    return blobId
  }
  catch (error) {
    console.error('Walrus アップロードエラー:', error)
    throw error
  }
}
