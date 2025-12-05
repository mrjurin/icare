"use client";

import * as Switch from "@radix-ui/react-switch";
import * as Select from "@radix-ui/react-select";
import { UploadCloud, Save } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Platform Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage global application settings for the Community Watch platform.</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Branding</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customize the look and feel of the application.</p>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">App Logo</p>
              <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                <div className="size-12 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center hover:border-primary dark:hover:border-primary">
                <UploadCloud className="mx-auto size-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                <input className="sr-only" type="file" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">General Information</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update general contact and support information.</p>
        </div>
        <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="careline-number">CARELINE Phone Number</label>
            <Input id="careline-number" type="tel" placeholder="+60 12-345 6789" defaultValue="+60 18-181 8181" className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="whatsapp-link">WhatsApp Link</label>
            <Input id="whatsapp-link" type="url" placeholder="https://wa.me/..." defaultValue="https://wa.me/60181818181" className="mt-1 w-full" />
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Issue Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set default settings for new issue reports.</p>
        </div>
        <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="default-status">Default Status for New Issues</label>
            <Select.Root defaultValue="Open">
              <Select.Trigger id="default-status" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                <Select.Value />
                <span className="ml-2 text-gray-500">▾</span>
              </Select.Trigger>
              <Select.Content className="z-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
                <Select.Viewport className="p-1">
                  <Select.Item value="Open" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Open</Select.Item>
                  <Select.Item value="Under Review" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Under Review</Select.Item>
                  <Select.Item value="Pending" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Pending</Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="default-priority">Default Priority for New Issues</label>
            <Select.Root defaultValue="Medium">
              <Select.Trigger id="default-priority" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                <Select.Value />
                <span className="ml-2 text-gray-500">▾</span>
              </Select.Trigger>
              <Select.Content className="z-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
                <Select.Viewport className="p-1">
                  <Select.Item value="Low" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Low</Select.Item>
                  <Select.Item value="Medium" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Medium</Select.Item>
                  <Select.Item value="High" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">High</Select.Item>
                  <Select.Item value="Critical" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Critical</Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Root>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Notification Preferences</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure when administrators receive notifications.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">New Issue Submitted</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify when a resident submits a new issue report.</p>
            </div>
            <Switch.Root defaultChecked className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-primary data-[state=unchecked]:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
              <Switch.Thumb className="block h-5 w-5 translate-x-5 data-[state=unchecked]:translate-x-0 rounded-full bg-white shadow transition-transform" />
            </Switch.Root>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Issue Status Changed</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify when an issue&#39;s status is updated.</p>
            </div>
            <Switch.Root defaultChecked className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-primary data-[state=unchecked]:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
              <Switch.Thumb className="block h-5 w-5 translate-x-5 data-[state=unchecked]:translate-x-0 rounded-full bg-white shadow transition-transform" />
            </Switch.Root>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">New User Registered</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify when a new resident registers on the platform.</p>
            </div>
            <Switch.Root className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
              <Switch.Thumb className="block h-5 w-5 translate-x-0 data-[state=checked]:translate-x-5 rounded-full bg-white shadow transition-transform" />
            </Switch.Root>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button">
          <span>Cancel</span>
        </Button>
        <Button type="submit">
          <Save className="size-5" />
          <span>Save Changes</span>
        </Button>
      </div>
    </div>
  );
}
