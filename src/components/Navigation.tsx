import { Heart, Calendar, MessageSquare, Home, Activity, LayoutDashboard, FileText, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const Navigation = () => {
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Activity, label: "Timeline", path: "/timeline" },
    { icon: MessageSquare, label: "AI Assistant", path: "/assistant" },
    { icon: Calendar, label: "Appointments", path: "/appointments" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl text-foreground">MyHealth Companion</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                activeClassName="text-primary bg-primary/10"
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
