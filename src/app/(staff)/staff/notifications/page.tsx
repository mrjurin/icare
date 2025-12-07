export default async function StaffNotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Notifications</h1>
        <p className="text-gray-600 mt-1">Stay updated with recent activities</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No notifications at this time.</p>
      </div>
    </div>
  );
}
