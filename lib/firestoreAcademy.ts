import { signInAnonymously } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AcademyCareer, AcademyMember } from "@/lib/academyStore";
import { DEFAULT_CAREERS } from "@/lib/academyStore";

const MEMBERS_COLLECTION = "academyMembers";
const CAREERS_COLLECTION = "academyCareers";

export async function ensureFirebaseSession() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function watchAcademyMembers(
  onMembers: (members: AcademyMember[]) => void,
  onError?: (message: string) => void,
) {
  return onSnapshot(
    collection(db, MEMBERS_COLLECTION),
    (snapshot) => {
      const members = snapshot.docs
        .map((item) => item.data() as AcademyMember)
        .sort((a, b) => a.id.localeCompare(b.id));
      onMembers(members);
    },
    (error) => onError?.(error.message),
  );
}

export async function saveAcademyMember(member: AcademyMember) {
  await setDoc(doc(db, MEMBERS_COLLECTION, member.id), member, { merge: true });
}

export async function removeAcademyMember(id: string) {
  await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
}

export async function saveManyAcademyMembers(members: AcademyMember[]) {
  const batch = writeBatch(db);
  members.forEach((member) => {
    batch.set(doc(db, MEMBERS_COLLECTION, member.id), member, { merge: true });
  });
  await batch.commit();
}

export async function ensureDefaultCareers() {
  const snapshot = await getDocs(collection(db, CAREERS_COLLECTION));
  if (!snapshot.empty) return;
  const batch = writeBatch(db);
  DEFAULT_CAREERS.forEach((career) => {
    batch.set(doc(db, CAREERS_COLLECTION, career.id), career);
  });
  await batch.commit();
}

export function watchAcademyCareers(
  onCareers: (careers: AcademyCareer[]) => void,
  onError?: (message: string) => void,
) {
  return onSnapshot(
    collection(db, CAREERS_COLLECTION),
    (snapshot) => {
      const careers = snapshot.docs
        .map((item) => item.data() as AcademyCareer)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      onCareers(careers);
    },
    (error) => onError?.(error.message),
  );
}

export async function saveAcademyCareer(career: AcademyCareer) {
  await setDoc(doc(db, CAREERS_COLLECTION, career.id), career, { merge: true });
}

export async function removeAcademyCareer(id: string) {
  await deleteDoc(doc(db, CAREERS_COLLECTION, id));
}
