"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createMembershipApplication } from "@/lib/actions/memberships";
import { getZonesPublic } from "@/lib/actions/zones";
import { getCawanganPublic } from "@/lib/actions/cawangan";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhotoUpload from "./PhotoUpload";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Zone = {
  id: number;
  name: string;
};

type Cawangan = {
  id: number;
  name: string;
};

type PreviousParty = {
  partyName: string;
  fromDate: string;
  toDate: string;
};

export default function MembershipApplicationPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Data
  const [zones, setZones] = useState<Zone[]>([]);
  const [cawangan, setCawangan] = useState<Cawangan[]>([]);

  // Form data
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [cawanganId, setCawanganId] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [race, setRace] = useState("");
  const [religion, setReligion] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [wasPreviousMember, setWasPreviousMember] = useState(false);
  const [wasOtherPartyMember, setWasOtherPartyMember] = useState(false);
  const [previousParties, setPreviousParties] = useState<PreviousParty[]>([]);

  // Load zones on mount
  useEffect(() => {
    getZonesPublic().then((result) => {
      if (result.success && result.data) {
        setZones(result.data);
      }
    });
  }, []);

  // Load cawangan when zone is selected
  useEffect(() => {
    if (zoneId) {
      getCawanganPublic(zoneId).then((result) => {
        if (result.success && result.data) {
          setCawangan(result.data);
          setCawanganId(null); // Reset cawangan selection
        }
      });
    } else {
      setCawangan([]);
      setCawanganId(null);
    }
  }, [zoneId]);

  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 1:
        if (!zoneId) {
          setError("Please select a zone");
          return false;
        }
        if (!cawanganId) {
          setError("Please select a cawangan");
          return false;
        }
        return true;

      case 2:
        if (!fullName.trim()) {
          setError("Full name is required");
          return false;
        }
        if (!icNumber.trim()) {
          setError("IC number is required");
          return false;
        }
        if (!phone.trim()) {
          setError("Phone number is required");
          return false;
        }
        return true;

      case 3:
        if (!photoUrl) {
          setError("Photo is required");
          return false;
        }
        return true;

      case 4:
        // Step 4 validation is optional
        if (wasOtherPartyMember && previousParties.length === 0) {
          setError("Please add at least one previous party if you were a member of another party");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  const addPreviousParty = () => {
    setPreviousParties([...previousParties, { partyName: "", fromDate: "", toDate: "" }]);
  };

  const removePreviousParty = (index: number) => {
    setPreviousParties(previousParties.filter((_, i) => i !== index));
  };

  const updatePreviousParty = (index: number, field: keyof PreviousParty, value: string) => {
    const updated = [...previousParties];
    updated[index] = { ...updated[index], [field]: value };
    setPreviousParties(updated);
  };

  const handleSubmit = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    startTransition(async () => {
      const result = await createMembershipApplication({
        zoneId: zoneId!,
        cawanganId: cawanganId!,
        fullName,
        icNumber,
        phone,
        email: email || undefined,
        address: address || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        race: race || undefined,
        religion: religion || undefined,
        photoUrl: photoUrl || undefined,
        wasPreviousMember,
        previousParties: wasOtherPartyMember ? previousParties.filter(p => p.partyName.trim()) : undefined,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(result.error || "Failed to submit application");
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Application Submitted Successfully!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your membership application has been submitted. Our zone office will review your application.
              You will be notified once the review is complete.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to homepage...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Party Membership Application
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please fill out all required information to apply for party membership.
          </p>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex-1 flex items-center ${
                    step < 4 ? "mr-2" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Zone & Branch</span>
              <span>Personal Details</span>
              <span>Photo</span>
              <span>Previous Membership</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Zone and Cawangan */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 1: Zone and Cawangan (Branch)
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zone <span className="text-red-500">*</span>
                </label>
                <select
                  value={zoneId || ""}
                  onChange={(e) => setZoneId(Number(e.target.value) || null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cawangan (Branch) <span className="text-red-500">*</span>
                </label>
                <select
                  value={cawanganId || ""}
                  onChange={(e) => setCawanganId(Number(e.target.value) || null)}
                  disabled={!zoneId || cawangan.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select Cawangan</option>
                  {cawangan.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 2: Personal Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IC Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                    placeholder="Enter IC number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="L">Male</option>
                    <option value="P">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Race
                  </label>
                  <Input
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    placeholder="Enter race"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Religion
                  </label>
                  <Input
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    placeholder="Enter religion"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter address"
                />
              </div>
            </div>
          )}

          {/* Step 3: Photo Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 3: Photo Upload
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please upload a photo that will be used for your membership certificate and card.
              </p>
              <PhotoUpload value={photoUrl || undefined} onChange={setPhotoUrl} error={error || undefined} />
            </div>
          )}

          {/* Step 4: Previous Membership */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 4: Previous Membership
              </h2>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={wasPreviousMember}
                    onChange={(e) => setWasPreviousMember(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Were you previously a member of this party?
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={wasOtherPartyMember}
                    onChange={(e) => setWasOtherPartyMember(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Were you previously a member of another party?
                  </span>
                </label>
              </div>

              {wasOtherPartyMember && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Previous Party Memberships
                    </h3>
                    <Button type="button" onClick={addPreviousParty} variant="outline">
                      Add Party
                    </Button>
                  </div>

                  {previousParties.map((party, index) => (
                    <div key={index} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 dark:text-white">Party {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removePreviousParty(index)}
                          variant="outline"
                          className="text-sm h-8 px-3"
                        >
                          Remove
                        </Button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Party Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={party.partyName}
                          onChange={(e) => updatePreviousParty(index, "partyName", e.target.value)}
                          placeholder="Enter party name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            From Date
                          </label>
                          <Input
                            type="date"
                            value={party.fromDate}
                            onChange={(e) => updatePreviousParty(index, "fromDate", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            To Date
                          </label>
                          <Input
                            type="date"
                            value={party.toDate}
                            onChange={(e) => updatePreviousParty(index, "toDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button type="button" onClick={handleBack} variant="outline">
                  Back
                </Button>
              )}
            </div>
            <div>
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext} disabled={isPending}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
