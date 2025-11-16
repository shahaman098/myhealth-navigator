import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  conditions?: string;
  medications?: string;
  healthConcern?: string;
  goal?: string;
}

interface MultiStepSignupProps {
  onSubmit: (data: SignupData) => Promise<void>;
  isLoading: boolean;
  onSwitchToSignIn: () => void;
}

const step1Schema = z.object({
  fullName: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(100),
});

export function MultiStepSignup({ onSubmit, isLoading, onSwitchToSignIn }: MultiStepSignupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignupData>({
    fullName: '',
    email: '',
    password: '',
    conditions: '',
    medications: '',
    healthConcern: '',
    goal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    setErrors({});
    
    if (step === 1) {
      try {
        step1Schema.parse({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        });
        setStep(2);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(newErrors);
        }
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  const progress = (step / 3) * 100;

  return (
    <Card className="glass w-full">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl">
            {step === 1 && "Let's get you started"}
            {step === 2 && "Tell us about your health"}
            {step === 3 && "Review your details"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Create your account to get started"}
            {step === 2 && "Help us personalize your experience (optional)"}
            {step === 3 && "Check everything looks good"}
          </CardDescription>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                disabled={isLoading}
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                disabled={isLoading}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                disabled={isLoading}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={handleNext}
                className="w-full"
                disabled={isLoading}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditions">Existing Conditions</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="e.g., Diabetes, Hypertension..."
                disabled={isLoading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Optional - helps personalize your care</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                placeholder="e.g., Metformin, Lisinopril..."
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthConcern">Main Health Concern</Label>
              <Textarea
                id="healthConcern"
                value={formData.healthConcern}
                onChange={(e) => setFormData({ ...formData, healthConcern: e.target.value })}
                placeholder="What brings you here today?"
                disabled={isLoading}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Personal Health Goal</Label>
              <Textarea
                id="goal"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="e.g., Better sleep, weight management..."
                disabled={isLoading}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1"
                disabled={isLoading}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="glass-subtle rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{formData.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{formData.email}</p>
              </div>
              
              {(formData.conditions || formData.medications || formData.healthConcern || formData.goal) && (
                <>
                  <div className="h-px bg-border" />
                  <p className="text-sm font-medium">Health Information</p>
                  
                  {formData.conditions && (
                    <div>
                      <p className="text-sm text-muted-foreground">Conditions</p>
                      <p className="text-sm">{formData.conditions}</p>
                    </div>
                  )}
                  {formData.medications && (
                    <div>
                      <p className="text-sm text-muted-foreground">Medications</p>
                      <p className="text-sm">{formData.medications}</p>
                    </div>
                  )}
                  {formData.healthConcern && (
                    <div>
                      <p className="text-sm text-muted-foreground">Main Concern</p>
                      <p className="text-sm">{formData.healthConcern}</p>
                    </div>
                  )}
                  {formData.goal && (
                    <div>
                      <p className="text-sm text-muted-foreground">Health Goal</p>
                      <p className="text-sm">{formData.goal}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Creating account...'
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create My Account
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}