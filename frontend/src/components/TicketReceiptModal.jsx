import { X, Printer, ShieldCheck, QrCode } from "lucide-react";

export default function TicketReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const verifyUrl = `${window.location.origin}/?ticket=${receipt.ticketCode || receipt.masterIssueId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Official Municipal Grievance Receipt
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="space-y-1.5 text-xs">
            <div className="uppercase font-bold text-slate-400">Reference Docket</div>
            <div className="text-lg font-mono font-extrabold text-blue-700">
              {receipt.ticketCode || `CIV-2026-${String(receipt.masterIssueId).padStart(4, "0")}`}
            </div>
            <div>
              Status: <strong className="text-slate-900">{receipt.status}</strong>
            </div>
            <div>
              Cluster Weight: <strong>{receipt.totalDuplicates} Citizen Report(s)</strong>
            </div>
            <div>
              Priority Index: <strong>{receipt.updatedSeverityScore || receipt.severityScore}</strong>
            </div>
          </div>

          <div className="text-center shrink-0">
            <img src={qrImageUrl} alt="Ticket Verification QR" className="w-28 h-28 rounded-lg border border-slate-300 bg-white p-1" />
            <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-center gap-1">
              <QrCode className="w-3 h-3" /> Scan to Verify
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          This acknowledgment confirms your grievance is registered in the Municipal Geo-Spatial Command Database and routed to the concerned Ward Engineering Desk under statutory SLA monitoring.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF Slip
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
