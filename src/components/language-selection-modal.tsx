
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { allLanguages } from "@/lib/all-languages";

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onSelectLanguage: (code: string) => void;
}

export function LanguageSelectionModal({ isOpen, onSelectLanguage }: LanguageSelectionModalProps) {
  
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>Select Your Language</DialogTitle>
          <DialogDescription>
            Choose your preferred language to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-4">
            {allLanguages.map((lang) => (
                <Button 
                    key={lang.code} 
                    variant="outline"
                    onClick={() => onSelectLanguage(lang.code)}
                >
                    {lang.name}
                </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
