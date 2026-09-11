import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MaintenanceReminder {
  id: string;
  car_id: string;
  service_type: string;
  interval_miles: number;
  last_done_mileage: number;
  next_due_mileage: number;
  is_completed: boolean;
  notes: string | null;
}

export function useMaintenanceReminders(carId?: string) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user || !carId) { setReminders([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("maintenance_reminders")
      .select("id, car_id, service_type, interval_miles, last_done_mileage, next_due_mileage, is_completed, notes")
      .eq("car_id", carId)
      .order("next_due_mileage", { ascending: true });
    setReminders(data || []);
    setLoading(false);
  }, [user, carId]);

  useEffect(() => { fetch(); }, [fetch]);

  const markDone = async (reminder: MaintenanceReminder, currentMileage: number) => {
    const newNextDue = currentMileage + reminder.interval_miles;
    await supabase
      .from("maintenance_reminders")
      .update({ last_done_mileage: currentMileage, next_due_mileage: newNextDue, is_completed: false })
      .eq("id", reminder.id);
    fetch();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("maintenance_reminders").delete().eq("id", id);
    fetch();
  };

  const addReminder = async (carId: string, serviceType: string, intervalMiles: number, startMileage: number) => {
    if (!user) return;
    await supabase.from("maintenance_reminders").insert({
      car_id: carId,
      user_id: user.id,
      service_type: serviceType,
      interval_miles: intervalMiles,
      last_done_mileage: startMileage,
      next_due_mileage: startMileage + intervalMiles,
    });
    fetch();
  };

  return { reminders, loading, markDone, deleteReminder, addReminder, refetch: fetch };
}
