import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

import { SHAKE_ONIGIRI } from '../packages/frontend/src/constants';
import { UserModule } from '../packages/frontend/src/lib/sui/user-functions';
import { BlogModule } from '../packages/frontend/src/lib/sui/blog-functions';

interface UserData {
  username: string;
  walletAddress: string;
  privateKey: string;
  description: string;
  isLoginUser?: boolean;
}

// NOTE: このシードフレーズ（パスフレーズ）は開発用のものです
// 本番環境では使用しないでください。
const testUsers: UserData[] = [
  {
    username: "SHAKE User",
    walletAddress: "0x73a5724d45715b7784c1516f27db32b0c50764ddf080da4aaec197c1333f9fb5",
    privateKey: "suiprivkey1qp8xyrpzxstcy6tj7nrnk4r5rqwlvew6nmafdtsl3uaat4ejhrp8km9w870",
    description: "I'm an SHAKE user",
    isLoginUser: true,
  },
  {
    username: "Author",
    walletAddress: "0x2eb8db5ebbb1104ab807852850be8dbdb10a34ff8b2f4be87f5424117a4c2c72",
    privateKey: "suiprivkey1qzmgwwh6hafeqfz7smw5dqre5yg4m85z8ncl7qm8nw9pjcptn4azzpn4azs",
    description: "I'm an author",
  },
  {
    username: "Reviewer",
    walletAddress: "0xa591b7883ddc30ffd2d1c1cfbfccca87ae5d7b3404f9878395fd423fd26813f4",
    privateKey: "suiprivkey1qrsad00fx0xmegyktvp060yu66smlcu552yd3pl8ke7x3vchnqf768jfd95",
    description: "I'm a reviewer",
  },
];

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

async function createTestUser(userData: UserData): Promise<string | null> {
  const keypair = Ed25519Keypair.fromSecretKey(
    decodeSuiPrivateKey(userData.privateKey).secretKey
  );

  const tx = new Transaction();

  UserModule.createUser(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    SHAKE_ONIGIRI.testnet.userListObjectId,
    userData.username,
    userData.walletAddress,
    userData.description
  );

  try {
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showObjectChanges: true,
      },
    });

    const objChange = result.objectChanges?.find(
      (change) =>
        change.type === 'created' &&
        change.objectType === `${SHAKE_ONIGIRI.testnet.packageId}::user::User`
    );
    const userObjectId =
      objChange && objChange.type === 'created' ? objChange.objectId : null;
    console.log(`ユーザー「${userData.username}」の userObjectId:`, userObjectId);
    return userObjectId;
  } catch (error) {
    console.error(`ユーザー「${userData.username}」の作成中にエラーが発生しました:`, error);
    return null;
  }
}

async function createFreePost(userObjectId: string, authorPrivateKey: string) {
  const keypair = Ed25519Keypair.fromSecretKey(
    decodeSuiPrivateKey(authorPrivateKey).secretKey
  );

  const tx = new Transaction();

  BlogModule.createPost(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    userObjectId,
    "usUbtHDoldLW0COHqui8IruZY5CHH0ThkCnuyjgdtyo", // contentId
    "無料記事のテストデータ " + new Date().toLocaleTimeString(),
    "c98lt2GwBlB1BF5bsETUPdCRCp6VfGN7l1OLN7eIc9I" // thumbnailId
  );

  try {
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    console.log('無料記事作成結果:', result);
  } catch (error) {
    console.error('無料記事の作成中にエラーが発生しました:', error);
  }
}

async function createPaidPost(userObjectId: string, authorPrivateKey: string) {
  const keypair = Ed25519Keypair.fromSecretKey(
    decodeSuiPrivateKey(authorPrivateKey).secretKey
  );

  const tx = new Transaction();

  BlogModule.createPost(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    userObjectId,
    "dDKdwhULnY32awHbgxAj6kOYGXThk6izSfqdHS3P3t8", // contentId
    "有料記事💰のテストデータ " + new Date().toLocaleTimeString(),
    "HXiLLKCkcV4e2_L9y83fndd_RMK13JHGXkLeUc-3fYY", // thumbnailId
    100000000 // price
  );

  try {
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    console.log('有料記事作成結果:', result);
  } catch (error) {
    console.error('有料記事の作成中にエラーが発生しました:', error);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let loginUserObjectId: string | null = null;
  let loginUserPrivateKey: string | null = null;
  const createdUserObjectIds: { [username: string]: string } = {};

  console.log('テストユーザーの作成を開始します...');
  for (const user of testUsers) {
    console.log(`ユーザー「${user.username}」の作成処理を開始します。`);
    const userObjectId = await createTestUser(user);
    if (userObjectId) {
      createdUserObjectIds[user.username] = userObjectId;
      console.log(`ユーザー「${user.username}」の作成に成功しました: ${userObjectId}`);
      if (user.isLoginUser) {
        loginUserObjectId = userObjectId;
        loginUserPrivateKey = user.privateKey;
      }
    } else {
      console.error(`ユーザー「${user.username}」の作成に失敗しました。`);
    }
    await sleep(1000);
  }
  console.log('すべてのテストユーザーの作成処理が完了しました。');

  if (!loginUserObjectId || !loginUserPrivateKey) {
    console.error('ログインユーザーの作成に失敗したか、秘密鍵が見つかりません。記事作成をスキップします。');
    return;
  }

  const generalTestUser = testUsers.find(u => !u.isLoginUser);
  if (generalTestUser) {
    const generalUserObjectId = createdUserObjectIds[generalTestUser.username];
    if (generalUserObjectId && generalTestUser.privateKey) {
      const authorPrivateKey = generalTestUser.privateKey;
      console.log('\n無料記事の作成を開始します...');
      await createFreePost(generalUserObjectId, authorPrivateKey);
      console.log('無料記事の作成処理が完了しました。');
      await sleep(2000);
    } else {
      console.error(`一般テストユーザー「${generalTestUser.username}」のObjectId、または秘密鍵が無効か見つかりません。無料記事作成をスキップします。`);
    }
  } else {
    console.error('一般テストユーザーが見つかりません。無料記事作成をスキップします。');
  }

  console.log('\n有料記事の作成を開始します...');

  if (loginUserObjectId && loginUserPrivateKey) {
    await createPaidPost(loginUserObjectId, loginUserPrivateKey);
    console.log('有料記事の作成処理が完了しました。');
  } else {
    console.error('ログインユーザーのObjectIdまたはPrivateKeyがnullのため、有料記事の作成をスキップします。');
  }
}

main().catch((error) => {
  console.error('スクリプト全体の実行中にエラーが発生しました:', error);
});
