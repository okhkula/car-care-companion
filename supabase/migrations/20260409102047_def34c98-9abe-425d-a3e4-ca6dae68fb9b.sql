
CREATE TABLE public.user_cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  nickname TEXT,
  color TEXT,
  mileage INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cars"
ON public.user_cars FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cars"
ON public.user_cars FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars"
ON public.user_cars FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars"
ON public.user_cars FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_cars_updated_at
BEFORE UPDATE ON public.user_cars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
