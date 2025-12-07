import { Plus, Edit, Trash2, Send } from "lucide-react";
import Input from "@/components/ui/Input";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Public Announcement Management</h1>
        <button className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold hover:bg-primary/90">
          <Plus className="size-5" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
        <h3 className="text-lg font-semibold">Compose New Announcement</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create and schedule announcements for the community.</p>

        <form className="mt-6 flex flex-col gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="announcement-title">Announcement Title</label>
            <Input
              id="announcement-title"
              type="text"
              placeholder="e.g., Community Clean-up Day"
              className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="announcement-content">Content</label>
            <div className="mt-1">
              <RichTextEditor placeholder="Write your announcement here..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="publish-date">Publish Date</label>
              <Input
                id="publish-date"
                type="datetime-local"
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="expiry-date">Expiry Date</label>
              <Input
                id="expiry-date"
                type="datetime-local"
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <button type="button" className="flex items-center justify-center gap-2 rounded-lg h-10 border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold hover:bg-primary/90">
              <Send className="size-5" />
              <span>Publish Announcement</span>
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="p-6">
          <h3 className="text-lg font-semibold">All Announcements</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage all past and scheduled announcements.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Title</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Publish Date</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Expiry Date</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                {
                  title: "Community Clean-up Day",
                  status: { label: "Published", class: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
                  publish: "Sep 1, 2023, 9:00 AM",
                  expiry: "Sep 5, 2023, 5:00 PM",
                },
                {
                  title: "Water Supply Interruption Notice",
                  status: { label: "Scheduled", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" },
                  publish: "Sep 10, 2023, 8:00 AM",
                  expiry: "Sep 11, 2023, 8:00 AM",
                },
                {
                  title: "Monthly Committee Meeting",
                  status: { label: "Expired", class: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
                  publish: "Aug 15, 2023, 8:00 PM",
                  expiry: "Aug 16, 2023, 9:00 PM",
                },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{r.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status.class}`}>{r.status.label}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{r.publish}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{r.expiry}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary" title="Edit"><Edit className="size-5" /></button>
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500" title="Delete"><Trash2 className="size-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
