"use client";
import { QRCodeSVG } from "qrcode.react";
export function DebitCard({ name="Jordan Student", studentId="FFA-2026-001", career="Garden Supervisor", balance=120 }: {name?:string;studentId?:string;career?:string;balance?:number}) {
 return <div className="debit"><div style={{display:"flex",justifyContent:"space-between",gap:16}}><strong>FAIR FINANCIAL BANK</strong><QRCodeSVG value={`https://example.com/login?student=${studentId}`} size={62} bgColor="transparent" fgColor="#ffffff" /></div><div className="number">{studentId}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"end",position:"relative",zIndex:1}}><div><div style={{fontSize:12,opacity:.8}}>CARDHOLDER</div><strong>{name}</strong><div style={{fontSize:12,opacity:.8,marginTop:8}}>CAREER</div><span>{career}</span></div><div style={{textAlign:"right"}}><div style={{fontSize:12,opacity:.8}}>BALANCE</div><strong style={{fontSize:28}}>${balance.toFixed(2)}</strong></div></div></div>;
}
