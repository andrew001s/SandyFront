import { useState } from 'react'
import './App.css'
import { activateMic, start } from './api/sandycore'

function App() {
  const [isPaused, setIsPaused] = useState(false)

  const handleClick = () => {
    if (isPaused) {    
      activateMic()
      setIsPaused(false)
  }
    else {
      activateMic()
      setIsPaused(true)
    }
  }

  const handleStart = () => {
    start()
  }


  return (
    
      <div>
        
      <button type='button' onClick={handleStart}>
          Start
       </button>
       <button type='button' onClick={handleClick}>
          {isPaused ? 'Resume' : 'Pause'}
       </button>
      </div>
     
    
  )
}

export default App
