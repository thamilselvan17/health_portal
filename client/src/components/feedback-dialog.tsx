import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackDialogProps {
  appointmentId: number;
  initialRating?: number;
  initialFeedback?: string;
  isEdit?: boolean;
}

export function FeedbackDialog({ 
  appointmentId, 
  initialRating = 0, 
  initialFeedback = "", 
  isEdit = false 
}: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Error", description: "Please select a rating", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("PUT", `/api/appointments/${appointmentId}/feedback`, { rating, feedback });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Success", description: "Feedback submitted successfully!" });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setRating(initialRating);
      setFeedback(initialFeedback);
      setHoverRating(0);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">Edit</Button>
        ) : (
          <Button size="sm" variant="outline" className="rounded-full">Leave Feedback</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your visit</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    "w-10 h-10 transition-colors",
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comments (Optional)</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="How was your experience?"
              className="resize-none h-24"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
