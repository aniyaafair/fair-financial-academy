"use client";

import { QRCodeSVG } from "qrcode.react";

type DebitCardProps = {
  name?: string;
  studentId?: string;
  career?: string;
  balance?: number;
};

export function DebitCard({
  name = "Jordan Student",
  studentId = "FFA-2026-001",
  career = "Supervisor",
  balance = 120,
}: DebitCardProps) {
  return (
    <div className="debit">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        <strong>FAIR FINANCIAL BANK</strong>

        <QRCodeSVG
          value={`/login?student=${encodeURIComponent(studentId)}`}
          size={78}
          bgColor="transparent"
          fgColor="#ffffff"
        />
      </div>

      <div style={{ marginTop: "28px" }}>
        <p style={{ letterSpacing: "4px", fontSize: "1.2rem" }}>
          {studentId}
        </p>

        <small>CARDHOLDER</small>
        <h3 style={{ margin: "2px 0 14px" }}>{name}</h3>

        <small>CAREER</small>
        <p style={{ margin: "2px 0" }}>{career}</p>
      </div>

      <div style={{ textAlign: "right", marginTop: "16px" }}>
        <small>BALANCE</small>
        <h2 style={{ margin: "2px 0" }}>${balance.toFixed(2)}</h2>
      </div>
    </div>
  );
}