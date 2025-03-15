import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b">
      {/* TODO: カラーコード tailwind */}
      <div className="text-2xl font-bold" style={{ color: '#F4A583' }}>
        Shake
      </div>
      <Button>ボタン</Button>
    </header>
  )
}
