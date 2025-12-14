"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePaymentEmail } from "@rozoai/intent-common";
import { Check, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EmailInputProps {
  paymentId: string;
}

export function EmailInput({ paymentId }: EmailInputProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePaymentEmail(paymentId, email.trim());

      if (!result.error && result.data) {
        setIsSubmitted(true);
        toast.success("Email saved successfully!");
      } else {
        toast.error(result.error?.message || "Failed to save email");
      }
    } catch (error) {
      console.error("Error updating payment email:", error);
      toast.error("Failed to save email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-200">
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span>Email saved successfully</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[350px] space-y-2">
      <div className="text-xs text-muted-foreground text-center mb-1">
        Add your email for support updates
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="pl-9"
            disabled={isLoading}
            aria-label="Email address"
          />
        </div>
        <Button
          type="submit"
          disabled={!email.trim() || isLoading}
          size="default"
          className="shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </form>
  );
}
