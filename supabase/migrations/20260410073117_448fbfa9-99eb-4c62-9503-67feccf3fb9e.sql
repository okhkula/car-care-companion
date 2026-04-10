
-- Create maintenance reminders table
CREATE TABLE public.maintenance_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.user_cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  interval_miles INTEGER NOT NULL,
  last_done_mileage INTEGER NOT NULL DEFAULT 0,
  next_due_mileage INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_maintenance_reminders_car_id ON public.maintenance_reminders(car_id);
CREATE INDEX idx_maintenance_reminders_user_id ON public.maintenance_reminders(user_id);

-- Enable RLS
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.maintenance_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON public.maintenance_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.maintenance_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.maintenance_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamps
CREATE TRIGGER update_maintenance_reminders_updated_at
  BEFORE UPDATE ON public.maintenance_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to seed default reminders when a car is added
CREATE OR REPLACE FUNCTION public.seed_default_maintenance_reminders()
RETURNS TRIGGER AS $$
DECLARE
  car_mileage INTEGER;
BEGIN
  car_mileage := COALESCE(NEW.mileage, 0);

  INSERT INTO public.maintenance_reminders (car_id, user_id, service_type, interval_miles, last_done_mileage, next_due_mileage)
  VALUES
    (NEW.id, NEW.user_id, 'Oil Change', 7500, car_mileage, car_mileage + 7500),
    (NEW.id, NEW.user_id, 'Tire Rotation', 7500, car_mileage, car_mileage + 7500),
    (NEW.id, NEW.user_id, 'Brake Inspection', 15000, car_mileage, car_mileage + 15000),
    (NEW.id, NEW.user_id, 'Air Filter Replacement', 15000, car_mileage, car_mileage + 15000),
    (NEW.id, NEW.user_id, 'Coolant Flush', 30000, car_mileage, car_mileage + 30000);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER seed_maintenance_on_car_insert
  AFTER INSERT ON public.user_cars
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_maintenance_reminders();
