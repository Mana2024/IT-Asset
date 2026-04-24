"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Package } from "lucide-react";
import { processIMInitialReview, processApproval, issueAsset } from "@/app/actions/approvals";
import { processServiceRequest } from "@/app/actions/requests";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { use } from "react";

export default function ApprovalReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const [approval, setApproval] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // IM Initial Review state
  const [imNotes, setImNotes] = useState("");
  const [tentativeAssetId, setTentativeAssetId] = useState<number | null>(null);
  const [imDecision, setImDecision] = useState<"Approved" | "Rejected" | null>(null);

  // JIO / SIO state
  const [decision, setDecision] = useState<"Approved" | "Rejected" | null>(null);
  const [comments, setComments] = useState("");

  // IM Service Processing state
  const [serviceDecision, setServiceDecision] = useState<"Approved" | "Rejected" | null>(null);
  const [serviceComments, setServiceComments] = useState("");

  // IM Final Processing state
  const [finalAssetId, setFinalAssetId] = useState<number | null>(null);
  const [assignedToName, setAssignedToName] = useState("");
  const [conditionOnIssue, setConditionOnIssue] = useState("");
  const [endOfLifeDate, setEndOfLifeDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().split("T")[0];
  });
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    fetch(`/api/approvals/${id}`).then((r) => r.json()).then((d) => {
      if (d.approval) {
        setApproval(d.approval);
        fetch(`/api/requests/${d.approval.request_id}`).then((r) => r.json()).then((d) => {
          setRequest(d.request);
          if (d.request?.tentative_asset_id) setFinalAssetId(d.request.tentative_asset_id);
        });
        if (d.approval.step === "IM Initial Review" || d.approval.step === "IM Final Processing") {
          fetch("/api/assets?status=Available").then((r) => r.json()).then((d) => setAvailableAssets(d.assets ?? []));
        }
      }
    });
  }, [id]);

  if (!approval) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const step: string = approval.step;

  const handleServiceRequest = () => {
    if (!serviceDecision) { setError("Please select Approve or Reject."); return; }
    setError("");
    startTransition(async () => {
      await processServiceRequest(parseInt(id), serviceDecision, serviceComments);
      router.push("/approvals");
    });
  };

  const handleIMInitialReview = () => {
    if (!imDecision) { setError("Please select Approve or Reject."); return; }
    setError("");
    startTransition(async () => {
      await processIMInitialReview(parseInt(id), imDecision, tentativeAssetId, imNotes);
      router.push("/approvals");
    });
  };

  const handleJioSioApproval = () => {
    if (!decision) { setError("Please select a decision."); return; }
    if (!comments.trim()) { setError("Comments are required."); return; }
    setError("");
    startTransition(async () => {
      await processApproval(parseInt(id), decision, comments);
      router.push("/approvals");
    });
  };

  const handleIssueAsset = () => {
    if (!finalAssetId) { setError("Please select an asset to assign."); return; }
    const isExternal = request?.request_type === "External Issuance";
    if (!isExternal && !assignedToName.trim()) { setError("Assigned-to name is required."); return; }
    if (!acknowledged) { setError("Acknowledgement checkbox must be checked."); return; }
    setError("");
    startTransition(async () => {
      await issueAsset(parseInt(id), finalAssetId, assignedToName, conditionOnIssue, endOfLifeDate, acknowledged);
      router.push("/approvals");
    });
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/approvals" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Approvals
        </Link>
      </div>

      <PageHeader title="Review Request" subtitle={`Approval step: ${step}`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Left: Request Summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Request Summary</h3>
          {request && (
            <dl className="space-y-3 text-sm">
              {([
                ["Request #", request.request_number],
                ["Worker Name", request.requester_name ?? request.requested_by_name],
                ["Worker Emp. ID", request.requester_employee_id ?? "—"],
                ["Designation", request.requester_designation ?? "—"],
                ["Phone", request.requester_phone ?? "—"],
                ["Email", request.requester_email ?? "—"],
                ["Department", request.department_name ?? "—"],
                ["Submitted By", request.requested_by_name],
                ["Asset Type", request.asset_type],
                ["Quantity", String(request.quantity)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <dt className="text-gray-500 mb-1">Justification</dt>
                <dd className="text-gray-700 italic">"{request.justification}"</dd>
              </div>
              {request.im_notes && (
                <div className="pt-2 border-t border-gray-100">
                  <dt className="text-gray-500 mb-1">IM Notes</dt>
                  <dd className="text-gray-700">{request.im_notes}</dd>
                </div>
              )}
              {request.tentative_asset_code && (
                <div className="pt-2 border-t border-gray-100 bg-blue-50 rounded p-2">
                  <dt className="text-xs text-blue-600 mb-0.5">Tentative Asset (IM)</dt>
                  <dd className="text-sm font-medium text-blue-900">{request.tentative_asset_code}</dd>
                </div>
              )}
            </dl>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href={`/requests/${approval.request_id}`} className="text-sm text-blue-600 hover:text-blue-700">View full request →</Link>
          </div>
        </div>

        {/* Right: Action panel depends on step */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

          {/* ── IM Initial Review ──────────────────────────────── */}
          {step === "IM Initial Review" && (
            <>
              <h3 className="font-semibold text-gray-900 mb-1">IM Initial Check</h3>
              <p className="text-xs text-gray-500 mb-4">Review stock availability, optionally link a tentative asset, then forward to JIO.</p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Tentative Asset (optional)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  <label className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${tentativeAssetId === null ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                    <input type="radio" name="tentative" checked={tentativeAssetId === null} onChange={() => setTentativeAssetId(null)} />
                    <span className="text-sm text-gray-500 italic">None — check later</span>
                  </label>
                  {availableAssets.map((asset: any) => (
                    <label key={asset.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${tentativeAssetId === asset.id ? "border-blue-400 bg-blue-50" : "border-transparent hover:border-blue-200"}`}>
                      <input type="radio" name="tentative" checked={tentativeAssetId === asset.id} onChange={() => setTentativeAssetId(asset.id)} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{asset.asset_id}</p>
                        <p className="text-xs text-gray-500">{asset.asset_type}{asset.serial_number ? ` · S/N: ${asset.serial_number}` : ""}</p>
                      </div>
                    </label>
                  ))}
                  {availableAssets.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No available assets</p>}
                </div>
              </div>

              <Textarea
                label="Notes for JIO (optional)"
                value={imNotes}
                onChange={(e) => setImNotes(e.target.value)}
                placeholder="Stock observations, remarks..."
                rows={3}
              />

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setImDecision("Approved")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${imDecision === "Approved" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                >
                  <CheckCircle className={`h-7 w-7 ${imDecision === "Approved" ? "text-green-600" : "text-gray-300"}`} />
                  <span className={`text-sm font-medium ${imDecision === "Approved" ? "text-green-700" : "text-gray-500"}`}>Forward to JIO</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImDecision("Rejected")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${imDecision === "Rejected" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"}`}
                >
                  <XCircle className={`h-7 w-7 ${imDecision === "Rejected" ? "text-red-600" : "text-gray-300"}`} />
                  <span className={`text-sm font-medium ${imDecision === "Rejected" ? "text-red-700" : "text-gray-500"}`}>Reject</span>
                </button>
              </div>

              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={handleIMInitialReview} isPending={isPending}
                  className={imDecision === "Rejected" ? "bg-red-600 hover:bg-red-700" : ""}>
                  {imDecision === "Rejected" ? "Reject Request" : "Forward to JIO"}
                </Button>
                <Link href="/approvals"><Button type="button" variant="outline">Cancel</Button></Link>
              </div>
            </>
          )}

          {/* ── JIO / SIO Approval ────────────────────────────── */}
          {(step === "JIO Approval" || step === "SIO Approval") && (
            <>
              <h3 className="font-semibold text-gray-900 mb-4">Your Decision</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision("Approved")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${decision === "Approved" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                  >
                    <CheckCircle className={`h-8 w-8 ${decision === "Approved" ? "text-green-600" : "text-gray-300"}`} />
                    <span className={`text-sm font-medium ${decision === "Approved" ? "text-green-700" : "text-gray-500"}`}>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("Rejected")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${decision === "Rejected" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"}`}
                  >
                    <XCircle className={`h-8 w-8 ${decision === "Rejected" ? "text-red-600" : "text-gray-300"}`} />
                    <span className={`text-sm font-medium ${decision === "Rejected" ? "text-red-700" : "text-gray-500"}`}>Reject</span>
                  </button>
                </div>
                <Textarea
                  label="Comments (required)"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide your reasoning..."
                  rows={4}
                  required
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <Button onClick={handleJioSioApproval} isPending={isPending}
                    className={decision === "Rejected" ? "bg-red-600 hover:bg-red-700" : ""}>
                    {decision === "Rejected" ? "Reject Request" : "Approve Request"}
                  </Button>
                  <Link href="/approvals"><Button type="button" variant="outline">Cancel</Button></Link>
                </div>
              </div>
            </>
          )}

          {/* ── IM Final Processing ───────────────────────────── */}
          {step === "IM Final Processing" && (
            <>
              <h3 className="font-semibold text-gray-900 mb-1">Assign & Issue Asset</h3>
              <p className="text-xs text-gray-500 mb-4">Select the exact asset, fill in issuance details, then issue.</p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Asset to Assign <span className="text-red-500">*</span></label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {availableAssets.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No available assets</p>
                  ) : availableAssets.map((asset: any) => (
                    <label key={asset.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${finalAssetId === asset.id ? "border-blue-400 bg-blue-50" : "border-transparent hover:border-blue-200"}`}>
                      <input type="radio" name="finalAsset" checked={finalAssetId === asset.id} onChange={() => setFinalAssetId(asset.id)} />
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{asset.asset_id}</p>
                          <p className="text-xs text-gray-500">{asset.asset_type}{asset.serial_number ? ` · S/N: ${asset.serial_number}` : ""}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {request?.request_type === "External Issuance" ? (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs font-semibold text-purple-700 mb-1">External Issuance</p>
                    <p className="text-sm font-medium text-purple-900">
                      {request.issue_to_type}: {request.issue_to_org_name}
                    </p>
                    {request.requester_name && (
                      <p className="text-xs text-purple-600 mt-0.5">Contact: {request.requester_name}{request.requester_phone ? ` · ${request.requester_phone}` : ""}</p>
                    )}
                  </div>
                ) : (
                  <Input
                    label="Assigned To (name)"
                    value={assignedToName}
                    onChange={(e) => setAssignedToName(e.target.value)}
                    placeholder="Full name of recipient"
                    required
                  />
                )}

                <Input
                  label="Condition on Issue"
                  value={conditionOnIssue}
                  onChange={(e) => setConditionOnIssue(e.target.value)}
                  placeholder="e.g. New, Refurbished, Good"
                />
                <Input
                  label="End of Life Date"
                  type="date"
                  value={endOfLifeDate}
                  onChange={(e) => setEndOfLifeDate(e.target.value)}
                  required
                />
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Recipient has acknowledged receipt of the asset</span>
                </label>
              </div>

              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={handleIssueAsset} isPending={isPending}>Issue Asset</Button>
                <Link href="/approvals"><Button type="button" variant="outline">Cancel</Button></Link>
              </div>
            </>
          )}

          {/* ── IM Service Processing (Return / Repair) ────────── */}
          {step === "IM Service Processing" && (
            <>
              <h3 className="font-semibold text-gray-900 mb-1">
                {request?.request_type === "Return" ? "Process Return" : "Process Repair Request"}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {request?.request_type === "Return"
                  ? "Approve to mark asset as Available and return to inventory."
                  : "Approve to mark asset as Under Maintenance."}
              </p>

              {request?.service_reason && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Reason / Issue</p>
                  <p className="text-sm text-gray-700">{request.service_reason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setServiceDecision("Approved")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${serviceDecision === "Approved" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                >
                  <CheckCircle className={`h-7 w-7 ${serviceDecision === "Approved" ? "text-green-600" : "text-gray-300"}`} />
                  <span className={`text-sm font-medium ${serviceDecision === "Approved" ? "text-green-700" : "text-gray-500"}`}>
                    {request?.request_type === "Return" ? "Confirm Return" : "Send for Repair"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceDecision("Rejected")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${serviceDecision === "Rejected" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"}`}
                >
                  <XCircle className={`h-7 w-7 ${serviceDecision === "Rejected" ? "text-red-600" : "text-gray-300"}`} />
                  <span className={`text-sm font-medium ${serviceDecision === "Rejected" ? "text-red-700" : "text-gray-500"}`}>Reject</span>
                </button>
              </div>

              <Textarea
                label="Comments (optional)"
                value={serviceComments}
                onChange={(e) => setServiceComments(e.target.value)}
                placeholder="Any notes..."
                rows={3}
              />

              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={handleServiceRequest} isPending={isPending}
                  className={serviceDecision === "Rejected" ? "bg-red-600 hover:bg-red-700" : ""}>
                  {serviceDecision === "Rejected" ? "Reject" : "Confirm"}
                </Button>
                <Link href="/approvals"><Button type="button" variant="outline">Cancel</Button></Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
