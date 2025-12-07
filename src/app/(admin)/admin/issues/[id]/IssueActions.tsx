"use client";

import { useState, useTransition, useRef, useCallback, useMemo } from "react";
import * as Select from "@radix-ui/react-select";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Popover from "@radix-ui/react-popover";
import { Loader2, Check, AlertCircle, Search, ChevronsUpDown } from "lucide-react";
import Button from "@/components/ui/Button";
import { updateIssueStatus, assignIssue, addComment } from "@/lib/actions/issues";

type Assignee = { id: number; name?: string | null };

type FeedbackState = {
  type: "success" | "error" | null;
  message: string;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

function Feedback({ state, onDismiss }: { state: FeedbackState; onDismiss: () => void }) {
  if (!state.type) return null;
  return (
    <div
      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
        state.type === "success"
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      }`}
    >
      {state.type === "success" ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
      <span className="flex-1">{state.message}</span>
      <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100">
        ×
      </button>
    </div>
  );
}

export default function IssueActions({
  issueId,
  initialStatus,
  assignees,
}: {
  issueId: number;
  initialStatus: string;
  assignees: Assignee[];
}) {
  // Status state
  const [status, setStatus] = useState(initialStatus);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<FeedbackState>({ type: null, message: "" });
  const [isStatusPending, startStatusTransition] = useTransition();

  // Assign state
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<FeedbackState>({ type: null, message: "" });
  const [isAssignPending, startAssignTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter assignees based on search
  const filteredAssignees = useMemo(() => {
    if (!assigneeSearch.trim()) return assignees;
    const query = assigneeSearch.toLowerCase();
    return assignees.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        String(a.id).includes(query)
    );
  }, [assignees, assigneeSearch]);

  // Get selected assignee display text
  const selectedAssigneeDisplay = useMemo(() => {
    if (!selectedAssignee) return null;
    const assignee = assignees.find((a) => String(a.id) === selectedAssignee);
    return assignee ? (assignee.name ? `${assignee.name} (#${assignee.id})` : `#${assignee.id}`) : null;
  }, [selectedAssignee, assignees]);

  // Comment state
  const [comment, setComment] = useState("");
  const [commentFeedback, setCommentFeedback] = useState<FeedbackState>({ type: null, message: "" });
  const [isCommentPending, startCommentTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Status change with confirmation
  const handleStatusSelect = useCallback((newStatus: string) => {
    if (newStatus === status) return;
    setPendingStatus(newStatus);
  }, [status]);

  const confirmStatusChange = useCallback(() => {
    if (!pendingStatus) return;
    const newStatus = pendingStatus;
    const previousStatus = status;
    setPendingStatus(null);
    setStatusFeedback({ type: null, message: "" });

    startStatusTransition(async () => {
      const result = await updateIssueStatus(issueId, newStatus, previousStatus);
      if (result.success) {
        setStatus(newStatus);
        setStatusFeedback({ type: "success", message: "Status updated successfully" });
      } else {
        setStatusFeedback({ type: "error", message: result.error || "Failed to update status" });
      }
    });
  }, [pendingStatus, issueId, status]);

  const cancelStatusChange = useCallback(() => {
    setPendingStatus(null);
  }, []);

  // Assignment with validation
  const handleAssign = useCallback(() => {
    setAssignFeedback({ type: null, message: "" });

    if (!selectedAssignee) {
      setAssignFeedback({ type: "error", message: "Please select an assignee" });
      return;
    }

    const assigneeId = Number(selectedAssignee);
    const assignee = assignees.find((a) => a.id === assigneeId);
    const assigneeName = assignee?.name || undefined;

    startAssignTransition(async () => {
      const result = await assignIssue(issueId, assigneeId, assigneeName);
      if (result.success) {
        setAssignFeedback({ type: "success", message: "Assignee added successfully" });
        setSelectedAssignee("");
      } else {
        setAssignFeedback({ type: "error", message: result.error || "Failed to assign" });
      }
    });
  }, [selectedAssignee, issueId, assignees]);

  // Comment with validation
  const handleComment = useCallback(() => {
    setCommentFeedback({ type: null, message: "" });

    const trimmed = comment.trim();
    if (!trimmed) {
      setCommentFeedback({ type: "error", message: "Comment cannot be empty" });
      return;
    }
    if (trimmed.length > 2000) {
      setCommentFeedback({ type: "error", message: "Comment is too long (max 2000 characters)" });
      return;
    }

    startCommentTransition(async () => {
      const result = await addComment(issueId, trimmed);
      if (result.success) {
        setCommentFeedback({ type: "success", message: "Comment posted successfully" });
        setComment("");
        if (textareaRef.current) textareaRef.current.value = "";
      } else {
        setCommentFeedback({ type: "error", message: result.error || "Failed to post comment" });
      }
    });
  }, [comment, issueId]);

  const getStatusLabel = (value: string) =>
    STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Status
        </label>
        <Select.Root value={status} onValueChange={handleStatusSelect} disabled={isStatusPending}>
          <Select.Trigger
            className={`inline-flex items-center justify-between w-full h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark px-3 text-sm text-gray-900 dark:text-white ${
              isStatusPending ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Select.Value />
            {isStatusPending ? (
              <Loader2 className="ml-2 size-4 animate-spin text-gray-500" />
            ) : (
              <span className="ml-2 text-gray-500">▾</span>
            )}
          </Select.Trigger>
          <Select.Content className="z-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark shadow-md">
            <Select.Viewport className="p-1">
              {STATUS_OPTIONS.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700"
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Root>
        {statusFeedback.type && (
          <Feedback state={statusFeedback} onDismiss={() => setStatusFeedback({ type: null, message: "" })} />
        )}
      </div>

      {/* Status Confirmation Dialog */}
      <AlertDialog.Root open={!!pendingStatus} onOpenChange={(open) => !open && cancelStatusChange()}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Confirm Status Change
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to change the status from{" "}
              <span className="font-semibold">{getStatusLabel(status)}</span> to{" "}
              <span className="font-semibold">{getStatusLabel(pendingStatus || "")}</span>?
              {pendingStatus === "resolved" && (
                <span className="block mt-2 text-green-600 dark:text-green-400">
                  This will mark the issue as resolved with the current timestamp.
                </span>
              )}
              {pendingStatus === "closed" && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  Closing an issue will archive it from active views.
                </span>
              )}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" onClick={cancelStatusChange}>
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button onClick={confirmStatusChange}>Confirm</Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Assignee Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Assignee
        </label>
        <div className="flex items-center gap-2">
          <Popover.Root
            open={assigneePopoverOpen}
            onOpenChange={(open) => {
              setAssigneePopoverOpen(open);
              if (open) {
                setAssigneeSearch("");
                setTimeout(() => searchInputRef.current?.focus(), 0);
              }
            }}
          >
            <Popover.Trigger asChild disabled={isAssignPending}>
              <button
                type="button"
                className={`flex-1 inline-flex items-center justify-between h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark px-3 text-sm text-left ${
                  isAssignPending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className={selectedAssigneeDisplay ? "text-gray-900 dark:text-white" : "text-gray-500"}>
                  {selectedAssigneeDisplay || "Search assignee..."}
                </span>
                <ChevronsUpDown className="ml-2 size-4 text-gray-500 shrink-0" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark shadow-lg"
                sideOffset={4}
                align="start"
              >
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3">
                  <Search className="size-4 text-gray-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="flex-1 h-10 px-2 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-900 dark:text-white"
                    placeholder="Search by name or ID..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredAssignees.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      No assignees found
                    </div>
                  ) : (
                    filteredAssignees.map((a) => {
                      const isSelected = String(a.id) === selectedAssignee;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            isSelected ? "bg-primary/10 text-primary" : "text-gray-900 dark:text-white"
                          }`}
                          onClick={() => {
                            setSelectedAssignee(String(a.id));
                            setAssigneePopoverOpen(false);
                          }}
                        >
                          <Check className={`size-4 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                          <span>{a.name ? `${a.name} (#${a.id})` : `#${a.id}`}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <Button type="button" className="h-9" onClick={handleAssign} disabled={isAssignPending}>
            {isAssignPending ? <Loader2 className="size-4 animate-spin" /> : "Assign"}
          </Button>
        </div>
        {assignFeedback.type && (
          <Feedback state={assignFeedback} onDismiss={() => setAssignFeedback({ type: null, message: "" })} />
        )}
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-800"></div>

      {/* Comment Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Internal Note
        </label>
        <textarea
          ref={textareaRef}
          className={`w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-sm min-h-[80px] p-2 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
            isCommentPending ? "opacity-50" : ""
          }`}
          placeholder="Add a note or comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isCommentPending}
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{comment.length}/2000</span>
          <Button
            type="button"
            variant="outline"
            className="h-8 text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={handleComment}
            disabled={isCommentPending || !comment.trim()}
          >
            {isCommentPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
            Post Comment
          </Button>
        </div>
        {commentFeedback.type && (
          <Feedback state={commentFeedback} onDismiss={() => setCommentFeedback({ type: null, message: "" })} />
        )}
      </div>
    </div>
  );
}
