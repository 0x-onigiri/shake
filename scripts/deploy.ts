#!/usr/bin/env bun
// Bunスクリプト版: packages/contracts/blog ディレクトリで sui client publish を実行し、出力から PackageID と UserList の ObjectID を抽出して環境変数ファイルに書き出します。

async function run() {
  // packages/contracts/blog ディレクトリで sui client publish コマンドを実行
  const proc = Bun.spawn({
    cmd: ["sui", "client", "publish", "--silence-warnings"],
    cwd: "./packages/contracts/blog",
    stdout: "pipe",
    stderr: "inherit",
  });

  // 出力を文字列として取得
  const outputBuffer = await proc.stdout.arrayBuffer();
  const output = new TextDecoder().decode(outputBuffer);

  // "Published Objects"以降の行からPackageIDを抽出する関数
  function extractPackageId(text) {
    const lines = text.split("\n");
    // "Published Objects"を含む行のインデックスを特定
    const startIndex = lines.findIndex(line => line.includes("Published Objects"));
    if (startIndex === -1) return null;
    // "Published Objects"以降の最大5行を対象にする
    const targetLines = lines.slice(startIndex, startIndex + 5);
    for (const line of targetLines) {
      const match = line.match(/PackageID:\s*([0-9a-fA-Fx]+)/);
      if (match) return match[1];
    }
    return null;
  }

  // 指定の検索パターンの前4行以内にあるObjectIDを抽出する関数
  function extractObjectId(text, searchPattern) {
    const lines = text.split("\n");
    const regexSearch = new RegExp(searchPattern);
    for (let i = 0; i < lines.length; i++) {
      if (regexSearch.test(lines[i])) {
        // 前4行（存在する場合）を調べる
        const start = Math.max(0, i - 4);
        for (let j = start; j < i; j++) {
          const match = lines[j].match(/ObjectID:\s*([0-9a-fA-Fx]+)/);
          if (match) return match[1];
        }
      }
    }
    return null;
  }

  const packageId = extractPackageId(output);
  // "ObjectType: .*::user::UserList " にマッチする部分の前4行から ObjectID を抽出
  const userListObjectId = extractObjectId(output, "ObjectType: .*::user::UserList ");

  const envInfo = `VITE_NETWORK=testnet
VITE_PACKAGE_ID=${packageId}
VITE_USER_LIST_OBJECT_ID=${userListObjectId}`;

  // packages/frontend ディレクトリに.env.localファイルとして書き出し
  await Bun.write("./packages/frontend/.env.local", envInfo);
  console.log(envInfo);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
