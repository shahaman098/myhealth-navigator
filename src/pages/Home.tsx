import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageSquare, Calendar, Activity, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: "Unified Timeline",
      description: "See your complete health journey in one place - diagnoses, treatments, and progress.",
    },
    {
      icon: MessageSquare,
      title: "AI Health Assistant",
      description: "Get clear, simple explanations of your health information in plain language.",
    },
    {
      icon: Calendar,
      title: "Smart Tracking",
      description: "Never miss appointments, medications, or follow-ups with intelligent reminders.",
    },
    {
      icon: Shield,
      title: "Your Data, Your Control",
      description: "All your information is private, secure, and always under your control.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Your Personal Health Navigator</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Take Control of Your{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Health Journey
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              MyHealth Companion helps you understand your health with AI-powered insights,
              simple explanations, and tools to track your care across all providers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg shadow-glow hover:shadow-lg"
              onClick={() => navigate("/dashboard")}
            >
              <Heart className="h-5 w-5 mr-2" />
              Get Started
            </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg"
                onClick={() => navigate("/ai-health-guide")}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Talk to AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Designed to reduce confusion and anxiety by putting you in charge of your health information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 hover:shadow-md transition-smooth border-border/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center bg-gradient-card border-border/50 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your journey toward better understanding and managing your health today.
            </p>
            <Button 
              size="lg" 
              className="text-lg shadow-glow"
              onClick={() => navigate("/dashboard")}
            >
              <Activity className="h-5 w-5 mr-2" />
              View Your Dashboard
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
