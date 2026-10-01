'use client';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

function downloadOfferPdf(o) {
  const doc = new jsPDF();
  const left = 20;
  let y = 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('NexSkill', left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text('Digital Offer Letter', left, y + 6);
  doc.setTextColor(20);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Offer ID: ${o.id}`, left, y);
  doc.text(`Sent: ${new Date(o.sentAt).toLocaleDateString()}`, 130, y);
  y += 14;

  doc.setFontSize(12.5);
  const intro = `${o.companyName} is pleased to offer you the position of "${o.postingTitle}" through the NexSkill platform.`;
  const introLines = doc.splitTextToSize(intro, 170);
  doc.text(introLines, left, y);
  y += introLines.length * 6.5 + 10;

  const rows = [
    ['Position', o.postingTitle],
    ['Company', o.companyName],
    ['Duration', o.duration || '—'],
    ['Stipend', o.stipendRange || 'Undisclosed'],
    ['Status', o.status],
  ];
  if (o.respondedAt) rows.push(['Responded', new Date(o.respondedAt).toLocaleDateString()]);
  doc.setFontSize(11);
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), left + 40, y);
    y += 8;
  }

  y += 10;
  doc.setFontSize(9.5);
  doc.setTextColor(130);
  doc.text('This is a system-generated offer letter issued and recorded by NexSkill.', left, y);

  doc.save(`${o.companyName.replace(/\s+/g, '_')}_${o.postingTitle.replace(/\s+/g, '_')}_Offer.pdf`);
}

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  function load() {
    fetch('/api/student/offers').then((r) => r.json()).then((d) => {
      setOffers(d.offers || []);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function respond(id, decision) {
    setActing(id);
    await fetch(`/api/student/offers/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    setActing(null);
    load();
  }

  if (loading) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="label-eyebrow mb-1">FR-OFR · Digital, auditable offer letters</div>
        <h1 className="font-display text-3xl font-semibold">Offer Letters</h1>
      </div>

      {offers.length === 0 ? (
        <div className="card p-8 text-center text-ink/50 text-sm">No offer letters yet.</div>
      ) : (
        <div className="space-y-5">
          {offers.map((o) => (
            <div key={o.id} className="card p-6 border-l-4 border-l-indigo">
              <div className="flex items-center justify-between">
                <div className="label-eyebrow">Digital Offer Letter</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => downloadOfferPdf(o)} className="text-xs text-indigo font-medium">Download PDF</button>
                  <span className="text-xs font-mono text-ink/40">{o.id}</span>
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold mt-2">{o.postingTitle}</h3>
              <p className="text-sm text-ink/60 mt-1">
                {o.companyName} is pleased to offer you this internship position.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-line text-sm">
                <div><div className="text-ink/40 text-xs">Duration</div>{o.duration}</div>
                <div><div className="text-ink/40 text-xs">Stipend</div>{o.stipendRange}</div>
                <div><div className="text-ink/40 text-xs">Sent</div>{new Date(o.sentAt).toLocaleDateString()}</div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                {o.status === 'Pending' ? (
                  <>
                    <button onClick={() => respond(o.id, 'Accepted')} disabled={acting === o.id} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
                      Accept offer
                    </button>
                    <button onClick={() => respond(o.id, 'Declined')} disabled={acting === o.id} className="btn-secondary text-sm py-2 px-4 disabled:opacity-50">
                      Decline
                    </button>
                  </>
                ) : (
                  <span className={`text-sm font-medium px-3 py-1.5 rounded ${o.status === 'Accepted' ? 'bg-signal/20 text-ink' : 'bg-coral/10 text-coral'}`}>
                    {o.status} on {o.respondedAt ? new Date(o.respondedAt).toLocaleDateString() : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
