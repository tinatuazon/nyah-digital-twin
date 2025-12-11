"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function FloatingChat() {
    // Ref for chat window and button
    const chatRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // State for chat open/close
    const [isOpen, setIsOpen] = useState(false)

    // Close chat when clicking outside
    useEffect(() => {
      if (!isOpen) return;
      function handleClickOutside(event: MouseEvent) {
        if (
          chatRef.current &&
          !chatRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);
  const { theme = 'dark', setTheme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! 👋 I'm an AI assistant trained on Nyah's portfolio. Feel free to ask about her projects, skills, or academic background.",
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
      {/* Always show the chatbot icon */}
      <Button
        ref={buttonRef}
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 dark:bg-cyan-400 hover:bg-blue-700 dark:hover:bg-cyan-300 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        size="icon"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <MessageCircle className="w-6 h-6 text-white dark:text-black" />
      </Button>

      {/* Chat Window above the icon */}
      {isOpen && (
        <Card
          ref={chatRef}
          className={`fixed bottom-24 right-6 w-[25rem] h-[32rem] z-50 flex flex-col shadow-2xl overflow-hidden rounded-3xl backdrop-blur-sm
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
        >
          <CardHeader className={`flex flex-row items-center justify-between p-5 border-b flex-shrink-0
            ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'
              }`}>
                <MessageCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <CardTitle className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Chat</CardTitle>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>AI Assistant</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 ${theme === 'dark' ? '' : 'bg-gray-50'}`}> 
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2.5 rounded-xl text-xs ${
                      message.role === "user"
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                          ? 'bg-zinc-800 text-gray-100'
                          : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`px-3 py-2.5 rounded-xl ${
                    theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Typing</span>
                      <div className="flex space-x-0.5 ml-1">
                        <div className={`w-1 h-1 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
                        <div className={`w-1 h-1 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: "0.1s" }}></div>
                        <div className={`w-1 h-1 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible div to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className={`p-4 border-t flex-shrink-0 ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <form onSubmit={sendMessage} className="mb-2.5">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className={`flex-1 text-xs h-9 rounded-lg px-3 ${
                      theme === 'dark' 
                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className={`h-9 w-9 rounded-lg ${
                      theme === 'dark'
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-black'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>

              {/* Quick Questions */}
              <div className="space-y-1.5">
                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quick ask:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Robotics work",
                    "AI projects",
                    "Tech stack",
                    "Learning path"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion)}
                      disabled={isLoading}
                      className={`text-xs py-1.5 px-2 rounded-lg transition-colors text-left ${
                        theme === 'dark' 
                          ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' 
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}