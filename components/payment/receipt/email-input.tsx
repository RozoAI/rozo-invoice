"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { updatePaymentEmail } from "@rozoai/intent-common";
import { Check, Loader2, MailIcon } from "lucide-react";
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

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="text-xs text-muted-foreground mb-1">
        Get support updates by email
      </div>
      <div className="flex gap-2">
        <InputGroup>
          <InputGroupAddon>
            <MailIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={isLoading || isSubmitted}
            aria-label="Email address"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Submit"
              title="Submit"
              disabled={!email.trim() || isLoading || isSubmitted}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSubmitted ? (
                <Check className="size-4 text-green-600" />
              ) : (
                "Submit"
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </form>
  );
}
