import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Bike, Mail, Lock, User, Phone, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth, RegisterData } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  bikeModel: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegisterFormData | null>(null);
  const { login, register, resetPassword } = useAuth();

  // Form hooks
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });



  // Handlers
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back, rider!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Send OTP to backend
      await api.post('/auth/send-otp', { email: data.email });

      setRegistrationData(data);
      setShowOtpStep(true);
      toast.success('Please check your email for OTP verification!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (data: OtpFormData) => {
    setIsLoading(true);
    try {
      if (!registrationData) {
        throw new Error('Registration data not found. Please try again.');
      }

      // Complete registration with OTP
      const registerData: RegisterData = {
        username: registrationData.username,
        name: registrationData.name,
        email: registrationData.email,
        password: registrationData.password,
        phone: registrationData.phone,
        licenseNumber: registrationData.licenseNumber,
        bloodGroup: registrationData.bloodGroup,
        bikeModel: registrationData.bikeModel,
        otp: data.otp,
      };
      await register(registerData);

      toast.success('Email verified! Welcome to Moto Connect!');
      setShowOtpStep(false);
      setRegistrationData(null);
      otpForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      toast.success('Password reset email sent! Please check your email.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (!registrationData) return;

    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', { email: registrationData.email });
      toast.success('OTP resent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToRegistration = () => {
    setShowOtpStep(false);
    setRegistrationData(null);
    otpForm.reset();
  };

  // Show OTP verification step
  if (showOtpStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Verify Your Email
            </h1>
            <p className="text-gray-400 mt-2">Enter the 6-digit code sent to your email</p>
          </div>

          {/* OTP Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center">Email Verification</CardTitle>
              <CardDescription className="text-center">
                We sent a verification code to <br />
                <span className="text-orange-500 font-medium">{registrationData?.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={otpForm.handleSubmit(handleOtpVerification)} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white text-center block">Enter OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpForm.watch('otp') || ''}
                      onChange={(value) => otpForm.setValue('otp', value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="bg-slate-700 border-slate-600 text-white" />
                        <InputOTPSlot index={1} className="bg-slate-700 border-slate-600 text-white" />
                        <InputOTPSlot index={2} className="bg-slate-700 border-slate-600 text-white" />
                        <InputOTPSlot index={3} className="bg-slate-700 border-slate-600 text-white" />
                        <InputOTPSlot index={4} className="bg-slate-700 border-slate-600 text-white" />
                        <InputOTPSlot index={5} className="bg-slate-700 border-slate-600 text-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {otpForm.formState.errors.otp && (
                    <p className="text-red-400 text-sm text-center">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                  disabled={isLoading || !otpForm.watch('otp') || otpForm.watch('otp')?.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-gray-400 text-sm">Didn't receive the code?</p>
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resendOTP}
                      disabled={isLoading}
                      className="text-orange-500 hover:text-orange-400 p-0"
                    >
                      Resend OTP
                    </Button>
                    <span className="text-gray-400">|</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={goBackToRegistration}
                      className="text-blue-500 hover:text-blue-400 p-0"
                    >
                      Change Email
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-full animate-pulse">
              <Bike className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            Moto Connect
          </h1>
          <p className="text-gray-400 mt-2">Join the ultimate rider community</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader>
                <CardTitle className="text-white">Welcome Back</CardTitle>
                <CardDescription>Sign in to your Moto Connect account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="rider@example.com"
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                        {...loginForm.register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-4">
                  <Tabs defaultValue="forgot" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 bg-transparent">
                      <TabsTrigger value="forgot" className="text-orange-500 hover:text-orange-400 p-0 h-auto bg-transparent border-none">
                        Forgot Password?
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="forgot" className="mt-4">
                      <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="resetEmail" className="text-white">Email</Label>
                          <Input
                            id="resetEmail"
                            type="email"
                            placeholder="Enter your email"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                            {...forgotPasswordForm.register('email')}
                          />
                          {forgotPasswordForm.formState.errors.email && (
                            <p className="text-red-400 text-sm">{forgotPasswordForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Sending...' : 'Send Reset Email'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <CardHeader>
                <CardTitle className="text-white">Join the Community</CardTitle>
                <CardDescription>Create your Moto Connect account with email verification</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regUsername" className="text-white">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="regUsername"
                        placeholder="Choose a unique username"
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                        {...registerForm.register('username')}
                      />
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regName" className="text-white">Name</Label>
                      <Input
                        id="regName"
                        placeholder="Full Name"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                        {...registerForm.register('name')}
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPhone" className="text-white">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="regPhone"
                          placeholder="Phone Number"
                          className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          {...registerForm.register('phone')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regEmail" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder="rider@example.com"
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                        {...registerForm.register('email')}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regPassword" className="text-white">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="regPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          {...registerForm.register('password')}
                        />
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">Confirm</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          {...registerForm.register('confirmPassword')}
                        />
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="text-white">License No.</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="DL1234567890"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                        {...registerForm.register('licenseNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup" className="text-white">Blood Group</Label>
                      <Select onValueChange={(value) => registerForm.setValue('bloodGroup', value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                            <SelectItem key={type} value={type} className="text-white hover:bg-slate-600">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bikeModel" className="text-white">Bike Model</Label>
                    <div className="relative">
                      <Bike className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="bikeModel"
                        placeholder="e.g., Harley Davidson Street 750"
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                        {...registerForm.register('bikeModel')}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account & Send OTP'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>Demo credentials: admin@motoconnect.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
