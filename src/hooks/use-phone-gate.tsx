import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PhoneGateAction = () => void | Promise<void>;

function hasPhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "").length >= 10;
}

// 1. Standalone Component outside the hook to stop blinking/focus loss
interface PhoneGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  setPhone: (val: string) => void;
  onSave: () => void;
  error: string;
  isSaving: boolean;
}

export function PhoneGateModal({
  isOpen,
  onClose,
  phone,
  setPhone,
  onSave,
  error,
  isSaving,
}: PhoneGateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden border-0 p-0 sm:max-w-md">
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 px-6 py-7 text-white">
          <div className="flex size-11 items-center justify-center rounded-full bg-white/15">
            <Phone className="size-5" />
          </div>
          <DialogHeader className="mt-5 text-left">
            <DialogTitle className="text-xl text-white">One quick detail first</DialogTitle>
            <DialogDescription className="mt-2 text-blue-100">
              Add your phone number to continue with tests and secure checkout.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="phone-gate-number">Phone number</Label>
            <Input
              id="phone-gate-number"
              autoFocus
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
              }}
              placeholder="9876543210"
              aria-invalid={Boolean(error)}
              disabled={isSaving}
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">We only use this to support your Rankdon account.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {isSaving ? "Saving..." : "Save and continue"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 2. Main Hook logic remains clean
export function usePhoneGate() {
  const { user, profile, refreshProfile, updateProfile } = useAuth();
  const pendingAction = useRef<PhoneGateAction | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const close = useCallback(() => {
    if (isSaving) return;
    pendingAction.current = null;
    setError("");
    setIsOpen(false);
  }, [isSaving]);

  const requirePhone = useCallback(
    async (action: PhoneGateAction) => {
      if (!user) return false;

      let currentProfile = profile;
      if (!currentProfile) {
        try {
          currentProfile = await refreshProfile();
        } catch (refreshError) {
          console.error("Unable to check profile phone number:", refreshError);
          toast.error("We could not verify your profile. Please try again.");
          return false;
        }
      }

      if (hasPhone(currentProfile?.phone)) {
        await action();
        return true;
      }

      pendingAction.current = action;
      setPhone("");
      setError("");
      setIsOpen(true);
      return false;
    },
    [profile, refreshProfile, user],
  );

  const savePhone = useCallback(async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid phone number with at least 10 digits.");
      return;
    }

    const action = pendingAction.current;
    try {
      setIsSaving(true);
      await updateProfile({ phone: digits });
      pendingAction.current = null;
      setIsOpen(false);
      setError("");
    } catch (saveError) {
      console.error("Unable to save phone number:", saveError);
      setError("We could not save that number. Please try again.");
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    if (action) await action();
  }, [phone, updateProfile]);

  return { 
    requirePhone, 
    isModalOpen: isOpen,
    closeModal: close,
    phoneValue: phone,
    setPhoneValue: setPhone,
    handleSavePhone: savePhone,
    phoneError: error,
    isSavingPhone: isSaving
  };
}