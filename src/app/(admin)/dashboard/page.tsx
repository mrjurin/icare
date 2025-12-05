export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Overview of reports and activity</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold">Export</button>
          <button className="rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold">New Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {label:"Pending",value:"128"},
          {label:"In Review",value:"42"},
          {label:"Resolved",value:"950"},
          {label:"Overdue",value:"17"},
        ].map((k, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{k.label}</p>
            <p className="text-3xl font-bold text-primary">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            {label:"All"},
            {label:"Pending"},
            {label:"In Review"},
            {label:"Resolved"},
            {label:"Overdue"},
          ].map((f, i) => (
            <button key={i} className="rounded-full px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">{f.label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="rounded-lg h-10 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm" placeholder="Search reports" />
          <button className="rounded-lg h-10 px-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm">Filters</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <table className="min-w-full text-sm">
          <thead className="text-left bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {[
              {id:"#1298",title:"Streetlight outage at Jalan 3",cat:"Infrastructure",status:"Pending",created:"2025-11-29",assignee:"Unassigned"},
              {id:"#1297",title:"Blocked drain near Pasar",cat:"Sanitation",status:"In Review",created:"2025-11-28",assignee:"A. Rahman"},
              {id:"#1296",title:"Potholes along Inanam Road",cat:"Roads",status:"Resolved",created:"2025-11-25",assignee:"M. Tan"},
            ].map((r, i) => (
              <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-4 py-3">{r.id}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">{r.cat}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800">{r.status}</span>
                </td>
                <td className="px-4 py-3">{r.created}</td>
                <td className="px-4 py-3">{r.assignee}</td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-md px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
