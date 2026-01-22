import { useState } from "react";
import { Zap, Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Check, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCreateVehicle } from "@/hooks/useVehicles";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const RegisterPage = () => {
  const [step, setStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const createVehicle = useCreateVehicle();
  const navigate = useNavigate();

  // Step 1 - Account Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Step 2 - Vehicle Info
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [connectorType, setConnectorType] = useState("");

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();

  const handleNext = async () => {
    if (step === 1) {
      if (!name || !email || !password || !confirmPassword) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (!agreeTerms) {
        toast.error("Please agree to the terms and conditions");
        return;
      }

      setIsLoading(true);
      const { error } = await signUp(email, password, name);
      
      if (error) {
        toast.error(error.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep(2);
    } else if (step === 2) {
      if (!vehicleBrand || !vehicleModel || !batteryCapacity || !licensePlate || !connectorType) {
        toast.error("Please fill in all vehicle details");
        return;
      }
      
      setIsLoading(true);
      try {
        await createVehicle.mutateAsync({
          brand: vehicleBrand,
          model: vehicleModel,
          battery_capacity: parseFloat(batteryCapacity),
          license_plate: licensePlate,
          connector_type: connectorType.toUpperCase(),
          is_primary: true,
        });
        setStep(3);
      } catch (error: any) {
        toast.error(error.message || "Failed to add vehicle");
      }
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    toast.success("Registration complete! Welcome to MCUT V2G Platform");
    navigate("/");
  };

  const handleSkipVehicle = () => {
    setStep(3);
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
              step >= s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div
              className={cn(
                "w-8 h-1 mx-1 rounded",
                step > s ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Back Button */}
          {step > 1 && step < 3 && (
            <button
              onClick={() => setStep((step - 1) as Step)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {step === 1 && (
            <Link
              to="/login"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          )}

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-3">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator />

          {/* Step 1 - Account Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">Create Account</h2>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1 flex-1 rounded",
                          passwordStrength >= level
                            ? passwordStrength <= 1
                              ? "bg-destructive"
                              : passwordStrength === 2
                              ? "bg-accent"
                              : "bg-secondary"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button onClick={handleNext} className="w-full h-12" size="lg" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Next"}
              </Button>
            </div>
          )}

          {/* Step 2 - Vehicle Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">Vehicle Information</h2>

              <div className="space-y-2">
                <Label>Vehicle Brand *</Label>
                <Select value={vehicleBrand} onValueChange={setVehicleBrand} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tesla">Tesla</SelectItem>
                    <SelectItem value="Nissan">Nissan</SelectItem>
                    <SelectItem value="BYD">BYD</SelectItem>
                    <SelectItem value="BMW">BMW</SelectItem>
                    <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                    <SelectItem value="Hyundai">Hyundai</SelectItem>
                    <SelectItem value="Kia">Kia</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Vehicle Model *</Label>
                <Input
                  id="model"
                  placeholder="e.g., Model Y"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="battery">Battery Capacity (kWh) *</Label>
                <Input
                  id="battery"
                  type="number"
                  placeholder="e.g., 60"
                  value={batteryCapacity}
                  onChange={(e) => setBatteryCapacity(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Check your vehicle's specifications for the exact capacity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plate">License Plate *</Label>
                <Input
                  id="plate"
                  placeholder="e.g., ABC-1234"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Connector Type *</Label>
                <Select value={connectorType} onValueChange={setConnectorType} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CCS2">CCS2</SelectItem>
                    <SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
                    <SelectItem value="Type2">Type 2</SelectItem>
                    <SelectItem value="GB/T">GB/T</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleNext} className="w-full h-12" size="lg" disabled={isLoading}>
                {isLoading ? "Adding vehicle..." : "Next"}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleSkipVehicle} 
                className="w-full" 
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </div>
          )}

          {/* Step 3 - Complete */}
          {step === 3 && (
            <div className="text-center space-y-6 py-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 mx-auto">
                <Check className="h-10 w-10 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Registration Complete!
                </h2>
                <p className="text-muted-foreground">
                  Welcome to MCUT V2G Platform. Start managing your energy today.
                </p>
              </div>
              <Button
                onClick={handleComplete}
                className="w-full h-12 bg-secondary hover:bg-secondary/90"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Using V2G
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
