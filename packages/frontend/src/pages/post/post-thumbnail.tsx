import { AGGREGATOR } from '@/constants'

type PostThumbnailProps = {
  thumbnailBlobId: string | null | undefined
  title: string
}

export function PostThumbnail({ thumbnailBlobId, title }: PostThumbnailProps) {
  if (!thumbnailBlobId) {
    return null
  }

  return (
    <div>
      <img
        src={`${AGGREGATOR}/v1/blobs/${thumbnailBlobId}`}
        alt={title}
        className="w-full h-auto max-h-[400px] object-cover rounded-lg shadow-md"
      />
    </div>
  )
}
