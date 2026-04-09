import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Image, Trash2, ArrowLeft, Upload } from "lucide-react";
import { Link } from "react-router-dom";

interface CarImage {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  created_at: string;
}

const Gallery = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<CarImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("car_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load images");
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("car-images")
      .upload(path, file);

    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("car-images")
      .getPublicUrl(path);

    const { error: insertError } = await supabase.from("car_images").insert({
      user_id: user.id,
      title: file.name.replace(/\.[^.]+$/, ""),
      image_url: urlData.publicUrl,
    });

    if (insertError) {
      toast.error("Failed to save image");
    } else {
      toast.success("Image saved to gallery!");
      fetchImages();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("car_images").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Image deleted");
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <p className="text-muted-foreground mb-4">Sign in to view your gallery</p>
        <Link to="/auth" className="text-primary hover:underline text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">My Car Gallery</h2>
          <p className="text-xs text-muted-foreground">{images.length} photo{images.length !== 1 ? "s" : ""}</p>
        </div>
        <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm cursor-pointer hover:opacity-90 transition-opacity">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload"}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Image className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">No photos yet</p>
            <p className="text-sm text-muted-foreground">Upload car photos or save them from chat!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border bg-card">
                <img
                  src={img.image_url}
                  alt={img.title || "Car image"}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-end">
                  <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                    <span className="text-xs text-primary-foreground font-medium truncate">{img.title}</span>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-1.5 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
