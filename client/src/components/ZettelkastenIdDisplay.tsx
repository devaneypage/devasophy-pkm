import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZettelkastenIdDisplayProps {
  zettelkastenId: string | null | undefined;
  isLoading?: boolean;
  onCopy?: () => void;
}

/**
 * Displays a Zettelkasten ID with copy-to-clipboard functionality
 * Format: AC.ID-YYYYMMDD-Seq (e.g., 20.03-20250423-001)
 */
export default function ZettelkastenIdDisplay({
  zettelkastenId,
  isLoading = false,
  onCopy,
}: ZettelkastenIdDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (zettelkastenId) {
      navigator.clipboard.writeText(zettelkastenId);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-full border-2 border-black/20 bg-white/50 px-4 py-2">
        <div className="h-4 w-24 animate-pulse rounded bg-black/10" />
      </div>
    );
  }

  if (!zettelkastenId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border-2 border-black/85 bg-white px-4 py-2">
      <code className="font-mono text-sm font-semibold text-foreground">
        {zettelkastenId}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="ml-1 h-6 w-6 p-0 hover:bg-black/5"
        title={copied ? "Copied!" : "Copy ID"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
