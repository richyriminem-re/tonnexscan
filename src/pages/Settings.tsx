import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, AlertTriangle, FileText, Zap } from "lucide-react";

const Settings = () => {
  const [delayTime, setDelayTime] = useState("4");
  const [duplicateHandling, setDuplicateHandling] = useState("highlight");
  const [defaultFormat, setDefaultFormat] = useState("xlsx");
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [batchModeEnabled, setBatchModeEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Scanner Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-light rounded-lg p-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Scanner Settings</h2>
          </div>

          <div className="space-y-6">
            {/* Delay Time */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Scan Delay Time
              </Label>
              <RadioGroup value={delayTime} onValueChange={setDelayTime}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="delay-2" />
                  <Label htmlFor="delay-2">2 seconds</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="delay-4" />
                  <Label htmlFor="delay-4">4 seconds (recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6" id="delay-6" />
                  <Label htmlFor="delay-6">6 seconds</Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                Time to wait between scans to prevent accidental double scanning.
              </p>
            </div>

            {/* Batch Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Continuous Batch Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Keep scanner active for multiple consecutive scans
                </p>
              </div>
              <Switch 
                checked={batchModeEnabled} 
                onCheckedChange={setBatchModeEnabled}
              />
            </div>

            {/* Flashlight */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Auto Flashlight</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically enable flashlight in low light conditions
                </p>
              </div>
              <Switch 
                checked={flashlightEnabled} 
                onCheckedChange={setFlashlightEnabled}
              />
            </div>
          </div>
        </Card>

        {/* Duplicate Detection */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-warning-light rounded-lg p-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <h2 className="text-xl font-semibold">Duplicate Detection</h2>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">When duplicate is found:</Label>
            <RadioGroup value={duplicateHandling} onValueChange={setDuplicateHandling}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="highlight" id="highlight" />
                <Label htmlFor="highlight">Highlight and allow</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip">Skip duplicate entries</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="confirm" id="confirm" />
                <Label htmlFor="confirm">Ask for confirmation</Label>
              </div>
            </RadioGroup>
          </div>
        </Card>

        {/* Export Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-success-light rounded-lg p-2">
              <FileText className="h-5 w-5 text-success" />
            </div>
            <h2 className="text-xl font-semibold">Export Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Default Export Format</Label>
              <Select value={defaultFormat} onValueChange={setDefaultFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="txt">Text (.txt)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Feedback Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-accent rounded-lg p-2">
              <Zap className="h-5 w-5 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Feedback</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds for scan success and errors
                </p>
              </div>
              <Switch 
                checked={soundEnabled} 
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Vibration</Label>
                <p className="text-sm text-muted-foreground">
                  Vibrate on successful scans (mobile only)
                </p>
              </div>
              <Switch 
                checked={vibrateEnabled} 
                onCheckedChange={setVibrateEnabled}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="pt-4">
          <Button className="w-full" size="lg">
            Save Settings
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;