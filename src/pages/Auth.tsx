import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Heart, UserCircle, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const signUpSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(100),
  fullName: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  role: z.enum(['doctor', 'patient'], { required_error: 'Please select a role' }),
});

const signInSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export default function Auth() {
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'patient' as UserRole,
  });
  
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: '',
  });
  
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrors({});
    setIsLoading(true);

    try {
      const validated = signUpSchema.parse(signUpForm);
      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.fullName,
        validated.role
      );

      if (error) {
        toast({
          title: 'Sign up failed',
          description: error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success!',
          description: 'Your account has been created. Please sign in.',
        });
        // Reset form
        setSignUpForm({
          email: '',
          password: '',
          fullName: '',
          role: 'patient',
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setSignUpErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});
    setIsLoading(true);

    try {
      const validated = signInSchema.parse(signInForm);
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setSignInErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-3xl font-bold">MyHealth Companion</CardTitle>
          <CardDescription>Sign in or create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                    aria-invalid={!!signInErrors.email}
                    aria-describedby={signInErrors.email ? "signin-email-error" : undefined}
                    required
                  />
                  {signInErrors.email && (
                    <p id="signin-email-error" className="text-sm text-destructive" role="alert">
                      {signInErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                    aria-invalid={!!signInErrors.password}
                    aria-describedby={signInErrors.password ? "signin-password-error" : undefined}
                    required
                  />
                  {signInErrors.password && (
                    <p id="signin-password-error" className="text-sm text-destructive" role="alert">
                      {signInErrors.password}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpForm.fullName}
                    onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                    aria-invalid={!!signUpErrors.fullName}
                    aria-describedby={signUpErrors.fullName ? "signup-name-error" : undefined}
                    required
                  />
                  {signUpErrors.fullName && (
                    <p id="signup-name-error" className="text-sm text-destructive" role="alert">
                      {signUpErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                    aria-invalid={!!signUpErrors.email}
                    aria-describedby={signUpErrors.email ? "signup-email-error" : undefined}
                    required
                  />
                  {signUpErrors.email && (
                    <p id="signup-email-error" className="text-sm text-destructive" role="alert">
                      {signUpErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                    aria-invalid={!!signUpErrors.password}
                    aria-describedby={signUpErrors.password ? "signup-password-error" : undefined}
                    required
                  />
                  {signUpErrors.password && (
                    <p id="signup-password-error" className="text-sm text-destructive" role="alert">
                      {signUpErrors.password}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>I am a</Label>
                  <RadioGroup
                    value={signUpForm.role}
                    onValueChange={(value) => setSignUpForm({ ...signUpForm, role: value as UserRole })}
                    aria-label="Select your role"
                  >
                    <div className="flex items-center space-x-2 glass-subtle p-3 rounded-lg hover:glass transition-smooth">
                      <RadioGroupItem value="patient" id="patient" />
                      <Label htmlFor="patient" className="flex items-center gap-2 cursor-pointer flex-1">
                        <UserCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                        <div>
                          <div className="font-medium">Patient</div>
                          <div className="text-xs text-muted-foreground">Managing my health</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 glass-subtle p-3 rounded-lg hover:glass transition-smooth">
                      <RadioGroupItem value="doctor" id="doctor" />
                      <Label htmlFor="doctor" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Stethoscope className="h-5 w-5 text-secondary" aria-hidden="true" />
                        <div>
                          <div className="font-medium">Doctor</div>
                          <div className="text-xs text-muted-foreground">Providing healthcare</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  {signUpErrors.role && (
                    <p className="text-sm text-destructive" role="alert">
                      {signUpErrors.role}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
