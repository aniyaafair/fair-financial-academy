export type CardTheme = "academy" | "ocean" | "sunset" | "purple" | "midnight";
export type CardPattern = "waves" | "stars" | "dots" | "confetti" | "none";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: "Deposit" | "Withdrawal" | "Payroll" | "Rent" | "Marketplace" | "Reward";
  amount: number;
};

export type AcademyMember = {
  id: string;
  name: string;
  pin: string;
  career: string;
  weeklyPay: number;
  balance: number;
  memberSince: string;
  cardTheme: CardTheme;
  cardPattern: CardPattern;
  cardIcon: string;
  cardMotto: string;
  transactions: Transaction[];
};

export type AcademyCareer = {
  id: string;
  name: string;
  pay: number;
  positions: number;
  active: boolean;
  sortOrder: number;
};

export const DEFAULT_CAREERS: AcademyCareer[] = [
  { id: "supervisor", name: "Supervisor", pay: 40, positions: 1, active: true, sortOrder: 1 },
  { id: "banker", name: "Banker", pay: 35, positions: 1, active: true, sortOrder: 2 },
  { id: "market-clerk", name: "Market Clerk", pay: 35, positions: 1, active: true, sortOrder: 3 },
  { id: "patrol-officer", name: "Patrol Officer", pay: 30, positions: 2, active: true, sortOrder: 4 },
  { id: "group-leader", name: "Group Leader", pay: 30, positions: 6, active: true, sortOrder: 5 },
  { id: "assignment-manager", name: "Assignment Manager", pay: 30, positions: 2, active: true, sortOrder: 6 },
  { id: "supply-manager", name: "Supply Manager", pay: 30, positions: 1, active: true, sortOrder: 7 },
  { id: "librarian", name: "Librarian", pay: 26, positions: 1, active: true, sortOrder: 8 },
  { id: "plant-care-specialist", name: "Plant Care Specialist", pay: 26, positions: 1, active: true, sortOrder: 9 },
  { id: "classroom-groundskeeper", name: "Classroom Groundskeeper", pay: 26, positions: 2, active: true, sortOrder: 10 },
  { id: "lunchroom-groundskeeper", name: "Lunchroom Groundskeeper", pay: 26, positions: 2, active: true, sortOrder: 11 },
  { id: "board-manager", name: "Board Manager", pay: 26, positions: 1, active: true, sortOrder: 12 },
];

export const STORAGE_KEY = "ffaAcademyMembersV1";

export function makeId(index: number) {
  return `FFA-2026-${String(index).padStart(3, "0")}`;
}

export function makePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function slugifyCareer(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `career-${Date.now()}`;
}
