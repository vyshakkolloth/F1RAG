import { createCollection } from '../lib/astradb';

async function init() {
  console.log('Initializing DataStax Astra DB...');
  await createCollection();
  console.log('Database initialized!');
}
init();