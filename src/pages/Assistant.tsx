import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Sparkles, Heart, AlertCircle, FileQuestion, Pill, Calendar, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatBubble from "@/components/chat/ChatBubble";
import QuickPromptCard from "@/components/chat/QuickPromptCard";
import { useHealthChat } from "@/hooks/useHealthChat";

const Assistant = () => {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, cancelRequest } = useHealthChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = [
    {
      icon: AlertCircle,
      title: "Explain My Diagnosis",
      prompt: "Can you explain my diagnosis in simple, everyday language? I want to understand what it means for me.",
    },
    {
      icon: FileQuestion,
      title: "What's Next?",
      prompt: "What should I expect next in my treatment? What are the next steps in my care plan?",
    },
    {
      icon: Pill,
      title: "About My Medication",
      prompt: "Can you explain what my medication does and why it was prescribed? Are there any important things I should know?",
    },
    {
      icon: Calendar,
      title: "Summarize My Care",
      prompt: "Can you give me a summary of my recent appointments, treatments, and overall care plan?",
    },
  ];

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    setInput(prompt);
    textareaRef.current?.focus();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-hero shadow-glow">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">AI Health Guide</h1>
              <p className="text-muted-foreground">
                Your compassionate companion for understanding health information
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Quick Prompts Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 bg-gradient-card border-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Quick Questions</h3>
              </div>
              <div className="space-y-3">
                {quickPrompts.map((prompt, index) => (
                  <QuickPromptCard
                    key={index}
                    icon={prompt.icon}
                    title={prompt.title}
                    prompt={prompt.prompt}
                    onClick={handleQuickPrompt}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </Card>

            {/* Helpful Tips */}
            <Card className="p-4 bg-muted/50 border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-secondary" />
                <h4 className="font-medium text-sm text-foreground">Helpful Tips</h4>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• Ask questions in your own words</li>
                <li>• I can explain medical terms simply</li>
                <li>• Feel free to ask follow-up questions</li>
                <li>• I'm here to help you understand, not replace your doctor</li>
              </ul>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col h-[calc(100vh-240px)] shadow-lg">
              {/* Messages */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-6">
                  {messages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      role={message.role}
                      content={message.content}
                    />
                  ))}
                  {isLoading && (
                    <ChatBubble role="assistant" content="" isTyping />
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-6 border-t border-border bg-muted/30">
                <div className="flex gap-3">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about your health..."
                    className="min-h-[60px] max-h-[120px] resize-none bg-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isLoading}
                  />
                  {isLoading ? (
                    <Button
                      onClick={cancelRequest}
                      variant="outline"
                      className="self-end"
                      size="icon"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSend}
                      className="self-end shadow-md"
                      disabled={!input.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  This AI helps explain health information but doesn't replace professional medical advice. 
                  Always consult your healthcare provider for medical decisions.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
