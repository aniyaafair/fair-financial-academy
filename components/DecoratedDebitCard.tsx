"use client";

import { QRCodeSVG } from "qrcode.react";
import type { AcademyMember } from "@/lib/academyStore";

export function DecoratedDebitCard({ member }: { member: AcademyMember }) {
  return (
    <div className={`debit decorated-card theme-${member.cardTheme} pattern-${member.cardPattern}`}>
      <div className="card-pattern" aria-hidden="true" />
      <div className="debit-top">
        <div>
          <strong>FAIR FUTURE BANK</strong>
          <div className="debit-subtitle">Fair Financial Academy</div>
        </div>
        <QRCodeSVG
          value={`${typeof window !== "undefined" ? window.location.origin : "https://example.com"}/login?student=${member.id}`}
          size={62}
          bgColor="transparent"
          fgColor="#ffffff"
        />
      </div>
      <div className="card-icon" aria-label="selected card decoration">{member.cardIcon}</div>
      <div className="number">{member.id}</div>
      <div className="debit-bottom">
        <div>
          <div className="debit-label">CARDHOLDER</div>
          <strong>{member.name}</strong>
          <div className="debit-label debit-career-label">CAREER</div>
          <span>{member.career}</span>
        </div>
        <div className="debit-balance">
          <div className="debit-label">BALANCE</div>
          <strong>${member.balance.toFixed(2)}</strong>
        </div>
      </div>
      <div className="card-motto">{member.cardMotto}</div>
    </div>
  );
}
