"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  X,
  UploadCloud,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Check,
  CreditCard,
  Video,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ReturnRequestModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

const RETURN_REASONS = [
  "Damaged or Leaked Product",
  "Wrong Item Received",
  "Expired or Near-Expiry Product",
  "Quality / Texture Issue",
  "Seal Broken / Tampered",
  "Other",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.divineyou.net";

export function ReturnRequestModal({
  isOpen,
  order,
  onClose,
  onSuccess,
}: ReturnRequestModalProps) {
  const [reason, setReason] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [comments, setComments] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isCOD =
    order?.payment_method === "Cash on Delivery" ||
    order?.payment_status === "PENDING" ||
    order?.payment_id === "COD_OFFLINE";

  const [payoutType, setPayoutType] = useState<"UPI" | "BANK">("UPI");
  const [upiId, setUpiId] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || !order) return null;

  // Direct Supabase Storage Photo Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (images.length + files.length > 4) {
      alert("You can upload a maximum of 4 photos.");
      return;
    }

    setUploading(true);
    setErrorMsg("");

    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`Image "${file.name}" is larger than 5MB.`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${order.id}-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("return-proofs")
          .upload(fileName, file);

        if (uploadError) {
          alert(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("return-proofs")
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          setImages((prev) => [...prev, urlData.publicUrl]);
        }
      }
    } catch (err: any) {
      setErrorMsg("Failed to upload images to storage.");
    } finally {
      setUploading(false);
    }
  };

  // Direct Supabase Storage Video Upload (Max 30MB)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 30 * 1024 * 1024) {
      alert("Video size must be less than 30MB.");
      return;
    }

    setUploadingVideo(true);
    setErrorMsg("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${order.id}-vid-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("return-proofs")
        .upload(fileName, file);

      if (uploadError) {
        alert(`Failed to upload video: ${uploadError.message}`);
        setUploadingVideo(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("return-proofs")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setVideo(urlData.publicUrl);
      }
    } catch (err: any) {
      setErrorMsg("Failed to upload video to storage.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setErrorMsg("Please select a reason for return.");
      return;
    }
    if (images.length === 0 && !video) {
      setErrorMsg("Please upload at least 1 photo or video proof for admin review.");
      return;
    }

    if (isCOD) {
      if (payoutType === "UPI" && !upiId.trim()) {
        setErrorMsg("Please enter your valid UPI ID to receive your COD refund.");
        return;
      }
      if (payoutType === "BANK" && (!accountHolderName.trim() || !accountNumber.trim() || !ifscCode.trim())) {
        setErrorMsg("Please enter complete Bank Account details for COD refund.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg("");

    const codRefundPayload = isCOD
      ? {
          type: payoutType,
          upi_id: payoutType === "UPI" ? upiId.trim() : null,
          account_holder_name: payoutType === "BANK" ? accountHolderName.trim() : null,
          account_number: payoutType === "BANK" ? accountNumber.trim() : null,
          ifsc_code: payoutType === "BANK" ? ifscCode.trim().toUpperCase() : null,
        }
      : null;

    try {
      const response = await fetch(`${API_URL}/orders/request-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          comments,
          images,
          video,
          codRefundDetails: codRefundPayload,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.message || "Failed to submit return request.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to connect to backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-sans"
    >
      <div className="relative w-full max-w-[580px] max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#EBE5DA] bg-[#FDFBF7] p-6 sm:p-8 shadow-2xl text-[#2C2A29]">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2DAD0]/60">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1C1A19]">
              Request Return / Replacement
            </h2>
            <p className="text-xs text-[#7D7871] mt-1">
              Order {order.id.startsWith("DY-") ? order.id : `DY-${order.id}`} · 15-Day Return Policy
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#EFE9DF] text-[#7D7871] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmitReturn} className="space-y-5 pt-5">
          
          {/* Reason Dropdown */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-semibold text-[#1C1A19] mb-1.5">
              Reason for Return *
            </label>
            
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full rounded-2xl border border-[#ded8ca] bg-white px-4 py-3 text-left text-xs sm:text-sm text-[#243126] flex items-center justify-between shadow-2xs hover:border-[#285538]/50 transition cursor-pointer"
            >
              <span className={reason ? "font-medium text-[#243126]" : "text-[#7D7871]"}>
                {reason || "Select a reason..."}
              </span>
              <ChevronDown
                size={16}
                className={`text-[#7D7871] transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-[#285538]" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[#ded8ca] bg-white p-1.5 shadow-xl transition-all">
                <div className="space-y-0.5">
                  {RETURN_REASONS.map((item) => {
                    const isSelected = reason === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setReason(item);
                          setIsDropdownOpen(false);
                          setErrorMsg("");
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-[#d8e6d7]/80 text-[#285538] font-semibold"
                            : "text-[#243126] hover:bg-[#f3efe6]"
                        }`}
                      >
                        <span>{item}</span>
                        {isSelected && <Check size={16} className="text-[#285538]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COD Refund Section */}
          {isCOD && (
            <div className="rounded-2xl border border-[#ded8ca] bg-[#FAF6EC] p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#285538] font-semibold text-xs">
                  <CreditCard size={15} />
                  <span>Refund Account Details (COD Order)</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#ded8ca]">
                  <button
                    type="button"
                    onClick={() => setPayoutType("UPI")}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                      payoutType === "UPI" ? "bg-[#285538] text-white" : "text-[#7D7871]"
                    }`}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutType("BANK")}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                      payoutType === "BANK" ? "bg-[#285538] text-white" : "text-[#7D7871]"
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              {payoutType === "UPI" ? (
                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1A19] mb-1">Your UPI ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. name@oksbi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-[#ded8ca] bg-white px-3.5 py-2 text-xs text-[#1C1A19] outline-none focus:border-[#285538]"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1C1A19] mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full rounded-xl border border-[#ded8ca] bg-white px-3.5 py-2 text-xs text-[#1C1A19] outline-none focus:border-[#285538]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C1A19] mb-1">Account Number *</label>
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full rounded-xl border border-[#ded8ca] bg-white px-3.5 py-2 text-xs text-[#1C1A19] outline-none focus:border-[#285538]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C1A19] mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        placeholder="SBIN0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-[#ded8ca] bg-white px-3.5 py-2 text-xs text-[#1C1A19] outline-none focus:border-[#285538] uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1A19] mb-1.5">Additional Comments (Optional)</label>
            <textarea
              rows={2}
              placeholder="Explain the issue..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-2xl border border-[#ded8ca] bg-white px-4 py-2.5 text-xs sm:text-sm text-[#1C1A19] outline-none focus:border-[#285538]"
            />
          </div>

          {/* Photos Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1A19] mb-1">Upload Product Photos (Max 4)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-24 rounded-2xl border border-[#ded8ca] overflow-hidden group shadow-2xs bg-[#f3efe6]">
                  <Image src={img} alt="Proof" fill unoptimized className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 transition cursor-pointer shadow-sm"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 border-dashed border-[#b8cfb7] bg-[#f2f7f1] hover:bg-[#e4ede3] transition cursor-pointer text-[#285538] ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                  <span className="text-[11px] font-semibold mt-1">{uploading ? "Uploading..." : "Add Photo"}</span>
                  <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Video Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1A19] mb-1 flex items-center justify-between">
              <span>Unboxing / Damage Video (Optional, Max 30MB)</span>
            </label>
            {video ? (
              <div className="relative rounded-2xl border border-[#ded8ca] bg-black overflow-hidden h-36 flex items-center justify-center">
                <video src={video} className="w-full h-full object-contain" controls />
                <button
                  type="button"
                  onClick={() => setVideo(null)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 transition cursor-pointer z-10 shadow-md"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-[#ded8ca] bg-[#FAF8F2] hover:bg-[#F3EFE6] transition cursor-pointer text-[#243126] ${uploadingVideo ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingVideo ? <Loader2 size={18} className="animate-spin text-[#285538]" /> : <Video size={18} className="text-[#285538]" />}
                <span className="text-xs font-semibold">{uploadingVideo ? "Uploading video..." : "Upload Video Proof (MP4/WebM)"}</span>
                <input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={uploadingVideo} onChange={handleVideoUpload} className="hidden" />
              </label>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FCE8E8] border border-[#F2C2C2] p-3 text-xs text-[#984242]">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || uploading || uploadingVideo}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#285538] py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{submitting ? "Submitting..." : "Submit Return Request"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#ded8ca] bg-white px-5 py-3 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#f3efe6] transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}