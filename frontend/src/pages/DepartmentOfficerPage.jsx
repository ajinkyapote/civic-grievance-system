import { useLang } from "../context/LanguageContext";
import { useState, useEffect } from "react";
import { Briefcase, UserPlus, Eye } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import TicketTimelineModal from "../components/TicketTimelineModal";

export default function DepartmentOfficerPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState({});
  const [timelineIssue, setTimelineIssue] = useState(null);

  const loadData = async () => {
    const [issRes, engRes] = await Promise.all([
      axiosClient.get("/ops/department/issues"),
      axiosClient.get("/ops/department/engineers"),
    ]);
    setIssues(issRes.data);
    setEngineers(engRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (issueId) => {
    const engineerId = selectedEngineer[issueId];
    if (!engineerId) {
      alert("Select a Field Engineer first");
      return;
    }
    await axiosClient.patch(`/ops/department/issues/${issueId}/assign`, {
      engineerId: Number(engineerId),
      remarks: `Dispatched by ${user.name}`,
    });
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-600" /> {user?.department} {t.deptDeskTitle}
        </h1>
        <p className="text-sm text-slate-600">
          Scoped exclusively to <strong>{user?.department}</strong> tickets, sorted by community severity score. Assign tickets to field engineers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600">
              <th className="py-3 px-4">Ticket</th>
              <th className="py-3 px-4">Issue Summary</th>
              <th className="py-3 px-4">Duplicates</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assign Field Engineer</th>
              <th className="py-3 px-4">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {issues.map((issue) => (
              <tr key={issue.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-blue-700">{issue.ticketCode}</td>
                <td className="py-3 px-4 max-w-md">
                  <div className="font-bold text-slate-900">{issue.title}</div>
                  <div className="text-xs text-slate-500">{issue.description}</div>
                </td>
                <td className="py-3 px-4 font-bold text-amber-700">{issue.duplicateCount}</td>
                <td className="py-3 px-4 font-bold text-red-700">{issue.severityScore}</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100">{issue.status}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedEngineer[issue.id] || issue.assignedTo?.id || ""}
                      onChange={(e) => setSelectedEngineer({ ...selectedEngineer, [issue.id]: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white"
                    >
                      <option value="">-- Select Crew --</option>
                      {engineers.map((eng) => (
                        <option key={eng.id} value={eng.id}>{eng.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(issue.id)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Assign
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => setTimelineIssue(issue)} className="text-slate-600 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TicketTimelineModal issue={timelineIssue} onClose={() => setTimelineIssue(null)} />
    </div>
  );
}
