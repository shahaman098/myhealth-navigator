import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Plus, Filter } from "lucide-react";
import TimelineList from "@/components/timeline/TimelineList";
import { TimelineEvent } from "@/components/timeline/TimelineItem";

const Timeline = () => {
  // Sample timeline events with enhanced data
  const timelineEvents: TimelineEvent[] = [
    {
      id: "1",
      type: "appointment",
      title: "Annual Physical Checkup",
      date: "2024-03-15",
      time: "10:00 AM",
      description: "Routine examination with comprehensive health assessment",
      provider: "Dr. Sarah Johnson, MD - Primary Care",
      status: "completed",
      details: `Comprehensive annual physical examination completed.\n\nVital Signs:\n• Blood Pressure: 128/82 mmHg\n• Heart Rate: 72 bpm\n• Temperature: 98.6°F\n• Weight: 165 lbs\n\nExamination Results:\n• General health: Good\n• Cardiovascular: Normal\n• Respiratory: Clear\n• Neurological: Normal\n\nRecommendations:\n• Continue current medication regimen\n• Follow up in 6 months\n• Blood work ordered for cholesterol check`,
    },
    {
      id: "2",
      type: "medication",
      title: "Started New Medication - Lisinopril",
      date: "2024-03-10",
      time: "2:30 PM",
      description: "Blood pressure management medication prescribed",
      provider: "Dr. Michael Chen, MD - Cardiology",
      status: "ongoing",
      details: `Medication: Lisinopril 10mg\nDosage: Once daily in the morning\nDuration: Ongoing\n\nPurpose: Blood pressure management for Stage 1 Hypertension\n\nInstructions:\n• Take with or without food\n• Take at the same time each day\n• Do not skip doses\n• Monitor blood pressure regularly\n\nCommon Side Effects:\n• Dizziness (especially when standing up)\n• Dry cough\n• Headache\n\nContact your doctor if you experience:\n• Severe dizziness or fainting\n• Swelling of face, lips, or tongue\n• Difficulty breathing`,
    },
    {
      id: "3",
      type: "encounter",
      title: "Cardiology Consultation",
      date: "2024-02-28",
      time: "11:00 AM",
      description: "Initial consultation for blood pressure management",
      provider: "Dr. Michael Chen, MD - Cardiology",
      status: "completed",
      details: `Chief Complaint: Elevated blood pressure readings\n\nDiagnosis: Essential Hypertension (Stage 1)\nICD-10: I10\n\nClinical Findings:\n• Average BP over past 3 months: 138/88 mmHg\n• No end-organ damage detected\n• Family history of hypertension\n\nTreatment Plan:\n1. Start Lisinopril 10mg daily\n2. Lifestyle modifications:\n   - Reduce sodium intake to <2300mg/day\n   - Regular exercise (30 min, 5x/week)\n   - Maintain healthy weight\n   - Limit alcohol consumption\n   - Stress management techniques\n\n3. Follow-up in 4 weeks to assess medication response\n4. Home blood pressure monitoring recommended`,
    },
    {
      id: "4",
      type: "treatment",
      title: "Physical Therapy - Session 3",
      date: "2024-02-25",
      time: "3:00 PM",
      description: "Therapeutic exercises for lower back pain management",
      provider: "Jane Smith, PT - Rehabilitation Center",
      status: "completed",
      details: `Session Focus: Core strengthening and flexibility\n\nExercises Performed:\n• Pelvic tilts - 3 sets of 10\n• Bird dogs - 3 sets of 10 each side\n• Cat-cow stretches - 3 sets of 10\n• Dead bugs - 3 sets of 10\n• Seated hamstring stretch - 30 sec hold, 3 reps\n\nProgress Notes:\n• Patient showing good improvement\n• Pain level decreased from 6/10 to 3/10\n• Better core engagement\n• Improved posture awareness\n\nHome Exercise Program:\n• Continue daily stretching routine\n• Add walking 20 minutes daily\n• Apply ice after exercises if needed\n\nNext Session: March 4, 2024 at 3:00 PM`,
    },
    {
      id: "5",
      type: "note",
      title: "Lab Results Review",
      date: "2024-02-20",
      description: "Complete metabolic panel results within normal ranges",
      provider: "LabCorp - Diagnostic Services",
      status: "completed",
      details: `Complete Metabolic Panel (CMP) Results:\n\nGlucose: 94 mg/dL (Normal: 70-100)\nCalcium: 9.4 mg/dL (Normal: 8.5-10.5)\nSodium: 140 mEq/L (Normal: 136-145)\nPotassium: 4.2 mEq/L (Normal: 3.5-5.0)\nCO2: 26 mEq/L (Normal: 23-29)\nChloride: 102 mEq/L (Normal: 96-106)\n\nKidney Function:\n• BUN: 16 mg/dL (Normal: 7-20)\n• Creatinine: 0.9 mg/dL (Normal: 0.6-1.2)\n• eGFR: >90 mL/min/1.73m² (Normal)\n\nLiver Function:\n• ALT: 28 U/L (Normal: 7-56)\n• AST: 24 U/L (Normal: 10-40)\n• Alkaline Phosphatase: 68 U/L (Normal: 44-147)\n• Total Protein: 7.2 g/dL (Normal: 6.3-7.9)\n• Albumin: 4.5 g/dL (Normal: 3.5-5.5)\n\nInterpretation: All values within normal limits`,
    },
    {
      id: "6",
      type: "medication",
      title: "Renewed Prescription - Vitamin D3",
      date: "2024-02-15",
      description: "Vitamin D supplement for deficiency management",
      provider: "Dr. Sarah Johnson, MD - Primary Care",
      status: "ongoing",
      details: `Medication: Vitamin D3 (Cholecalciferol)\nDosage: 2000 IU daily\nDuration: Ongoing\n\nPurpose: Vitamin D deficiency management\nLast Vitamin D Level: 22 ng/mL (Low-normal)\nTarget Level: 30-50 ng/mL\n\nInstructions:\n• Take with a meal containing fat for better absorption\n• Best taken in the morning\n• Consistent daily use is important\n\nBenefits:\n• Supports bone health\n• Enhances immune function\n• May improve mood\n• Supports muscle function\n\nFollow-up:\n• Recheck Vitamin D levels in 3 months\n• May adjust dosage based on results`,
    },
    {
      id: "7",
      type: "appointment",
      title: "Dental Cleaning & Checkup",
      date: "2024-01-28",
      time: "9:00 AM",
      description: "Routine dental prophylaxis and oral examination",
      provider: "Dr. Robert Martinez, DDS - Smile Dental",
      status: "completed",
      details: `Procedure: Routine Dental Prophylaxis\n\nExamination Findings:\n• Overall oral health: Good\n• No cavities detected\n• Gums: Healthy, no signs of periodontal disease\n• No areas of concern\n\nServices Performed:\n• Professional teeth cleaning (prophylaxis)\n• Plaque and tartar removal\n• Polishing\n• Fluoride treatment\n• Oral cancer screening - negative\n\nRecommendations:\n• Continue brushing twice daily\n• Floss at least once daily\n• Consider electric toothbrush for better plaque removal\n• Limit sugary foods and drinks\n\nNext Appointment: July 2024 (6 months)`,
    },
    {
      id: "8",
      type: "provider",
      title: "New Provider Added to Care Team",
      date: "2024-01-15",
      description: "Referred to specialist for comprehensive care",
      provider: "Dr. Michael Chen, MD - Cardiology Associates",
      details: `Provider Information:\n\nName: Dr. Michael Chen, MD, FACC\nSpecialty: Cardiology\nCredentials: Board Certified Cardiologist\n\nClinic: Cardiology Associates\nAddress: 456 Heart Health Way, Medical Plaza, Suite 200\nPhone: (555) 123-4567\nFax: (555) 123-4568\n\nOffice Hours:\n• Monday-Thursday: 8:00 AM - 5:00 PM\n• Friday: 8:00 AM - 3:00 PM\n• Saturday-Sunday: Closed\n\nReason for Referral:\nManagement of Stage 1 Hypertension and cardiovascular risk assessment\n\nAccepting Patients: Yes\nAccepts Insurance: Most major insurers`,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Your Health Timeline
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Track your complete health journey in one unified, chronological view
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="default" className="shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter Events
            </Button>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask AI Assistant
            </Button>
          </div>
        </div>

        {/* Timeline List */}
        <TimelineList 
          events={timelineEvents}
          emptyMessage="No health events recorded yet. Start by adding your first appointment or medication."
        />

        {/* AI Assistant CTA */}
        <Card className="mt-12 p-8 bg-gradient-card border-primary/10 shadow-md">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">
              Need Help Understanding Your Timeline?
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Our AI assistant can explain any health event, medication, diagnosis, or treatment in simple, 
              easy-to-understand language. Just ask!
            </p>
            <Button size="lg" className="shadow-glow">
              <MessageSquare className="h-5 w-5 mr-2" />
              Talk to AI Assistant
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Timeline;
