import Button from "@/components/ui/Button";

export default function CommunityDashboardPage() {
  const issues = [
    { id: "#12345", title: "Pothole on Jalan Permai", cat: "Road Maintenance", date: "2024-07-15", status: "In Progress" },
    { id: "#12342", title: "Broken Streetlight near Park", cat: "Public Safety", date: "2024-07-12", status: "Resolved" },
    { id: "#12348", title: "Clogged drain at Lorong 3", cat: "Drainage", date: "2024-07-18", status: "Pending" },
  ];

  return (
    <div className="space-y-8">
      

      <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-primary">📣</span>
            <h3 className="text-lg font-bold">Recent Announcements</h3>
          </div>
          <button className="text-primary text-sm font-bold">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Community Hall Maintenance</h4>
            <p className="text-sm text-gray-600">The community hall will be closed for maintenance from August 1st to August 5th. We apologize for any inconvenience caused.</p>
            <button className="text-sm font-semibold text-primary mt-1">Read more</button>
          </div>
          <div>
            <h4 className="font-semibold">Upcoming Town Hall Meeting</h4>
            <p className="text-sm text-gray-600">Join us for the quarterly town hall meeting on July 28th at 7 PM to discuss upcoming community projects and address resident concerns.</p>
            <button className="text-sm font-semibold text-primary mt-1">Read more</button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-4xl font-black tracking-[-0.033em]">My Reported Issues</p>
      </div>
      <div className="border-b border-gray-300 px-1">
        {["All","Pending","In Progress","Resolved"].map((t, i) => (
          <button key={i} className={`px-3 py-3 text-sm font-bold ${i===0?"text-primary border-b-2 border-primary":"text-gray-500 hover:text-primary"}`}>{t}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left w-[40%]">Issue</th>
              <th className="px-4 py-3 text-left w-[20%]">Category</th>
              <th className="px-4 py-3 text-left w-[15%]">Date Submitted</th>
              <th className="px-4 py-3 text-left w-[15%]">Status</th>
              <th className="px-4 py-3 text-left w-auto"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t block sm:table-row p-4 sm:p-0">
              <td className="px-4 py-2 block sm:table-cell">{issues[0].title} ({issues[0].id})</td>
              <td className="px-4 py-2 text-gray-600 block sm:table-cell">{issues[0].cat}</td>
              <td className="px-4 py-2 text-gray-600 block sm:table-cell">{issues[0].date}</td>
              <td className="px-4 py-2 block sm:table-cell"><span className="inline-flex items-center rounded-full h-7 px-3 bg-blue-100 text-blue-600 text-xs font-medium">In Progress</span></td>
              <td className="px-4 py-2 block sm:table-cell text-primary font-bold sm:text-right">View Details</td>
            </tr>
            <tr className="border-t block sm:table-row p-4 sm:p-0 align-top">
              <td className="px-4 pt-1 block sm:table-cell">{issues[1].title} ({issues[1].id})</td>
              <td className="px-4 block sm:table-cell text-gray-600">{issues[1].cat}</td>
              <td className="px-4 block sm:table-cell text-gray-600">{issues[1].date}</td>
              <td className="px-4 block sm:table-cell"><span className="inline-flex items-center rounded-full h-7 px-3 bg-green-100 text-green-600 text-xs font-medium">Resolved</span></td>
              <td className="px-4 block sm:table-cell text-primary font-bold sm:text-right"><button className="inline-flex items-center gap-1.5 rounded-md h-8 px-3 text-xs font-bold border border-primary text-primary">★ Rate Resolution</button></td>
            </tr>
            <tr className="border-t-0 sm:border-t">
              <td colSpan={5} className="p-0 sm:p-4 sm:pt-0">
                <div className="bg-gray-50 p-4 sm:rounded-b-lg -mt-4 sm:mt-0 max-w-lg">
                  <h4 className="text-base font-bold">Provide Feedback</h4>
                  <div className="mt-2">
                    <label className="block text-sm font-medium mb-2" htmlFor="satisfaction">How satisfied are you with the resolution?</label>
                    <div className="flex gap-1 text-2xl text-gray-300">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} aria-label={`Rate ${i+1} stars`}>★</button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" htmlFor="comments">Additional Comments (Optional)</label>
                    <textarea id="comments" rows={3} placeholder="Tell us more about your experience..." className="w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"></textarea>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <Button variant="outline" className="h-9">Cancel</Button>
                    <Button className="h-9">Submit Feedback</Button>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-t block sm:table-row p-4 sm:p-0">
              <td className="px-4 py-2 block sm:table-cell">{issues[2].title} ({issues[2].id})</td>
              <td className="px-4 py-2 text-gray-600 block sm:table-cell">{issues[2].cat}</td>
              <td className="px-4 py-2 text-gray-600 block sm:table-cell">{issues[2].date}</td>
              <td className="px-4 py-2 block sm:table-cell"><span className="inline-flex items-center rounded-full h-7 px-3 bg-orange-100 text-orange-600 text-xs font-medium">Pending</span></td>
              <td className="px-4 py-2 block sm:table-cell text-primary font-bold sm:text-right">View Details</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
