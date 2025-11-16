import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your MyHealth AI Assistant. I can help you understand your diagnoses, medications, test results, and treatment plans in simple language. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");

  const suggestedQuestions = [
    "What does my blood pressure reading mean?",
    "Can you explain my diagnosis in simple terms?",
    "What should I know about my new medication?",
    "When should I schedule my follow-up?",
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
    };

    // Simulate AI response
    const aiResponse: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: "I understand you're asking about that. Let me help you understand this in simple terms...",
    };

    setMessages([...messages, userMessage, aiResponse]);
    setInput("");
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">AI Health Assistant</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Ask questions about your health information in plain language
          </p>
        </div>

        <Card className="flex flex-col h-[600px]">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="p-2 rounded-lg bg-primary/10 h-fit">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                  </div>

                  {message.role === "user" && (
                    <div className="p-2 rounded-lg bg-accent/10 h-fit">
                      <User className="h-5 w-5 text-accent" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {messages.length === 1 && (
            <div className="p-6 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Suggested questions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto py-3"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your health..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button 
                onClick={handleSend} 
                className="self-end"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This AI assistant helps explain health information but doesn't replace professional medical advice.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Assistant;
