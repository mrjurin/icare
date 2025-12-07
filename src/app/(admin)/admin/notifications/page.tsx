import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { BellPlus, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: "new" | "status" | "system" | "comment";
  issueRef?: string;
  unread?: boolean;
};

const data: Notification[] = [
  { id: "n1", title: "New Issue Reported", subtitle: "Issue #1234: Pothole on Main Street", timeAgo: "5 minutes ago", type: "new", issueRef: "INC-1234", unread: true },
  { id: "n2", title: "Status Updated to 'Resolved'", subtitle: "Issue #1230: Broken Streetlight", timeAgo: "1 hour ago", type: "status", issueRef: "INC-1230", unread: true },
  { id: "n3", title: "Urgent System Maintenance", subtitle: "Scheduled for tomorrow at 2 AM.", timeAgo: "8 hours ago", type: "system" },
  { id: "n4", title: "New Comment on Assigned Issue", subtitle: "Issue #1232: Park Vandalism", timeAgo: "Yesterday", type: "comment", issueRef: "INC-1232" },
];

function TypeIcon({ t }: { t: Notification["type"] }) {
  const classBase = "size-5";
  switch (t) {
    case "new":
      return <BellPlus className={classBase} />;
    case "status":
      return <CheckCircle2 className={classBase} />;
    case "system":
      return <AlertCircle className={classBase} />;
    case "comment":
      return <MessageSquare className={classBase} />;
  }
}

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Notifications</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage alerts for new issues, status changes, and system updates.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-1 min-w-[320px]">
          <Input placeholder="Search notifications..." className="flex-1" />
        </div>
        <div className="flex gap-2">
          <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
            <option>Type: All</option>
            <option>New</option>
            <option>Status</option>
            <option>System</option>
            <option>Comment</option>
          </select>
          <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
            <option>Urgency: All</option>
            <option>Low</option>
            <option>Normal</option>
            <option>High</option>
          </select>
          <Button variant="outline">Mark all as read</Button>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((n) => (
          <div key={n.id} className={`rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-center justify-between ${n.unread ? "outline outline-2 outline-primary/60" : ""}`}>
            <div className="flex items-center gap-3">
              <div className={`size-9 rounded-full flex items-center justify-center ${n.type === "new" ? "bg-primary/10 text-primary" : n.type === "status" ? "bg-green-100 text-green-700" : n.type === "system" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                <TypeIcon t={n.type} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600">{n.subtitle}</p>
                <p className="text-xs text-gray-500">{n.timeAgo}</p>
              </div>
            </div>
            <div>
              {n.issueRef ? (
                <Link href={`/issues/${n.issueRef}`} className="text-primary text-sm font-semibold">View Details</Link>
              ) : (
                <span className="text-xs text-gray-400">No linked item</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

