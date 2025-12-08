"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { createRole, updateRole, type Role, type CreateRoleInput, type UpdateRoleInput } from "@/lib/actions/roles";

type Props = {
  role?: Role;
  trigger: React.ReactNode;
};

export default function RoleFormModal({ role, trigger }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<CreateRoleInput>({
    name: "",
    description: "",
    responsibilities: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Only render dialog after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || "",
        description: role.description || "",
        responsibilities: role.responsibilities || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        responsibilities: "",
      });
    }
    setError(null);
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let result;
      if (role) {
        const input: UpdateRoleInput = {
          id: role.id,
          name: formData.name,
          description: formData.description,
          responsibilities: formData.responsibilities,
        };
        result = await updateRole(input);
      } else {
        result = await createRole(formData);
      }

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      {mounted && (
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-background-dark rounded-xl shadow-xl z-[101] p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {role ? "Edit Role" : "Create New Role"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ketua Cawangan"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the role"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Responsibilities
              </label>
              <RichTextEditor
                placeholder="Detailed responsibilities (e.g., Handles aids and household registration)"
                value={formData.responsibilities}
                onChange={(value) => setFormData({ ...formData, responsibilities: value })}
                namespace="RoleResponsibilitiesEditor"
                disabled={isPending}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : role ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
