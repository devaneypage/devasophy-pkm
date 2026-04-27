import React, { useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Merge, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Duplicate {
  incomingIndex: number;
  incomingText?: string;
  incomingTerm?: string;
  matchedEntryId: number;
  matchedText?: string;
  matchedTerm?: string;
  similarity: number;
  action: string;
}

interface DuplicateConflictResolverProps {
  duplicates: Duplicate[];
  onResolve: (duplicates: Map<number, "skip" | "merge" | "replace">) => void;
  entryType: "notebook" | "lexicon";
}

export function DuplicateConflictResolver({
  duplicates,
  onResolve,
  entryType,
}: DuplicateConflictResolverProps) {
  const [resolutions, setResolutions] = useState<Map<number, "skip" | "merge" | "replace">>(
    new Map(duplicates.map((d) => [d.incomingIndex, "skip" as const]))
  );
  const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);

  if (duplicates.length === 0) {
    return null;
  }

  const handleResolution = (index: number, action: "skip" | "merge" | "replace") => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(index, action);
    setResolutions(newResolutions);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.95) return "bg-red-100 text-red-800";
    if (similarity >= 0.85) return "bg-orange-100 text-orange-800";
    if (similarity >= 0.75) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.95) return "Exact Match";
    if (similarity >= 0.85) return "Very Similar";
    if (similarity >= 0.75) return "Similar";
    return "Possible Match";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">
              {duplicates.length} Potential Duplicate{duplicates.length !== 1 ? "s" : ""} Found
            </h3>
            <p className="text-sm text-orange-800 mt-1">
              Review and choose how to handle each duplicate. You can skip, merge, or replace existing entries.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {duplicates.map((duplicate) => {
          const resolution = resolutions.get(duplicate.incomingIndex) || "skip";
          const incomingContent =
            entryType === "notebook" ? duplicate.incomingText : duplicate.incomingTerm;
          const matchedContent =
            entryType === "notebook" ? duplicate.matchedText : duplicate.matchedTerm;

          return (
            <Card
              key={duplicate.incomingIndex}
              className="p-4 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => setSelectedDuplicate(duplicate)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSimilarityColor(duplicate.similarity)}>
                        {(duplicate.similarity * 100).toFixed(0)}% - {getSimilarityLabel(duplicate.similarity)}
                      </Badge>
                      <span className="text-xs text-gray-500">Entry #{duplicate.incomingIndex + 1}</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Incoming:</p>
                        <p className="text-sm truncate text-gray-900">{incomingContent}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Existing (ID: {duplicate.matchedEntryId}):</p>
                        <p className="text-sm truncate text-gray-700">{matchedContent}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {resolution === "skip" && <XCircle className="h-5 w-5 text-gray-400" />}
                    {resolution === "merge" && <Merge className="h-5 w-5 text-blue-500" />}
                    {resolution === "replace" && <RefreshCw className="h-5 w-5 text-orange-500" />}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant={resolution === "skip" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolution(duplicate.incomingIndex, "skip");
                    }}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    variant={resolution === "merge" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolution(duplicate.incomingIndex, "merge");
                    }}
                    className="flex-1"
                  >
                    <Merge className="h-4 w-4 mr-1" />
                    Merge
                  </Button>
                  <Button
                    size="sm"
                    variant={resolution === "replace" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolution(duplicate.incomingIndex, "replace");
                    }}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Replace
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            // Set all to skip
            const newResolutions = new Map<number, "skip" | "merge" | "replace">();
            duplicates.forEach((d) => newResolutions.set(d.incomingIndex, "skip"));
            setResolutions(newResolutions);
          }}
        >
          Skip All
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            // Set all to merge
            const newResolutions = new Map<number, "skip" | "merge" | "replace">();
            duplicates.forEach((d) => newResolutions.set(d.incomingIndex, "merge"));
            setResolutions(newResolutions);
          }}
        >
          Merge All
        </Button>
        <div className="flex-1" />
        <Button
          onClick={() => {
            onResolve(resolutions);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Continue Import
        </Button>
      </div>

      {/* Detail Dialog */}
      {selectedDuplicate && (
        <Dialog open={!!selectedDuplicate} onOpenChange={() => setSelectedDuplicate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Duplicate Details</DialogTitle>
              <DialogDescription>
                Review the incoming and existing entries to decide how to handle this duplicate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Similarity Score</h4>
                  <Badge className={getSimilarityColor(selectedDuplicate.similarity)}>
                    {(selectedDuplicate.similarity * 100).toFixed(1)}% - {getSimilarityLabel(selectedDuplicate.similarity)}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${selectedDuplicate.similarity * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-2">Incoming Entry</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-blue-700 font-semibold">Entry #{selectedDuplicate.incomingIndex + 1}</p>
                      {entryType === "notebook" && selectedDuplicate.incomingText && (
                        <p className="text-blue-900 break-words">{selectedDuplicate.incomingText}</p>
                      )}
                      {entryType === "lexicon" && selectedDuplicate.incomingTerm && (
                        <p className="text-blue-900 font-semibold">{selectedDuplicate.incomingTerm}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-2">Existing Entry</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-700 font-semibold">ID: {selectedDuplicate.matchedEntryId}</p>
                      {entryType === "notebook" && selectedDuplicate.matchedText && (
                        <p className="text-gray-900 break-words">{selectedDuplicate.matchedText}</p>
                      )}
                      {entryType === "lexicon" && selectedDuplicate.matchedTerm && (
                        <p className="text-gray-900 font-semibold">{selectedDuplicate.matchedTerm}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">Resolution Options</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Skip</p>
                      <p className="text-gray-600">Don't import the incoming entry. Keep the existing entry unchanged.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Merge className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Merge</p>
                      <p className="text-gray-600">Combine fields from both entries. Incoming data fills gaps in existing entry.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Replace</p>
                      <p className="text-gray-600">Replace the existing entry entirely with the incoming entry.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDuplicate(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
