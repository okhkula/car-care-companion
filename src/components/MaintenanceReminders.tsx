import { useState } from "react";
import { Wrench, Check, Plus, Trash2, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useMaintenanceReminders, MaintenanceReminder } from "@/hooks/useMaintenanceReminders";
import { toast } from "sonner";

interface Props {
  carId: string;
  carMileage: number | null;
  carName: string;
}

const serviceIcons: Record<string, string> = {
  "Oil Change": "🛢️",
  "Tire Rotation": "🔄",
  "Brake Inspection": "🛑",
  "Air Filter Replacement": "🌬️",
  "Coolant Flush": "❄️",
};

const MaintenanceReminders = ({ carId, carMileage, carName }: Props) => {
  const { reminders, loading, markDone, deleteReminder, addReminder } = useMaintenanceReminders(carId);
  const [expanded, setExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState("");
  const [newInterval, setNewInterval] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [mileageInput, setMileageInput] = useState(carMileage?.toString() || "");

  const currentMileage = carMileage || 0;

  const getStatus = (reminder: MaintenanceReminder) => {
    if (currentMileage >= reminder.next_due_mileage) return "overdue";
    if (currentMileage >= reminder.next_due_mileage - 1000) return "soon";
    return "ok";
  };

  const overdue = reminders.filter((r) => getStatus(r) === "overdue");
  const soon = reminders.filter((r) => getStatus(r) === "soon");

  const handleMarkDone = async (reminder: MaintenanceReminder) => {
    setMarkingId(reminder.id);
    const miles = parseInt(mileageInput) || currentMileage;
    await markDone(reminder, miles);
    toast.success(`${reminder.service_type} marked as done!`);
    setMarkingId(null);
  };

  const handleAdd = async () => {
    if (!newService.trim() || !newInterval) return;
    await addReminder(carId, newService.trim(), parseInt(newInterval), currentMileage);
    toast.success("Reminder added!");
    setNewService("");
    setNewInterval("");
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading maintenance schedule...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in-up">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Maintenance Schedule</span>
          {overdue.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
              {overdue.length} overdue
            </span>
          )}
          {soon.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">
              {soon.length} due soon
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {reminders.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No maintenance reminders yet.</p>
          ) : (
            reminders.map((r) => {
              const status = getStatus(r);
              const icon = serviceIcons[r.service_type] || "🔧";
              const milesUntilDue = r.next_due_mileage - currentMileage;

              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 rounded-lg p-3 text-sm transition-colors ${
                    status === "overdue"
                      ? "bg-destructive/5 border border-destructive/20"
                      : status === "soon"
                      ? "bg-yellow-500/5 border border-yellow-500/20"
                      : "bg-secondary/30 border border-transparent"
                  }`}
                >
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-xs">{r.service_type}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {status === "overdue" ? (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue by {Math.abs(milesUntilDue).toLocaleString()} mi
                        </span>
                      ) : status === "soon" ? (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due in {milesUntilDue.toLocaleString()} mi
                        </span>
                      ) : (
                        `Due at ${r.next_due_mileage.toLocaleString()} mi (in ${milesUntilDue.toLocaleString()} mi)`
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Every {r.interval_miles.toLocaleString()} mi
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMarkDone(r)}
                      disabled={markingId === r.id}
                      title="Mark as done at current mileage"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      title="Remove reminder"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Add Custom Reminder */}
          {showAddForm ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                placeholder="Service name"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                placeholder="Interval (mi)"
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
                className="w-28 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleAdd}
                disabled={!newService.trim() || !newInterval}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewService(""); setNewInterval(""); }}
                className="px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline pt-1"
            >
              <Plus className="w-3 h-3" />
              Add custom reminder
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MaintenanceReminders;
