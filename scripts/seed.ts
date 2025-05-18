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
  isAuthor?: boolean;
  imageBlobId?: string;
}

// NOTE: このシードフレーズ（パスフレーズ）は開発用のものです
// 本番環境では使用しないでください。
const testUsers: UserData[] = [
  {
    username: "Author",
    walletAddress: "0x73a5724d45715b7784c1516f27db32b0c50764ddf080da4aaec197c1333f9fb5",
    privateKey: "suiprivkey1qp8xyrpzxstcy6tj7nrnk4r5rqwlvew6nmafdtsl3uaat4ejhrp8km9w870",
    description: "I'm an Author",
    isAuthor: true,
  },
  {
    username: "Satoshi",
    walletAddress: "0x2eb8db5ebbb1104ab807852850be8dbdb10a34ff8b2f4be87f5424117a4c2c72",
    privateKey: "suiprivkey1qzmgwwh6hafeqfz7smw5dqre5yg4m85z8ncl7qm8nw9pjcptn4azzpn4azs",
    description: "I'm an SHAKE User",
    imageBlobId: "da4KYwCj8AHFiGLPCcE0-gd9RGlX5HCzis2NjU-W-EQ",
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
    userData.imageBlobId || "jAskg8tUnkE86l-RHkxvFzsbqOPvjjMs4uffjX4nNIc",
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

async function createFreePost(userObjectId: string, authorPrivateKey: string, title: string, thumbnailId: string) {
  const keypair = Ed25519Keypair.fromSecretKey(
    decodeSuiPrivateKey(authorPrivateKey).secretKey
  );

  const tx = new Transaction();

  BlogModule.createPost(
    tx,
    SHAKE_ONIGIRI.testnet.packageId,
    userObjectId,
    thumbnailId,
    // "[FREE] What is the Sui Network? ", // + new Date().toLocaleTimeString(),
    title,
    "dVHsT4INnQ_FTZL9rWtqltGeriMcctyEntqKnlAr-6Y", // contentId
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
    "_0EtyYcQIB5tdDKtMv4qeZdw-lXIFQS9NsvpVAAkLhI", // thumbnailId
    "[PAID] What is the Sui Network? ", // + new Date().toLocaleTimeString(),
    "Z6h_hwFx7yPDn7O8D0ck2MiUULU4M5xMHDagwoWVFYg", // contentId
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
      if (user.isAuthor) {
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

  console.log('\n無料記事の作成を開始します...');
  await createFreePost(loginUserObjectId, loginUserPrivateKey, "[FREE] What is the Sui Network?", "dVHsT4INnQ_FTZL9rWtqltGeriMcctyEntqKnlAr-6Y");
  await sleep(2000);
  await createFreePost(loginUserObjectId, loginUserPrivateKey, "Everything about Walrus", "4d2Tk3GLdHuoiphipXSbn7MNUUyrC7I9uS2qR8P689Q");
  await sleep(2000);
  await createFreePost(loginUserObjectId, loginUserPrivateKey, "Why is Sui so fast?", "BXrDxPK_GDYHy20AVKA9Y7-eht29jU_Nqw4DA3UahFQ");
  await sleep(2000);
  await createFreePost(loginUserObjectId, loginUserPrivateKey, "Mysten Labs and Sui Foundation", "dVHsT4INnQ_FTZL9rWtqltGeriMcctyEntqKnlAr-6Y");
  console.log('無料記事の作成処理が完了しました。');

  await sleep(2000);

  // console.log('\n有料記事の作成を開始します...');
  // await createPaidPost(loginUserObjectId, loginUserPrivateKey);
  // console.log('有料記事の作成処理が完了しました。');
}

main().catch((error) => {
  console.error('スクリプト全体の実行中にエラーが発生しました:', error);
});
