import { FirestoreService } from '../backend/src/services/firestoreService';
import { isFirebaseLive, initMessage } from '../backend/src/config/firebaseAdmin';

async function main() {
  console.log('--- S.A.G.E. Firestore Seeding Tool ---');
  console.log(`Connection Status: ${initMessage}`);
  console.log('Resetting and populating complaints dataset...');
  await FirestoreService.resetToDefaultSeed();
  console.log('✓ Seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
