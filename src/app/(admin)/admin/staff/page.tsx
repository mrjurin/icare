import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { getStaffList } from "@/lib/actions/staff";
import StaffTable from "./StaffTable";
import StaffFormModal from "./StaffFormModal";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const roleFilter = typeof sp.role === "string" ? sp.role : undefined;
  const statusFilter = typeof sp.status === "string" ? sp.status : undefined;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : 10;

  const result = await getStaffList({
    search,
    role: roleFilter as "adun" | "super_admin" | "zone_leader" | "staff_manager" | "staff" | undefined,
    status: statusFilter as "active" | "inactive" | undefined,
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 10 : limit,
  });

  const paginatedData = result.success ? result.data : null;
  const staffList = paginatedData?.data || [];
  const pagination = paginatedData
    ? {
        currentPage: paginatedData.page,
        totalPages: paginatedData.totalPages,
        totalItems: paginatedData.total,
        itemsPerPage: paginatedData.limit,
      }
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage ADUN and staff members who can be assigned to issues</p>
        </div>
        <StaffFormModal
          trigger={
            <Button className="gap-2">
              <Plus className="size-5" />
              <span>Add Staff</span>
            </Button>
          }
        />
      </div>

      <StaffTable staffList={staffList} pagination={pagination} />
    </div>
  );
}
