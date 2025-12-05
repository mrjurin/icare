import Image from "next/image";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Pencil } from "lucide-react";

export default function CommunityProfilePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">My Profile</p>
          <p className="text-base text-gray-600 dark:text-gray-400">Manage your personal information and track your activity.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800 pb-8">
            <div className="relative">
              <Image className="rounded-full" alt="User avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAb-eIawPtC5Og3JJtMbEPozMMIsQbzzTkpZPcTAURowGnT1ihVAtAPL_lXehKSq4WyL1KC1F9KhA_nXirCUXXqJUZjO0tXCuk1tXnRK8S2hKaDPTuqZQSbXl81XWEnz-O1zhB2gz4GQiMtqkkDul_7qJJnla5fPvQNtFRnHh0DHB2mQw8gHIpke51RfMwfLVZb6uhlCXczgR6MDmf7bereyrXm4pD56hRvslv8HmoXEixJd9EhePN1clVLqUD_TX6y9CaeZl3Zetg" width={96} height={96} />
              <button className="absolute bottom-0 right-0 flex items-center justify-center size-8 bg-gray-100 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Edit avatar">
                <Pencil className="size-4 text-gray-900 dark:text-white" />
              </button>
            </div>
            <div className="flex flex-col">
              <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white">Jane Doe</p>
              <p className="text-base text-gray-600 dark:text-gray-400">N.18 Inanam Resident</p>
            </div>
          </div>

          <h2 className="text-[22px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white px-4">Personal Information</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Full Name</label>
              <Input defaultValue="Jane Doe" className="h-14" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Email Address</label>
              <Input defaultValue="jane.doe@email.com" className="h-14" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Contact Number</label>
              <Input defaultValue="+60 12-345 6789" className="h-14" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Address (Optional)</label>
              <Input placeholder="e.g., 123 Jalan Inanam" className="h-14" />
            </div>
          </form>

          <div className="flex justify-end gap-4 px-4 mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

