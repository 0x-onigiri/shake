import { execSync } from 'node:child_process';
import type { ExecSyncOptionsWithStringEncoding } from 'node:child_process';
import path from 'node:path';

const scriptsDir = path.resolve(process.cwd(), 'scripts');

function runScript(scriptName: string, scriptPath: string): boolean {
  console.log(`\nRunning ${scriptName} (${scriptPath})...`);
  try {
    const options: ExecSyncOptionsWithStringEncoding = {
      cwd: process.cwd(), // スクリプトはプロジェクトルートから実行される想定
      stdio: 'inherit', // 親プロセスの標準入出力を共有
      encoding: 'utf-8',
    };
    execSync(`bun run ${scriptPath}`, options);
    console.log(`${scriptName} finished successfully.`);
    return true;
  } catch (error) {
    console.error(`Failed to execute ${scriptName}.`);
    // execSync はエラー時に stdout/stderr を含むエラーオブジェクトを投げるが、
    // stdio: 'inherit' のため、エラー出力は既にコンソールに表示されているはず。
    // error オブジェクト自体に追加情報があれば表示する。
    if (error instanceof Error) {
        console.error("Error message:", error.message);
    } else {
        console.error("Unknown error:", error);
    }
    return false;
  }
}

async function main() {
  console.log('Starting full setup process...');

  const deployScriptPath = path.join(scriptsDir, 'deploy.ts');
  if (!runScript('Deployment Script', deployScriptPath)) {
    console.error('\nDeployment failed. Aborting setup.');
    process.exit(1);
  }

  // デプロイが成功したら、テストデータ作成スクリプトを実行
  // 必要に応じて、デプロイとテストデータ作成の間に遅延を入れることも検討
  // await new Promise(resolve => setTimeout(resolve, 2000)); // 例: 2秒待機

  const seedScriptPath = path.join(scriptsDir, 'seed.ts');
  if (!runScript('Create Test Data Script', seedScriptPath)) {
    console.error('\nCreating test data failed.');
    process.exit(1);
  }

  console.log('\nFull setup process finished successfully!');
}

main().catch(error => {
  console.error('An unexpected error occurred during the setup process:', error);
  process.exit(1);
});
