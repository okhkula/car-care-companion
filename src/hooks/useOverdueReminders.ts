import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OverdueReminder {
  id: string;
  service_type: string;
  next_due_mileage: number;
  car_make: string;
  car_model: string;
  car_year: number;
  car_nickname: string | null;
  car_mileage: number;
}

/**
 * Fetches maintenance reminders that are overdue (car mileage >= next_due_mileage).
 * Joins with user_cars to get car info and current mileage.
 */
export function useOverdueReminders() {
  const { user } = useAuth();
  const [overdue, setOverdue] = useState<OverdueReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOverdue([]);
      setLoading(false);
      return;
    }

    const fetchOverdue = async () => {
      setLoading(true);

      // Fetch cars and reminders in parallel
      const [{ data: cars }, { data: reminders }] = await Promise.all([
        supabase
          .from("user_cars")
          .select("id, make, model, year, nickname, mileage"),
        supabase
          .from("maintenance_reminders")
          .select("id, car_id, service_type, next_due_mileage, is_completed")
          .eq("is_completed", false),
      ]);

      if (!cars || !reminders) {
        setOverdue([]);
        setLoading(false);
        return;
      }

      const carMap = new Map(cars.map((c) => [c.id, c]));
      const results: OverdueReminder[] = [];

      for (const r of reminders) {
        const car = carMap.get(r.car_id);
        if (!car || car.mileage == null) continue;
        if (car.mileage >= r.next_due_mileage) {
          results.push({
            id: r.id,
            service_type: r.service_type,
            next_due_mileage: r.next_due_mileage,
            car_make: car.make,
            car_model: car.model,
            car_year: car.year,
            car_nickname: car.nickname,
            car_mileage: car.mileage,
          });
        }
      }

      setOverdue(results);
      setLoading(false);
    };

    fetchOverdue();
  }, [user]);

  return { overdue, loading };
}
