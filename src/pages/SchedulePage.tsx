import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, Zap, BatteryCharging, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SchedulePage = () => {
  const { schedules, addSchedule, removeSchedule, toggleSchedule } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    days: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "17:00",
    mode: "v2g" as "charging" | "v2g",
    targetSoc: 80,
    minSoc: 30,
  });

  const handleCreateSchedule = () => {
    addSchedule({
      id: `SCH-${Date.now()}`,
      name: newSchedule.name || "My Schedule",
      type: "recurring",
      days: newSchedule.days,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      mode: newSchedule.mode,
      targetSoc: newSchedule.mode === "charging" ? newSchedule.targetSoc : undefined,
      minSoc: newSchedule.mode === "v2g" ? newSchedule.minSoc : undefined,
      isActive: true,
    });
    setIsDialogOpen(false);
    setNewSchedule({
      name: "",
      days: [1, 2, 3, 4, 5],
      startTime: "09:00",
      endTime: "17:00",
      mode: "v2g",
      targetSoc: 80,
      minSoc: 30,
    });
  };

  const toggleDay = (day: number) => {
    setNewSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort(),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          <h1 className="font-bold text-2xl">My Schedules</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Schedule Name */}
                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input
                    placeholder="e.g., Weekday V2G"
                    value={newSchedule.name}
                    onChange={(e) =>
                      setNewSchedule((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                {/* Day Selector */}
                <div className="space-y-2">
                  <Label>Days</Label>
                  <div className="flex gap-2">
                    {DAYS.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(index)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          newSchedule.days.includes(index)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {day.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setNewSchedule((prev) => ({ ...prev, mode: "charging" }))
                      }
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl p-3 border-2 transition-all",
                        newSchedule.mode === "charging"
                          ? "border-secondary bg-secondary/10"
                          : "border-border"
                      )}
                    >
                      <BatteryCharging
                        className={cn(
                          "h-5 w-5",
                          newSchedule.mode === "charging"
                            ? "text-secondary"
                            : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "font-medium",
                          newSchedule.mode === "charging"
                            ? "text-secondary"
                            : "text-muted-foreground"
                        )}
                      >
                        Charge
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        setNewSchedule((prev) => ({ ...prev, mode: "v2g" }))
                      }
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl p-3 border-2 transition-all",
                        newSchedule.mode === "v2g"
                          ? "border-accent bg-accent/10"
                          : "border-border"
                      )}
                    >
                      <Zap
                        className={cn(
                          "h-5 w-5",
                          newSchedule.mode === "v2g"
                            ? "text-accent"
                            : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "font-medium",
                          newSchedule.mode === "v2g"
                            ? "text-accent"
                            : "text-muted-foreground"
                        )}
                      >
                        V2G
                      </span>
                    </button>
                  </div>
                </div>

                {/* SOC Slider */}
                <div className="space-y-4">
                  <Label>
                    {newSchedule.mode === "charging" ? "Target SOC" : "Minimum SOC"}
                  </Label>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {newSchedule.mode === "charging"
                        ? newSchedule.targetSoc
                        : newSchedule.minSoc}
                      %
                    </span>
                  </div>
                  <Slider
                    value={[
                      newSchedule.mode === "charging"
                        ? newSchedule.targetSoc
                        : newSchedule.minSoc,
                    ]}
                    onValueChange={(v) =>
                      setNewSchedule((prev) => ({
                        ...prev,
                        [newSchedule.mode === "charging" ? "targetSoc" : "minSoc"]:
                          v[0],
                      }))
                    }
                    min={newSchedule.mode === "charging" ? 50 : 20}
                    max={newSchedule.mode === "charging" ? 100 : 80}
                    step={5}
                  />
                </div>

                <Button className="w-full" onClick={handleCreateSchedule}>
                  Save Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-4 max-w-2xl mx-auto">
        {schedules.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Schedules Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first schedule to automate charging and V2G sessions
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className={cn(
                "transition-opacity",
                !schedule.isActive && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        schedule.mode === "charging"
                          ? "bg-secondary/20"
                          : "bg-accent/20"
                      )}
                    >
                      {schedule.mode === "charging" ? (
                        <BatteryCharging className="h-5 w-5 text-secondary" />
                      ) : (
                        <Zap className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{schedule.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {schedule.mode === "charging" ? "Charge" : "V2G"} •{" "}
                        {schedule.mode === "charging"
                          ? `Target ${schedule.targetSoc}%`
                          : `Min ${schedule.minSoc}%`}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={() => toggleSchedule(schedule.id)}
                  />
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {schedule.days.map((day) => (
                    <span
                      key={day}
                      className="rounded-full bg-muted px-2 py-1 text-xs font-medium"
                    >
                      {DAYS[day]}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
