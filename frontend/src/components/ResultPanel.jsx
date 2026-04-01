function ResultPanel({ result }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-slate-400">
        Upload or capture a frame to get navigation guidance.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Action" value={result.action} />
        <Stat label="Confidence" value={`${Math.round(result.confidence * 100)}%`} />
        <Stat label="Danger" value={result.danger ? "Yes" : "No"} danger={result.danger} />
        <Stat label="Detections" value={`${result.detections?.length ?? 0}`} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Reason</p>
        <p className="mt-1 text-slate-100">{result.reason}</p>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Objects</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-1 pr-4">Label</th>
                <th className="py-1 pr-4">Zone</th>
                <th className="py-1 pr-4">Confidence</th>
                <th className="py-1 pr-4">BBox</th>
              </tr>
            </thead>
            <tbody>
              {(result.detections ?? []).map((det, idx) => (
                <tr key={`${det.label}-${idx}`} className="border-t border-slate-800">
                  <td className="py-2 pr-4">{det.label}</td>
                  <td className="py-2 pr-4">{det.zone}</td>
                  <td className="py-2 pr-4">{Math.round(det.confidence * 100)}%</td>
                  <td className="py-2 pr-4 text-slate-400">{det.bbox.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, danger = false }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-medium ${danger ? "text-red-400" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}

export default ResultPanel;
