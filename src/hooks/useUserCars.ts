import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number;
  nickname: string | null;
  mileage: number | null;
}

export function useUserCars() {
  const { user } = useAuth();
  const [cars, setCars] = useState<UserCar[]>([]);

  useEffect(() => {
    if (!user) { setCars([]); return; }
    supabase
      .from("user_cars")
      .select("id, make, model, year, nickname, mileage")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCars(data || []));
  }, [user]);

  return cars;
}

/** Build a context string about the user's cars for the AI */
export function buildCarContext(cars: UserCar[]): string {
  if (cars.length === 0) return "";
  const descriptions = cars.map((c) => {
    let desc = `${c.year} ${c.make} ${c.model}`;
    if (c.nickname) desc += ` (nicknamed "${c.nickname}")`;
    if (c.mileage) desc += ` with ${c.mileage.toLocaleString()} miles`;
    return desc;
  });
  return `The user owns: ${descriptions.join("; ")}. Personalize your advice for their specific car(s) when relevant.`;
}
