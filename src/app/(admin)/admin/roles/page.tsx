import { Plus, UserCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { getRoles } from "@/lib/actions/roles";
import RoleTable from "./RoleTable";
import RoleFormModal from "./RoleFormModal";
import RoleAssignmentsSection from "./RoleAssignmentsSection";

export default async function AdminRolesPage() {
  const result = await getRoles();
  const roles = result.success ? result.data || [] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Roles & Appointments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage roles and appoint staff to Branch Chief and Village Chief positions in zones and villages</p>
        </div>
        <RoleFormModal
          trigger={
            <Button className="gap-2">
              <Plus className="size-5" />
              <span>Add Role</span>
            </Button>
          }
        />
      </div>

      <RoleTable roles={roles} />

      <RoleAssignmentsSection />
    </div>
  );
}
