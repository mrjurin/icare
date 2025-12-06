import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import LocationCapture from "./LocationCapture";
import MediaUploader from "./MediaUploader";

async function createIssue(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServerClient();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const latStr = String(formData.get("lat") || "").trim();
  const lngStr = String(formData.get("lng") || "").trim();
  const mediaJson = String(formData.get("mediaJson") || "").trim();
  const lat = latStr ? Number(latStr) : undefined;
  const lng = lngStr ? Number(lngStr) : undefined;

  if (!title || !description || !category || !address) {
    throw new Error("Missing required fields");
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("issues")
    .insert({ title, description, category, address, lat, lng })
    .select("id")
    .single();

  if (insertErr) {
    throw new Error(insertErr.message);
  }

  try {
    const items: Array<{ url: string; type?: string; size_bytes?: number }> = mediaJson ? JSON.parse(mediaJson) : [];
    if (inserted?.id && items.length > 0) {
      await supabase
        .from("issue_media")
        .insert(
          items.map((m) => ({
            issue_id: inserted.id,
            url: m.url,
            type: (m.type ?? "image").slice(0, 16),
            size_bytes: m.size_bytes ?? null,
          }))
        );
    }
  } catch {
    // ignore media insert errors for now
  }

  redirect("/community/dashboard");
}


export default function CommunityReportIssuePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">Report an Issue</p>
          <p className="text-base text-gray-600 dark:text-gray-400">Provide details so community moderators can act quickly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-1 flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">N.18 INANAM</h2>
            <p className="text-sm text-primary font-semibold mt-1">Community Issue Reporting</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Facing issues like potholes, clogged drains, or faulty streetlights? Let us know.
              We are committed to monitoring every report from the residents of N.18 Inanam.
            </p>
            <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">CARELINE Contact</p>
              <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2"><span>📞</span><span>011-618 18718</span></div>
                <div className="flex items-center gap-2"><span>💬</span><a className="text-primary hover:underline" href="#">WhatsApp Us</a></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">In God We Trust, Unite We Must.</p>
          </div>
        </section>

        <section className="md:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <form className="space-y-8" action={createIssue}>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Step 1: Issue Details</h3>
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <Input name="title" placeholder="Short title, e.g., Pothole near school" className="mt-1 w-full" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type of Issue</label>
                    <select name="category" className="mt-1 h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary">
                      <option value="">Select an issue type</option>
                      <option value="road_maintenance">Road Maintenance</option>
                      <option value="drainage">Drainage</option>
                      <option value="public_safety">Public Safety</option>
                      <option value="sanitation">Sanitation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description of Issue</label>
                    <textarea name="description" rows={5} placeholder="Please provide as much detail as possible. What happened? When? What is the impact?" className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Step 2: Location</h3>
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address or Landmark</label>
                    <Input name="address" placeholder="e.g., Jalan Inanam, near the community hall" className="mt-1 w-full" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pinpoint on Map</label>
                    <LocationCapture />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Drag the pin to the exact location of the issue for fastest response.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Step 3: Attach Media</h3>
                <MediaUploader />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="h-12 px-6">Submit Report</Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
