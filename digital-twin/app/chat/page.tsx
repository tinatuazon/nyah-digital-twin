"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioHeader } from "@/components/portfolio-header";
import { AnimatedSection } from "@/components/animated-section";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
    // Always scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! 👋 I'm an AI-powered assistant trained on Nyah's portfolio. I can answer questions about her education, projects, technical expertise, and career interests. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Remove auto-scroll to bottom after sending a message

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your question right now.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-foreground">
      {/* Clean minimalist background */}
      <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-0"></div>

      {/* Header */}
      <PortfolioHeader />

      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        {/* Chat Header - Redesigned Layout */}
        <AnimatedSection animation="fade-up">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors group mb-6">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              <span>Return to Home</span>
            </Link>
            
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">Interactive Assistant</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">Get instant answers about Nyah's portfolio, experience, and technical capabilities through AI.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Online and ready to help</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">Quick Start Topics:</p>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>• Academic projects and research</p>
                    <p>• AI & Robotics specialization</p>
                    <p>• Technical skills & tools</p>
                    <p>• Future career goals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Chat Interface - New Design */}
        <AnimatedSection animation="fade-up" delay={100}>
          <div className="grid md:grid-cols-[1fr_300px] gap-6">
            {/* Main Chat Area */}
            <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 rounded-2xl shadow-md h-[600px] flex flex-col">
              <CardHeader className="p-5 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-cyan-400 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white dark:text-black" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Chat Session</CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{messages.length} messages</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Powered by AI
                  </div>
                </div>
              </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-cyan-400 dark:bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-black" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      <div className={`text-xs mt-1.5 ${
                        message.role === "user" ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-400 dark:bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                    <div className="bg-gray-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Thinking</span>
                        <div className="flex space-x-1 ml-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Invisible div to scroll to */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="p-5 border-t border-gray-200 dark:border-zinc-800 flex-shrink-0 bg-gray-50 dark:bg-zinc-800/50">
                <form onSubmit={sendMessage}>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your question here..."
                      className="flex-1 bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl h-11 px-4"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar with Suggestions */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 rounded-2xl shadow-md p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Example Questions</h3>
              <div className="space-y-2">
                {[
                  "Which robotics frameworks do you use?",
                  "Explain your object detection project",
                  "What's your academic focus?",
                  "How did you learn AI development?",
                  "What tools do you work with?"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    disabled={isLoading}
                    className="w-full text-left p-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors border border-transparent hover:border-blue-600 dark:hover:border-cyan-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="bg-blue-50 dark:bg-zinc-800 border-blue-100 dark:border-zinc-700 rounded-2xl shadow-md p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💡 Pro Tip</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                For the most detailed responses, ask specific questions about projects, technologies, or learning experiences.
              </p>
            </Card>
          </div>
        </div>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection
          animation="fade-in"
          delay={200}
          className="mt-12 py-8 text-center text-sm text-gray-600 dark:text-gray-400"
        >
          <p>© {new Date().getFullYear()} Nyah Ostonal. All rights reserved.</p>
        </AnimatedSection>
      </div>
    </main>
  );
}