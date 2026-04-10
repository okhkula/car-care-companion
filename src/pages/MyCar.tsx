import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Car, Plus, Trash2, Edit2, Save, X, Gauge } from "lucide-react";
import MaintenanceReminders from "@/components/MaintenanceReminders";

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number;
  nickname: string | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
}

const emptyForm = { make: "", model: "", year: new Date().getFullYear(), nickname: "", color: "", mileage: "", notes: "" };

const MyCar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<UserCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchCars();
  }, [user]);

  const fetchCars = async () => {
    const { data, error } = await supabase.from("user_cars").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load cars");
    else setCars(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.make.trim() || !form.model.trim() || !user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year,
      nickname: form.nickname.trim() || null,
      color: form.color.trim() || null,
      mileage: form.mileage ? parseInt(form.mileage as string) : null,
      notes: form.notes.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from("user_cars").update(payload).eq("id", editingId);
      if (error) toast.error("Failed to update");
      else toast.success("Car updated!");
    } else {
      const { error } = await supabase.from("user_cars").insert(payload);
      if (error) toast.error("Failed to save");
      else toast.success("Car added!");
    }

    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
    fetchCars();
  };

  const handleEdit = (car: UserCar) => {
    setForm({
      make: car.make,
      model: car.model,
      year: car.year,
      nickname: car.nickname || "",
      color: car.color || "",
      mileage: car.mileage?.toString() || "",
      notes: car.notes || "",
    });
    setEditingId(car.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_cars").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      setCars((prev) => prev.filter((c) => c.id !== id));
      toast.success("Car removed");
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">My Cars</h2>
          <p className="text-xs text-muted-foreground">{cars.length} vehicle{cars.length !== 1 ? "s" : ""} saved</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setForm(emptyForm); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Car
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-foreground">{editingId ? "Edit Car" : "Add a New Car"}</h3>
              <button onClick={cancelForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Make (e.g. Toyota) *"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                className="col-span-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                placeholder="Model (e.g. Camry) *"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="col-span-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                placeholder="Year *"
                value={form.year}
                min={1900}
                max={currentYear + 1}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || currentYear })}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                placeholder="Nickname (optional)"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                placeholder="Color (optional)"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                placeholder="Mileage (optional)"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !form.make.trim() || !form.model.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : editingId ? "Update Car" : "Save Car"}
            </button>
          </div>
        )}

        {/* Cars List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cars.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">No cars saved yet</p>
            <p className="text-sm text-muted-foreground mb-4">Add your car to get personalized tips in chat!</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
            >
              Add Your First Car
            </button>
          </div>
        ) : (
          cars.map((car) => (
            <div key={car.id} className="rounded-xl border border-border bg-card p-4 animate-fade-in-up">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {car.year} {car.make} {car.model}
                    </h3>
                    {car.nickname && (
                      <p className="text-xs text-muted-foreground">"{car.nickname}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(car)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(car.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {car.color && (
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{car.color}</span>
                )}
                {car.mileage && (
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> {car.mileage.toLocaleString()} mi
                  </span>
                )}
              </div>
              {car.notes && <p className="text-xs text-muted-foreground mt-2">{car.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyCar;
