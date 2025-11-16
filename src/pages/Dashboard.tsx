import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  Activity, 
  MessageSquare, 
  Pill, 
  Download,
  Clock,
  MapPin,
  FileText,
  Bell,
  TrendingUp,
  Heart
} from "lucide-react";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  // Mock patient data
  const patientInfo = {
    name: "Sarah Johnson",
    age: 42,
    dateOfBirth: "1982-03-15",
    bloodType: "A+",
    allergies: ["Penicillin", "Shellfish"],
    primaryPhysician: "Dr. Michael Chen, MD",
  };

  const upcomingAppointments = [
    {
      id: 1,
      title: "Follow-up: Blood Pressure Check",
      provider: "Dr. Michael Chen",
      date: "2024-04-15",
      time: "10:00 AM",
      location: "Heart Health Center",
      type: "In-Person",
    },
    {
      id: 2,
      title: "Annual Eye Exam",
      provider: "Dr. Emily Brown",
      date: "2024-04-22",
      time: "2:30 PM",
      location: "Vision Care Clinic",
      type: "In-Person",
    },
    {
      id: 3,
      title: "Medication Review",
      provider: "Dr. Sarah Johnson",
      date: "2024-05-05",
      time: "9:00 AM",
      location: "Virtual",
      type: "Telehealth",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "medication",
      title: "Started Lisinopril 10mg",
      date: "2024-03-10",
      icon: Pill,
    },
    {
      id: 2,
      type: "appointment",
      title: "Annual Physical Completed",
      date: "2024-03-15",
      icon: Calendar,
    },
    {
      id: 3,
      type: "lab",
      title: "Blood Work Results Available",
      date: "2024-02-20",
      icon: FileText,
    },
  ];

  const healthMetrics = [
    {
      label: "Blood Pressure",
      value: "128/82",
      unit: "mmHg",
      status: "good",
      icon: Heart,
    },
    {
      label: "Weight",
      value: "165",
      unit: "lbs",
      status: "good",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {patientInfo.name.split(" ")[0]}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's your health overview
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Profile Card */}
            <Card className="p-6 bg-gradient-card border-primary/10 shadow-md">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {patientInfo.name}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Age: {patientInfo.age} • DOB: {new Date(patientInfo.dateOfBirth).toLocaleDateString()}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                      <p className="text-foreground font-semibold">{patientInfo.bloodType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primary Physician</p>
                      <p className="text-foreground font-semibold">{patientInfo.primaryPhysician}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Known Allergies</p>
                      <div className="flex flex-wrap gap-2">
                        {patientInfo.allergies.map((allergy) => (
                          <Badge key={allergy} variant="destructive">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Health Metrics */}
            <div className="grid md:grid-cols-2 gap-4">
              {healthMetrics.map((metric) => (
                <Card key={metric.label} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-3xl font-bold text-foreground">
                        {metric.value}
                        <span className="text-lg text-muted-foreground ml-1">{metric.unit}</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <metric.icon className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Upcoming Appointments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Appointments
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/appointments")}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingAppointments.slice(0, 2).map((appointment) => (
                  <Card key={appointment.id} className="p-4 bg-muted/30 hover:bg-muted/50 transition-smooth">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{appointment.title}</h4>
                          <Badge variant={appointment.type === "Telehealth" ? "secondary" : "default"} className="text-xs">
                            {appointment.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {appointment.provider}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appointment.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {appointment.location}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Bell className="h-4 w-4 mr-1" />
                        Remind
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid gap-4">
                <QuickActionCard
                  icon={Activity}
                  title="View Timeline"
                  description="See your complete health journey"
                  href="/timeline"
                  color="primary"
                />
                <QuickActionCard
                  icon={MessageSquare}
                  title="Ask AI Guide"
                  description="Get health questions answered"
                  href="/assistant"
                  color="secondary"
                />
                <QuickActionCard
                  icon={Pill}
                  title="My Medications"
                  description="View and manage prescriptions"
                  href="/timeline"
                  color="accent"
                />
                <QuickActionCard
                  icon={Download}
                  title="Download Records"
                  description="Export your health data"
                  href="/timeline"
                  color="primary"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <activity.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => navigate("/timeline")}
              >
                View Full Timeline
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
