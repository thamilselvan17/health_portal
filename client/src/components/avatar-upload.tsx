import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Camera, Loader2 } from "lucide-react";

export function AvatarUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      try {
        setIsUploading(true);
        const res = await apiRequest("POST", "/api/users/me/avatar", { avatar: base64String });
        
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          toast({ title: "Success", description: "Profile picture updated!" });
          setIsOpen(false);
        } else {
          throw new Error("Failed to upload");
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="relative group w-12 h-12 rounded-full overflow-hidden shrink-0">
          {user?.avatar ? (
             <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase">
               {user?.name?.substring(0, 2)}
             </div>
          )}
          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center font-bold text-primary text-3xl uppercase">
                {user?.name?.substring(0, 2)}
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose Image
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Supported formats: JPG, PNG. Max size: 2MB.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
