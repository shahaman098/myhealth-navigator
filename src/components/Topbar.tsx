import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function Topbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full glass-strong">
      <div className="flex h-16 items-center px-4 gap-4">
        <SidebarTrigger className="h-8 w-8" aria-label="Toggle sidebar" />
        
        <div className="flex-1" />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="glass" size="icon" className="relative" aria-label="View notifications">
              <Bell className="h-5 w-5" aria-hidden="true" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                aria-label="3 unread notifications"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto" role="list">
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3" role="listitem">
                <div className="font-medium">Appointment Reminder</div>
                <div className="text-xs text-muted-foreground">
                  Follow-up with Dr. Chen tomorrow at 10:00 AM
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3" role="listitem">
                <div className="font-medium">Lab Results Available</div>
                <div className="text-xs text-muted-foreground">
                  Your recent blood work results are ready to view
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3" role="listitem">
                <div className="font-medium">Medication Reminder</div>
                <div className="text-xs text-muted-foreground">
                  Time to take your Lisinopril (10mg)
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="glass" size="icon" className="rounded-full" aria-label="User menu">
              <User className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            <DropdownMenuLabel>Sarah Johnson</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
