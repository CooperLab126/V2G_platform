import { ChevronRight, User, Car, CreditCard, Bell, Globe, Moon, HelpCircle, FileText, Shield, LogOut, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { Link, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");
  const [defaultTargetSoc, setDefaultTargetSoc] = useState(80);
  const [defaultMinSoc, setDefaultMinSoc] = useState(30);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 lg:px-8">
          <h1 className="font-bold text-2xl">Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-6 max-w-2xl mx-auto">
        {/* Profile Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Account</h3>
          <Card>
            <CardContent className="p-0">
              <Link
                to="/settings/vehicles"
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <span>My Vehicles</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span>Payment Methods</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Preferences</h3>
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span>Language</span>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <span>Theme</span>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Default Target SOC</span>
                  <span className="font-medium">{defaultTargetSoc}%</span>
                </div>
                <Slider
                  value={[defaultTargetSoc]}
                  onValueChange={(v) => setDefaultTargetSoc(v[0])}
                  min={50}
                  max={100}
                  step={5}
                />
              </div>
              <Separator />
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Default Minimum SOC</span>
                  <span className="font-medium">{defaultMinSoc}%</span>
                </div>
                <Slider
                  value={[defaultMinSoc]}
                  onValueChange={(v) => setDefaultMinSoc(v[0])}
                  min={20}
                  max={80}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Notifications</h3>
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span>Push Notifications</span>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span>Email Notifications</span>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Support</h3>
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <span>Help Center</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>Terms of Service</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground pb-8">
          MCUT V2G Platform • v1.0.0
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
