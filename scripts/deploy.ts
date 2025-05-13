import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface SuiObjectChange {
  type: 'published' | 'created' | 'mutated' | string;
  packageId?: string;
  objectId?: string;
  objectType?: string;
}

interface SuiPublishOutput {
  objectChanges?: SuiObjectChange[];
}

console.log('Starting deployment script (JSON mode)...');

const suiPackagesDir = path.resolve(process.cwd(), 'packages', 'sui', 'shake');
const contractConstantsPath = path.resolve(
  process.cwd(),
  'packages',
  'frontend',
  'src',
  'constants',
  'contract.ts'
);

let rawOutput: string;
try {
  console.log(`Running 'sui client publish --silence-warnings --json' in ${suiPackagesDir}...`);
  rawOutput = execSync('sui client publish --silence-warnings --json', {
    cwd: suiPackagesDir,
    encoding: 'utf-8',
  });
  console.log('Sui publish command executed successfully.');
} catch (error) {
  console.error('Failed to execute sui client publish command:');
  if (error instanceof Error) {
    console.error(error.message);
    const err = error as any;
    if (err.stdout) {
      console.error('Stdout:', err.stdout.toString());
    }
    if (err.stderr) {
      console.error('Stderr:', err.stderr.toString());
    }
  } else {
    console.error(error);
  }
  process.exit(1);
}

let parsedOutput: SuiPublishOutput;
try {
  parsedOutput = JSON.parse(rawOutput) as SuiPublishOutput;
} catch (error) {
  console.error('Failed to parse JSON output from sui client publish:');
  console.error(error);
  console.error('Raw output was:\n', rawOutput);
  process.exit(1);
}

if (!parsedOutput.objectChanges || !Array.isArray(parsedOutput.objectChanges)) {
  console.error('Invalid JSON structure: "objectChanges" array not found or not an array.');
  console.error('Parsed output:\n', JSON.stringify(parsedOutput, null, 2));
  process.exit(1);
}

const objectChanges = parsedOutput.objectChanges;

const publishedChange = objectChanges.find(change => change.type === 'published');
const packageId = publishedChange?.packageId;

const userListChange = objectChanges.find(
  change => change.type === 'created' && change.objectType?.endsWith('::user::UserList')
);
const userListObjectId = userListChange?.objectId;

const postPaymentChange = objectChanges.find(
  change => change.type === 'created' && change.objectType?.endsWith('::blog::PostPayment')
);
const postPaymentObjectId = postPaymentChange?.objectId;


if (!packageId) {
  console.error('Failed to extract PackageID from JSON output.');
  console.error('Parsed objectChanges:\n', JSON.stringify(objectChanges, null, 2));
  process.exit(1);
}

if (!userListObjectId) {
  console.warn('Warning: Failed to extract UserList ObjectID from JSON output. It will be set to null in the constants file.');
}
if (!postPaymentObjectId) {
  console.warn('Warning: Failed to extract PostPayment ObjectID from JSON output. It will be set to null in the constants file.');
}

console.log(`Extracted PackageID: ${packageId}`);
console.log(`Extracted UserList ObjectID: ${userListObjectId || 'Not found'}`);
console.log(`Extracted PostPayment ObjectID: ${postPaymentObjectId || 'Not found'}`);

const contractConstInfo = `export const SHAKE_ONIGIRI = {
  testnet: {
    packageId: '${packageId}',
    userListObjectId: ${userListObjectId ? `'${userListObjectId}'` : null},
    postPaymentObjectId: ${postPaymentObjectId ? `'${postPaymentObjectId}'` : null},
  },
} as const
`;

try {
  fs.writeFileSync(contractConstantsPath, contractConstInfo);
  console.log(`Successfully wrote to ${contractConstantsPath}`);
  console.log('Generated content:\n', contractConstInfo);
} catch (error) {
  console.error(`Failed to write to ${contractConstantsPath}:`, error);
  process.exit(1);
}

console.log('Deployment script finished successfully.');
