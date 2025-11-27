"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { MessageCircle, X, Send, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme = 'dark', setTheme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Cristina's AI digital twin. Ask me anything about her professional background, skills, or experience!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.content,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your question right now.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className={`fixed bottom-6 right-6 w-[25rem] h-[32rem] z-50 flex flex-col shadow-2xl overflow-hidden border backdrop-blur-sm
            ${theme === 'dark' ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white border-zinc-200'}`}
        >
          <CardHeader className={`flex flex-row items-center justify-between p-4 border-b flex-shrink-0
            ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'}`}
          >
            <CardTitle className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Chat with Cristina's AI Twin</CardTitle>
            <div className="flex gap-1 items-center">
              <Button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                variant="ghost"
                size="icon"
                className={theme === 'dark' ? 'text-yellow-300 hover:text-yellow-400' : 'text-blue-600 hover:text-blue-700'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className={theme === 'dark' ? 'h-6 w-6 text-zinc-400 hover:text-white' : 'h-6 w-6 text-zinc-500 hover:text-zinc-900'}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 min-h-0 ${theme === 'dark' ? '' : 'bg-zinc-50'}`}> 
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      message.role === "user"
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : theme === 'dark'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'bg-zinc-200 text-zinc-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className={theme === 'dark' ? 'bg-zinc-800 px-3 py-2 rounded-lg' : 'bg-zinc-200 px-3 py-2 rounded-lg'}>
                    <div className="flex space-x-1">
                      <div className={theme === 'dark' ? 'w-2 h-2 bg-zinc-400 rounded-full animate-bounce' : 'w-2 h-2 bg-zinc-500 rounded-full animate-bounce'}></div>
                      <div className={theme === 'dark' ? 'w-2 h-2 bg-zinc-400 rounded-full animate-bounce' : 'w-2 h-2 bg-zinc-500 rounded-full animate-bounce'} style={{ animationDelay: "0.1s" }}></div>
                      <div className={theme === 'dark' ? 'w-2 h-2 bg-zinc-400 rounded-full animate-bounce' : 'w-2 h-2 bg-zinc-500 rounded-full animate-bounce'} style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible div to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className={`p-3 border-t flex-shrink-0 ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200 bg-white'}`}>
              <form onSubmit={sendMessage} className="mb-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about Cristina..."
                    className={`flex-1 text-sm h-8 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className={theme === 'dark' ? 'h-8 w-8 bg-blue-600 hover:bg-blue-700' : 'h-8 w-8 bg-blue-500 hover:bg-blue-600'}
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </form>

              {/* Quick Questions */}
              <div className="flex flex-wrap gap-1 justify-center">
                {[
                  "Experience?",
                  "Skills?",
                  "Projects?"
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    onClick={() => setInput(suggestion.replace("?", ""))}
                    variant="outline"
                    size="sm"
                    className={`h-6 px-2 text-xs flex-shrink-0 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}