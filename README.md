# Fair Financial Academy

Starter application for a classroom economy with teacher, student, and parent views.

## Important security note
A shared student/parent 4-digit PIN is convenient, but it does **not** create two distinct identities. Student and parent portal choice is therefore a display mode, not strong proof of who is signing in. Do not store sensitive educational records in this app. PINs must be stored only as bcrypt hashes and verified in a Cloud Function—never in Firestore as plain text.

## 1. Copy this starter into your repository

```bash
git clone https://github.com/aniyaafair/fair-financial-academy.git
cd fair-financial-academy
# Copy the contents of this starter folder into the repository.
npm install
```

## 2. Register a Firebase web app
In Firebase Console, open **Fair Financial Academy**, add a Web app, and copy the config values into `.env.local` using `.env.example`.

## 3. Enable products
- Authentication: enable Google for the teacher.
- Firestore: create a production-mode database.
- Functions: required for PIN verification and scheduled payroll/rent.

## 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000.

## 5. Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

## 6. Functions
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```
Scheduled functions generally require Firebase billing/Blaze because they use Cloud Scheduler. Until that is enabled, use teacher dashboard buttons for one-click payroll and rent.

## Current starter status
- Polished public homepage
- Teacher/student/parent dashboard previews
- Digital debit card preview and QR code
- Updated Academy Careers
- Firestore security-rule starter
- Secure server-side PIN-login function scaffold
- Scheduled Friday payroll and Monday $20 rent function scaffolds

## Next development milestone
1. Replace demo login with callable `pinLogin` and Firebase custom-token sign-in.
2. Add teacher Google authentication and teacher custom claims.
3. Add student CRUD and hashed PIN creation.
4. Implement atomic deposits, withdrawals, payroll, rent, and marketplace purchases.
5. Generate printable monthly statements.
