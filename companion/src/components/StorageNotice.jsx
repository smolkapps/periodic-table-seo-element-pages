import React from "react";
import { AlertTriangle } from "lucide-react";
import { useStudyProgress } from "@/lib/studyStore";

export default function StorageNotice() {
  const { storageError } = useStudyProgress();
  if (!storageError) return null;

  return (
    <div
      role="alert"
      className="border-t border-[#ffd43b]/40 bg-[#ffd43b]/10 px-3 sm:px-6 py-1.5 flex items-start gap-2 text-[11px] sm:text-xs text-[#ffd43b]"
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{storageError}</span>
    </div>
  );
}