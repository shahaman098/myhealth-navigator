import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";

interface PlainLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  medicalText: string;
  plainLanguageText: string;
}

export function PlainLanguageModal({
  isOpen,
  onClose,
  title,
  medicalText,
  plainLanguageText,
}: PlainLanguageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              {title}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Here's a simple explanation of your medical information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Medical Text */}
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              Medical Terms
            </h3>
            <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
              {medicalText}
            </div>
          </div>

          {/* Plain Language Explanation */}
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              In Simple Language
            </h3>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground leading-relaxed">
              {plainLanguageText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1">
              Ask AI More Questions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
