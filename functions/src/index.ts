import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";
initializeApp();
const db=getFirestore();

export const pinLogin=onCall({region:"us-east1"},async(request)=>{
  const studentId=String(request.data?.studentId||"").toUpperCase();
  const pin=String(request.data?.pin||"");
  const role=request.data?.role === "parent" ? "parent" : "student";
  if(!/^FFA-\d{4}-\d{3}$/.test(studentId)||!/^\d{4}$/.test(pin)) throw new HttpsError("invalid-argument","Invalid credentials.");
  const snap=await db.collection("students").doc(studentId).get();
  if(!snap.exists) throw new HttpsError("unauthenticated","Invalid credentials.");
  const data=snap.data()!;
  if(!(await bcrypt.compare(pin,data.pinHash))) throw new HttpsError("unauthenticated","Invalid credentials.");
  const uid=`${role}-${studentId}`;
  await getAuth().setCustomUserClaims(uid,{role,studentId});
  return {token:await getAuth().createCustomToken(uid,{role,studentId})};
});

export const weeklyPayroll=onSchedule({schedule:"0 16 * * 5",timeZone:"America/New_York",region:"us-east1"},async()=>{
  const students=await db.collection("students").where("active","==",true).get();
  const batch=db.batch();
  students.docs.forEach(doc=>{const d=doc.data(); const amount=Number(d.weeklyPay||0); if(amount<=0)return; batch.update(doc.ref,{balance:FieldValue.increment(amount)}); const tx=db.collection("transactions").doc(); batch.set(tx,{studentId:doc.id,type:"payroll",amount,description:"Weekly paycheck",createdAt:FieldValue.serverTimestamp()});});
  await batch.commit();
});

export const weeklyRent=onSchedule({schedule:"0 8 * * 1",timeZone:"America/New_York",region:"us-east1"},async()=>{
  const students=await db.collection("students").where("active","==",true).get();
  const batch=db.batch();
  students.docs.forEach(doc=>{batch.update(doc.ref,{balance:FieldValue.increment(-20)}); const tx=db.collection("transactions").doc(); batch.set(tx,{studentId:doc.id,type:"rent",amount:-20,description:"Weekly classroom rent",createdAt:FieldValue.serverTimestamp()});});
  await batch.commit();
});
