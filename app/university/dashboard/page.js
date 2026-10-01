'use client';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

function scoreClass(v) {
  return v >= 75 ? 'text-indigo' : v >= 50 ? 'text-amber' : 'text-coral';
}

export default function UniversityDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/university/analytics').then((r) => r.json()).then(setData);
  }, []);

  function downloadPdf() {
    const doc = new jsPDF();
    const left = 20;
    let y = 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(data.universityName, left, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Semester-end placement report — generated ${new Date().toLocaleDateString()}`, left, y);
    doc.setTextColor(20);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Summary', left, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(`Enrolled students: ${data.totals.enrolledStudents}`, left, y); y += 6;
    doc.text(`Applications: ${data.totals.totalApplications}`, left, y); y += 6;
    doc.text(`Placements: ${data.totals.totalPlacements}`, left, y); y += 6;
    doc.text(`Placement rate: ${data.totals.placementRate}%`, left, y); y += 12;

    if (data.topSkillGaps.length) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Top skill gaps', left, y); y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      for (const s of data.topSkillGaps) { doc.text(`${s.skill} — ${s.count}`, left, y); y += 6; }
      y += 6;
    }

    if (data.topCompanies.length) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Top recruiting companies', left, y); y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      for (const c of data.topCompanies) { doc.text(`${c.name} — ${c.count} placed`, left, y); y += 6; }
      y += 6;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Students', left, y); y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const s of data.studentDetail) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`${s.name} — ${s.degree}, Year ${s.yearOfStudy} — Readiness ${s.readinessScore} — ${s.applicationCount} application(s) — ${s.placed ? 'Placed' : 'Not placed'}`, left, y);
      y += 6;
    }

    doc.save(`${data.universityName.replace(/\s+/g, '_')}_placement_report.pdf`);
  }

  if (!data) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-eyebrow mb-1">FR-UNI · Placement analytics</div>
          <h1 className="font-display text-3xl font-semibold">{data.universityName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadPdf} className="btn-secondary text-sm py-2 px-4">
            Download report (PDF)
          </button>
          <a href="/api/university/report" className="btn-secondary text-sm py-2 px-4">
            Download report (CSV)
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-5">
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Enrolled students</div>
          <div className="font-display text-3xl font-semibold">{data.totals.enrolledStudents}</div>
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Applications</div>
          <div className="font-display text-3xl font-semibold">{data.totals.totalApplications}</div>
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Placements</div>
          <div className="font-display text-3xl font-semibold">{data.totals.totalPlacements}</div>
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Placement rate</div>
          <div className="font-display text-3xl font-semibold">{data.totals.placementRate}%</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Top skill gaps</h2>
          {data.topSkillGaps.length === 0 ? (
            <div className="card p-6 text-center text-ink/50 text-sm">No gap data yet.</div>
          ) : (
            <div className="card p-6 space-y-3">
              {data.topSkillGaps.map((s) => (
                <div key={s.skill} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium shrink-0">{s.skill}</div>
                  <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-coral rounded-full" style={{ width: `${(s.count / data.topSkillGaps[0].count) * 100}%` }} />
                  </div>
                  <div className="text-xs font-mono text-ink/40 w-6 text-right">{s.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Top recruiting companies</h2>
          {data.topCompanies.length === 0 ? (
            <div className="card p-6 text-center text-ink/50 text-sm">No placements yet.</div>
          ) : (
            <div className="card divide-y divide-line">
              {data.topCompanies.map((c) => (
                <div key={c.name} className="p-4 flex items-center justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-ink/50">{c.count} placed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Students</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="p-4 label-eyebrow">Name</th>
                <th className="p-4 label-eyebrow">Degree</th>
                <th className="p-4 label-eyebrow">Year</th>
                <th className="p-4 label-eyebrow">Readiness</th>
                <th className="p-4 label-eyebrow">Applications</th>
                <th className="p-4 label-eyebrow">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.studentDetail.map((s, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="p-4 font-medium">{s.name}</td>
                  <td className="p-4 text-ink/60">{s.degree}</td>
                  <td className="p-4 text-ink/60">{s.yearOfStudy}</td>
                  <td className={`p-4 font-mono font-medium ${scoreClass(s.readinessScore)}`}>{s.readinessScore}</td>
                  <td className="p-4 font-mono text-ink/60">{s.applicationCount}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${s.placed ? 'bg-signal/20 text-ink' : 'bg-line text-ink/50'}`}>
                      {s.placed ? 'Placed' : 'Not placed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
