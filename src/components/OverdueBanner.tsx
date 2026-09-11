import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { OverdueReminder } from "@/hooks/useOverdueReminders";

interface Props {
  reminders: OverdueReminder[];
}

const OverdueBanner = ({ reminders }: Props) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || reminders.length === 0) return null;

  const count = reminders.length;
  const first = reminders[0];
  const carLabel = first.car_nickname || `${first.car_year} ${first.car_make} ${first.car_model}`;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {count === 1
              ? `${first.service_type} is overdue for your ${carLabel}`
              : `${count} maintenance items are overdue`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {count === 1
              ? `Due at ${first.next_due_mileage.toLocaleString()} mi — current mileage is ${first.car_mileage.toLocaleString()} mi`
              : `Including ${first.service_type} on your ${carLabel} and ${count - 1} more`}
          </p>
          <Link
            to="/my-car"
            className="inline-block text-xs font-medium text-primary hover:underline mt-1.5"
          >
            View maintenance →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default OverdueBanner;
