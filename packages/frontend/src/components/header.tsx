import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b">
      <div className="text-2xl font-bold text-primary">
        Shake
      </div>
      <Button>ボタン</Button>
    </header>
  )
}
