import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Flag, User, PlusCircle } from "lucide-react";

export default function AdminIssueDetailPage({ params }: { params: { id: string } }) {
  const issueId = params.id ?? "INC-00123";
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">Dashboard</Link>
        <span className="text-gray-400">/</span>
        <Link href="/issues" className="text-gray-500 hover:text-primary">All Issues</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{issueId}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="min-w-72 flex-1">
          <div className="flex items-center gap-4">
            <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">Pothole on Main Street</p>
            <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/50 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">In Progress</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Issue {issueId} reported by John Doe on 24 July, 2024</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">Mark as Resolved</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Issue Details</h2>
            <p className="text-gray-600 dark:text-gray-300">There&#39;s a large and dangerous pothole in the middle of the road on Main Street, right in front of the bakery. It has been there for over a week and is getting bigger. I saw a car almost lose control after hitting it yesterday. It needs to be filled as soon as possible before it causes an accident.</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Submitted Media</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <Image className="rounded-lg aspect-square object-cover cursor-pointer hover:opacity-80" alt="Pothole" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjPx4OUIw7ptGrWR66LJ54xTpfT0TCGtNmejXBhbrJZxpyftzL81zUAzxP35iL_4-6Iv9x6PSDjcHiM5jAuIrdk01XsSUp1VoChBh4Y6H3YW85oZ0acQKWQhjb0-uYBSuPsVnHLUr4pwclHK_4Hlw6nsMhT_dc7tOSDiEd2bsGUnqSakKF0qnd_iVVyk-tcyiXyZKETkPV0UxCmTASpLorbp54_shRo2mu4dElCsMHMu8PYB2zT3BkS2qCJgVzdlZ19LelwK4Ujgs" width={300} height={300} />
              <Image className="rounded-lg aspect-square object-cover cursor-pointer hover:opacity-80" alt="Pothole close-up" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUMX96u6z4Q8QeglTcJvgOwpdOM3nDJNhwSR2boX75zVu_LyaaXEf6b6fu6_w8HvmlWy107HZSuz9iHgadbc4C5q234TAyF0nxiKQaenAL67lPkKDZPQOeZ9BSwHHbKkHt-H6PAMcnx04XNDyyMKNt2UGo7K3nxP8uk1insdJP-BekK6t9tpFpc4Srf1FT-uG3RaPSGmwGLA9lFB1M3GvMhu62jVTiQ-y3VXSz-3NVYSt5IRriiLujZJOmzWwdI44H4tZ3LO4CAIU" width={300} height={300} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Location</h2>
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg bg-cover bg-center" style={{ backgroundImage: "url(https://lh3.googleusercontent.com/aida-public/AB6AXuCfoutUmf0UQtqFkTcrA4EL7rgreik5BVcsyBDbOxMGaARurRJK3_B4WRUrCmk451YVWFqVDr2KhRJq6vxmcpeP6u769AKwdCBnNcRN9n9T_Doo4fmDfkvrq0gTNxM3ruqjkerpY7MaaJQbZnCnszDfWpErz0av3CsuwJPX73GwDVH9qhn4OfU65r0YtN2gJxJwYBG3LqBfQVhtbnFboxhA_oNvAmuhKUuLJycaNr-GM5K-OYkN6tHBZ1RuT3s9MI3MZ8eSpMvIflI)" }} />
            <p className="text-gray-600 dark:text-gray-300 pt-4">123 Main Street, Inanam, N.18</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Actions</h2>
            <div className="flex flex-col gap-3">
              <Button className="w-full">Update Status</Button>
              <Button variant="outline" className="w-full bg-gray-100 dark:bg-gray-800">Assign</Button>
              <Button variant="outline" className="w-full bg-gray-100 dark:bg-gray-800">Add Comment</Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Activity Log</h2>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary"><User className="size-4" /></div>
                  <div className="flex-1 w-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Assigned to <span className="font-bold">Public Works Dept</span> by Admin A</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">25 July 2024, 09:45 AM</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center size-8 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400"><Flag className="size-4" /></div>
                  <div className="flex-1 w-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Status changed to <span className="font-bold">In Progress</span> by Admin A</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">25 July 2024, 09:41 AM</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"><PlusCircle className="size-4" /></div>
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Issue created by <span className="font-bold">John Doe</span></p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">24 July 2024, 03:12 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
