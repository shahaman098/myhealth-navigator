import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Plus, Bell } from "lucide-react";

const Appointments = () => {
  const upcomingAppointments = [
    {
      id: 1,
      title: "Follow-up: Blood Pressure Check",
      provider: "Dr. Michael Chen",
      specialty: "Cardiologist",
      date: "2024-04-15",
      time: "10:00 AM",
      location: "Heart Health Center, 123 Medical Plaza",
      type: "In-Person",
    },
    {
      id: 2,
      title: "Annual Eye Exam",
      provider: "Dr. Emily Brown",
      specialty: "Ophthalmologist",
      date: "2024-04-22",
      time: "2:30 PM",
      location: "Vision Care Clinic, 456 Health Ave",
      type: "In-Person",
    },
    {
      id: 3,
      title: "Medication Review",
      provider: "Dr. Sarah Johnson",
      specialty: "Primary Care",
      date: "2024-05-05",
      time: "9:00 AM",
      location: "Virtual",
      type: "Telehealth",
    },
  ];

  const pastAppointments = [
    {
      id: 4,
      title: "Annual Physical",
      provider: "Dr. Sarah Johnson",
      date: "2024-03-15",
      status: "Completed",
    },
    {
      id: 5,
      title: "Lab Work",
      provider: "LabCorp",
      date: "2024-02-28",
      status: "Completed",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Appointments</h1>
            <p className="text-lg text-muted-foreground">
              Manage your healthcare appointments and never miss a visit
            </p>
          </div>
          <Button className="shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Appointment
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Upcoming Appointments
          </h2>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-6 hover:shadow-md transition-smooth">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {appointment.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {appointment.provider} • {appointment.specialty}
                        </p>
                      </div>
                      <Badge 
                        variant={appointment.type === "Telehealth" ? "secondary" : "default"}
                      >
                        {appointment.type}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(appointment.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.location}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Bell className="h-4 w-4 mr-2" />
                        Set Reminder
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Past Appointments */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Past Appointments</h2>
          <div className="space-y-3">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{appointment.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {appointment.provider} • {new Date(appointment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{appointment.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
