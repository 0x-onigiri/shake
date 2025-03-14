import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Button } from '@/components/ui/button'

function App() {
  const [
    count,
    setCount,
  ] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className="text-blue-400 font-bold text-2xl">Vite + React</h1>
      <div>
        <Button onClick={() => setCount(count => count + 1)}>
          count is
          {' '}
          {count}
        </Button>
        <a href="/sample" className="block">
          Go to Sample Page
        </a>
      </div>
    </>
  )
}

export default App
