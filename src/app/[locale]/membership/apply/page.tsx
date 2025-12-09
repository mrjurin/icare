"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTransition } from "react";
import { createMembershipApplication } from "@/lib/actions/memberships";
import { getZonesPublic } from "@/lib/actions/zones";
import { getCawanganPublic } from "@/lib/actions/cawangan";
import { getReferenceDataListPublic } from "@/lib/actions/reference-data";
import type { ReferenceData } from "@/lib/actions/reference-data";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhotoUpload from "./PhotoUpload";
import { CheckCircle2, AlertCircle, Loader2, MapPin, User, Camera, History, ChevronRight, ChevronLeft } from "lucide-react";

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
  const [loadingCawangan, setLoadingCawangan] = useState(false);
  const [genders, setGenders] = useState<ReferenceData[]>([]);
  const [races, setRaces] = useState<ReferenceData[]>([]);
  const [religions, setReligions] = useState<ReferenceData[]>([]);

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

  // Load zones and reference data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load zones
        const zonesResult = await getZonesPublic();
        if (zonesResult.success && zonesResult.data) {
          setZones(zonesResult.data);
        } else {
          console.error("Failed to load zones:", zonesResult.error);
        }

        // Load reference data
        const [gendersResult, racesResult, religionsResult] = await Promise.all([
          getReferenceDataListPublic("genders"),
          getReferenceDataListPublic("races"),
          getReferenceDataListPublic("religions"),
        ]);

        if (gendersResult.success && gendersResult.data) {
          console.log("Loaded genders:", gendersResult.data);
          setGenders(gendersResult.data);
        } else {
          console.error("Failed to load genders:", gendersResult.error);
        }

        if (racesResult.success && racesResult.data) {
          console.log("Loaded races:", racesResult.data.length);
          setRaces(racesResult.data);
        } else {
          console.error("Failed to load races:", racesResult.error);
        }

        if (religionsResult.success && religionsResult.data) {
          console.log("Loaded religions:", religionsResult.data.length);
          setReligions(religionsResult.data);
        } else {
          console.error("Failed to load religions:", religionsResult.error);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Load cawangan when zone is selected
  useEffect(() => {
    if (zoneId && zoneId > 0) {
      setLoadingCawangan(true);
      setCawangan([]);
      setCawanganId(null); // Reset cawangan selection
      
      getCawanganPublic(zoneId)
        .then((result) => {
          if (result.success && result.data) {
            setCawangan(result.data);
          } else {
            console.error("Failed to load cawangan:", result.error);
            setCawangan([]);
          }
        })
        .catch((error) => {
          console.error("Error loading cawangan:", error);
          setCawangan([]);
        })
        .finally(() => {
          setLoadingCawangan(false);
        });
    } else {
      setCawangan([]);
      setCawanganId(null);
      setLoadingCawangan(false);
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

  const steps = [
    { number: 1, title: "Zone & Branch", icon: MapPin, description: "Select your zone and cawangan" },
    { number: 2, title: "Personal Details", icon: User, description: "Enter your personal information" },
    { number: 3, title: "Photo Upload", icon: Camera, description: "Upload your photo" },
    { number: 4, title: "Previous Membership", icon: History, description: "Membership history" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Party Membership Application
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Complete the form below to apply for party membership
          </p>
        </div>

          {/* Progress indicator */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isUpcoming = currentStep < step.number;

              return (
                <div key={step.number} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative flex items-center justify-center w-full">
                      {/* Step Circle */}
                  <div
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110"
                            : isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                        )}
                        {isActive && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                        )}
                  </div>

                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                    <div
                          className={`absolute top-6 left-1/2 w-full h-0.5 transition-all duration-300 ${
                            isCompleted
                              ? "bg-green-500"
                              : currentStep > step.number
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                          style={{ width: "calc(100% - 3rem)", marginLeft: "3rem" }}
                    />
                  )}
                </div>

                    {/* Step Label */}
                    <div className="mt-4 text-center max-w-[120px]">
                      <p
                        className={`text-xs font-semibold mb-1 ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : isCompleted
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {step.description}
                      </p>
                    </div>
            </div>
            </div>
              );
            })}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8 lg:p-10">

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg flex items-start animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Please fix the following error:</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Zone and Cawangan */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Zone and Cawangan (Branch)
              </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Select your zone and branch location
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Zone <span className="text-red-500">*</span>
                </label>
                <select
                  value={zoneId || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setZoneId(null);
                      } else {
                        const numValue = Number(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          setZoneId(numValue);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cawangan (Branch) <span className="text-red-500">*</span>
                </label>
                <select
                  value={cawanganId || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCawanganId(value ? Number(value) : null);
                    }}
                    disabled={!zoneId || loadingCawangan}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">
                      {!zoneId 
                        ? "Select zone first" 
                        : loadingCawangan 
                        ? "Loading cawangan..." 
                        : cawangan.length === 0 
                        ? "No cawangan available" 
                        : "Select Cawangan"}
                    </option>
                  {cawangan.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                  {loadingCawangan && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Loading cawangan...
                    </p>
                  )}
                  {!loadingCawangan && zoneId && cawangan.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No cawangan found for this zone
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Personal Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Enter your personal information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    IC Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                    placeholder="Enter IC number"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email <span className="text-xs text-gray-500">(optional)</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Gender</option>
                    {genders.map((g) => (
                      <option key={g.id} value={g.code || g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Race
                  </label>
                  <select
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Race</option>
                    {races.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Religion
                  </label>
                  <select
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Religion</option>
                    {religions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Enter your full address"
                />
              </div>
            </div>
          )}

          {/* Step 3: Photo Upload */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Photo Upload
              </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Upload a photo for your membership certificate and card
              </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <PhotoUpload value={photoUrl || undefined} onChange={setPhotoUrl} error={error || undefined} />
              </div>
            </div>
          )}

          {/* Step 4: Previous Membership */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Previous Membership
              </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tell us about your previous party memberships
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wasPreviousMember}
                    onChange={(e) => setWasPreviousMember(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                    Were you previously a member of this party?
                  </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                        Check this if you have been a member before
                      </span>
                    </div>
                </label>
              </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wasOtherPartyMember}
                    onChange={(e) => setWasOtherPartyMember(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                    Were you previously a member of another party?
                  </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                        If yes, please add details below
                      </span>
                    </div>
                </label>
                </div>
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
                    <div key={index} className="p-5 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                          <History className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                          Previous Party {index + 1}
                        </h4>
                        <Button
                          type="button"
                          onClick={() => removePreviousParty(index)}
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm h-8 px-3"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Party Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={party.partyName}
                          onChange={(e) => updatePreviousParty(index, "partyName", e.target.value)}
                          placeholder="Enter party name"
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            From Date
                          </label>
                          <Input
                            type="date"
                            value={party.fromDate}
                            onChange={(e) => updatePreviousParty(index, "fromDate", e.target.value)}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            To Date
                          </label>
                          <Input
                            type="date"
                            value={party.toDate}
                            onChange={(e) => updatePreviousParty(index, "toDate", e.target.value)}
                            className="w-full"
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
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  onClick={handleBack} 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Step {currentStep} of {steps.length}
              </span>
              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  disabled={isPending}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={isPending}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Application</span>
                    </>
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
