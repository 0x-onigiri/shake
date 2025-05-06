import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Clock } from 'lucide-react'

export function PostHeader() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center text-sm text-muted-foreground">
        <CalendarIcon className="mr-1 h-4 w-4" />
        <span>May 11th, 2025</span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="mr-1 h-4 w-4" />
        <span>
          5 min read
        </span>
      </div>
      <Badge variant="secondary" className="text-sm">
        Sui Move
      </Badge>
      <Badge variant="secondary" className="text-sm">
        Web3
      </Badge>
    </div>
  )
}
