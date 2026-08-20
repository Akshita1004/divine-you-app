"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface AddAddressModalProps {
  isOpen: boolean;
  initialData?: any;
  onClose: () => void;
  onSave: (addressData: any) => Promise<void>;
}

export function AddAddressModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: AddAddressModalProps) {
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [mobileError, setMobileError] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    fullName: "",
    mobile: "",
    addressLine1: "",
    apartment: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
    type: "Home",
    isDefault: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || "",
        fullName: initialData.fullName || "",
        mobile: initialData.mobile || "",
        addressLine1: initialData.addressLine1 || "",
        apartment: initialData.apartment || "",
        pincode: initialData.pincode || "",
        city: initialData.city || "",
        state: initialData.state || "",
        country: initialData.country || "India",
        type: initialData.type || "Home",
        isDefault: !!initialData.isDefault,
      });
    } else {
      setFormData({
        id: "",
        fullName: "",
        mobile: "",
        addressLine1: "",
        apartment: "",
        pincode: "",
        city: "",
        state: "",
        country: "India",
        type: "Home",
        isDefault: false,
      });
    }
    setPincodeError("");
    setMobileError("");
  }, [initialData, isOpen]);

  // Handle Mobile Input Change (Only Digits & Max 10 chars)
  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: cleaned }));
    if (cleaned.length === 10) {
      setMobileError("");
    } else if (cleaned.length > 0) {
      setMobileError("Invalid Mobile Number.");
    } else {
      setMobileError("");
    }
  };

  // Automatic Pincode Lookup Handler
  const handlePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: cleaned }));
    setPincodeError("");

    if (cleaned.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        const data = await res.json();

        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          setFormData((prev) => ({
            ...prev,
            city: postOffice.District || postOffice.Division || "",
            state: postOffice.State || "",
          }));
        } else {
          setPincodeError("Invalid Pincode. Please check again.");
        }
      } catch (err) {
        console.error("Pincode lookup error:", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce 10-digit Mobile Number Constraint
    if (!/^\d{10}$/.test(formData.mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Failed to save address:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#e8e2d4] bg-[#fbf9f3] p-6 sm:p-8 shadow-2xl text-[#243126]">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">
              {initialData ? "Edit Address" : "Add New Address"}
            </h2>
            <p className="text-xs text-[#66655d] mt-1">
              Saved addresses can be selected during checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 hover:bg-[#ede8de] transition text-[#66655d] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Mobile number
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
              />
              {mobileError && (
                <p className="text-[10px] text-red-600 mt-1">{mobileError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
              Address line 1
            </label>
            <input
              type="text"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] focus:border-[#285538] focus:bg-white outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
              Apartment / Landmark (optional)
            </label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] focus:border-[#285538] focus:bg-white outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Pincode
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit Pincode"
                  value={formData.pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] focus:border-[#285538] focus:bg-white outline-none transition"
                />
                {pincodeLoading && (
                  <Loader2
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#285538]"
                  />
                )}
              </div>
              {pincodeError && (
                <p className="text-[10px] text-red-600 mt-1">{pincodeError}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                City
              </label>
              <input
                type="text"
                required
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                State
              </label>
              <input
                type="text"
                required
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Country
              </label>
              <input
                type="text"
                readOnly
                value={formData.country}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none opacity-80 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Type of Address */}
          <div className="pt-2">
            <label className="block text-[12px] font-semibold text-[#243126] mb-2">
              Type of address
            </label>
            <div className="flex items-center gap-6 text-xs sm:text-sm text-[#243126]">
              {["Home", "Work", "Other"].map((item) => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="addressType"
                    value={item}
                    checked={formData.type === item}
                    onChange={() => setFormData({ ...formData, type: item })}
                    className="accent-[#285538]"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Set as Default Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-[#66655d] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded accent-[#285538]"
              />
              <span>Set as default address</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#285538] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer shadow-2xs disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Address"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#ded8ca] bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#f3efe6] transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}