import { Plus, Pencil, Trash2, Ban, UserPlus } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminUsersPage() {
  const users = [
    {
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+60 12-345 6789",
      role: "Resident",
      joined: "2023-01-15",
      status: "Active" as const,
    },
    {
      name: "Jane Smith",
      email: "jane.smith@email.com",
      phone: "+60 19-876 5432",
      role: "Moderator",
      joined: "2023-02-20",
      status: "Active" as const,
    },
    {
      name: "Michael Bay",
      email: "michael.bay@email.com",
      phone: "+60 11-223 3445",
      role: "Resident",
      joined: "2023-03-10",
      status: "Suspended" as const,
    },
    {
      name: "Karen White",
      email: "karen.white@email.com",
      phone: "+60 16-555 4321",
      role: "Resident",
      joined: "2023-05-01",
      status: "Active" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">User Management</h1>
        <Button className="gap-2">
          <Plus className="size-5" />
          <span>Add New User</span>
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold">Register New Community User</h3>
        <p className="text-sm text-gray-600 mt-1">Fill in the details below to create a new user account.</p>

        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="full-name">Full Name</label>
            <Input id="full-name" type="text" placeholder="e.g., John Doe" className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="email">Email Address</label>
            <Input id="email" type="email" placeholder="e.g., john.doe@example.com" className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="phone">Phone Number</label>
            <Input id="phone" type="tel" placeholder="e.g., +60 12-345 6789" className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="address">Address</label>
            <Input id="address" type="text" placeholder="e.g., 123, Jalan Inanam" className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
            <Input id="password" type="password" placeholder="Enter a secure password" className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="role">User Role</label>
            <select id="role" className="mt-1 h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 w-full">
              <option>Resident</option>
              <option>Moderator</option>
              <option>Admin</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit" className="gap-2">
              <UserPlus className="size-5" />
              <span>Create User</span>
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Existing Users</h3>
          <p className="text-sm text-gray-600 mt-1">Manage all registered users in the system.</p>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3">
                <input type="checkbox" aria-label="Select all" className="size-4" />
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Name</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Contact Info</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Role</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Joined Date</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input type="checkbox" aria-label={`Select ${u.name}`} className="size-4" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gray-100" />
                    <div className="text-gray-900 font-medium">{u.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-900">{u.email}</div>
                  <div className="text-gray-600 text-xs">{u.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.joined}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{u.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button title="Edit" className="p-2 text-gray-500 hover:text-primary"><Pencil className="size-5" /></button>
                    <button title={u.status === "Active" ? "Suspend" : "Activate"} className="p-2 text-gray-500 hover:text-yellow-600"><Ban className="size-5" /></button>
                    <button title="Delete" className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="size-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">Showing 1-4 of 256</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-3 text-sm">Previous</Button>
            <Button variant="outline" className="h-9 px-3 text-sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
