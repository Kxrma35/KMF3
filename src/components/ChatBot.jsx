import { useState } from 'react'
import { CpuChipIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import './ChatBot.css'

function ChatBot({ totalCalories, totalProtein, calorieGoal, proteinGoal, meals }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey! I'm your nutrition assistant. I can suggest meals, give you macro info, and help you hit your bulking goals. You've eaten ${totalCalories} kcal today — how can I help?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const mealSummary = meals.map(m => `${m.name} (${m.calories} kcal, ${m.protein}g protein)`).join(', ') || 'nothing yet'

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    const tryFetch = async (retries = 3, delay = 5000) => {
      try {
        const response = await fetch('https://bulking-tracker-server.onrender.com/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: `You are a friendly, knowledgeable nutrition and bulking assistant.
The user is on a bulking diet with these goals:
- Daily calorie goal: ${calorieGoal} kcal
- Daily protein goal: ${proteinGoal}g

Today they have eaten: ${mealSummary}
Total calories so far: ${totalCalories} kcal
Total protein so far: ${totalProtein}g
Calories remaining: ${calorieGoal - totalCalories} kcal

You have access to web search — use it to find accurate nutritional information about specific foods when needed. Give practical, specific advice with real calorie and protein numbers.`,
           
            messages: updatedMessages
              .filter((m, i) => !(i === 0 && m.role === 'assistant'))
              .map(m => ({ role: m.role, content: m.content }))
          })
        })

        const data = await response.json()
        const reply = data.reply
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      } catch (err) {
        if (retries > 0) {
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last?.content?.startsWith('Server is waking')) return prev
            return [...prev, {
              role: 'assistant',
              content: `Server is waking up, retrying in ${delay / 1000}s... (${retries} attempts left)`
            }]
          })
          setTimeout(() => tryFetch(retries - 1, delay), delay)
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Server took too long to respond. Please try again in a moment.'
          }])
          setLoading(false)
        }
        return
      }

      setLoading(false)
    }

    tryFetch()
  }

  return (
    <>
      <button className="chat-bubble" onClick={() => setOpen(!open)}>
        {open ? <XMarkIcon className="bubble-icon" /> : <CpuChipIcon className="bubble-icon" />}
      </button>

      {open && (
        <div className="chat-popup">
          <div className="chat-header">
            <div className="chat-header-info">
              <CpuChipIcon className="chat-avatar-icon" />
              <div>
                <div className="chat-name">Nutrition AI</div>
                <div className="chat-status">Online</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>
              <XMarkIcon className="close-icon" />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div className="chat-bubble-msg">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-bubble-msg typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <input
              placeholder="Ask about meals, macros, tips..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="chat-send" onClick={sendMessage} disabled={loading}>
              <PaperAirplaneIcon className="send-icon" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot