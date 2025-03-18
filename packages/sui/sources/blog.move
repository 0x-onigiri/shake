module shake_onigiri::blog;

use shake_onigiri::user::UserActivity;
use std::string::{Self, String};
use sui::clock::Clock;
use sui::dynamic_field as df;
use sui::table::{Self, Table};

// Dynamic Fieldのキー構造体
/// メインコンテンツ用のキー
public struct ContentKey has copy, drop, store {}

//ブログ記事 owned object としてuserが所有する
public struct Post has key, store {
    id: UID,
    // 投稿者のアドレス
    author: address,
    // 記事タイトル
    title: String,
    // 記事作成日時（タイムスタンプ）
    created_at: u64,
    // 記事最終更新日時（タイムスタンプ）
    updated_at: u64,
    //メディアの数
    media_count: u64,
    // 公開状態（0: 下書き, 1: 公開, 2: 非公開）
    status: u8,
    // メディアテーブル（blob_id -> メディアメタデータ）
    media: Table<ID, MediaMetadata>,
}

// Walrusに保存された記事メタデータ
public struct PostMetadata has store {
    // WalrusにアップロードBlobに紐づくSui Object ID
    content_object_id: ID,
    // コンテンツタイプ（"html", "markdown"など）
    content_type: String,
    // バージョン番号
    version: u64,
    // アップロード日時
    uploaded_at: u64,
}

// Walrusに保存されたメディアメタデータ メディア1つに対し1つのメタデータが存在する想定
public struct MediaMetadata has store {
    // メディアの種類（"image", "video", "audio"など）(もしくはMIME タイプ)
    media_type: String,
    // アップロード日時
    uploaded_at: u64,
    // 表示順序（オプション）
    display_order: u64,
}

// 初期化
fun init(_ctx: &mut TxContext) {}

// コンテンツなしで新しい記事を作成
// フロントでは記事作成時にcreate_empty_post, add_media_to_post(オプション), add_content_to_post(オプション)を呼び出す
public fun create_empty_post(
    mut user_activity: UserActivity,
    title: vector<u8>,
    // user: &mut User,
    clock: &Clock,
    ctx: &mut TxContext,
): (UserActivity, Post) {
    let timestamp = clock.timestamp_ms();

    let post = Post {
        id: object::new(ctx),
        author: tx_context::sender(ctx),
        title: title.to_string(),
        created_at: timestamp,
        updated_at: timestamp,
        media_count: 0,
        status: 0, // デフォルトは下書き
        media: table::new(ctx),
    };

    //作成した記事を記録
    user_activity.record_post_creation(post.id.to_address());

    return (user_activity, post)
}

// メディアを記事に追加する関数
public fun add_media_to_post(
    post: &mut Post,
    media_blob_ids: vector<ID>,
    media_types: vector<vector<u8>>,
    timestamp: u64,
    _ctx: &mut TxContext,
) {
    let media_count = media_blob_ids.length();

    if (media_count == 0) {
        return
    };

    let mut i = 0;
    while (i < media_count) {
        let blob_id = *media_blob_ids.borrow(i);
        let media_type_bytes = media_types.borrow(i);

        // 既に同じblob_idが存在する場合はスキップ
        if (table::contains(&post.media, blob_id)) {
            i = i + 1;
            continue
        };

        let media = MediaMetadata {
            media_type: string::utf8(*media_type_bytes),
            uploaded_at: timestamp,
            display_order: post.media_count, // 現在のメディア数を表示順序として使用
        };

        // メディアをテーブルに追加（blob_idをキーとして使用）
        table::add(&mut post.media, blob_id, media);

        // カウンターを増やす
        post.media_count = post.media_count + 1;

        i = i + 1;
    };
}

// ブログ記事本文メタデータを記事に追加する関数
public fun add_content_to_post(
    post: &mut Post,
    content_object_id: ID,
    content_type: vector<u8>,
    timestamp: u64,
    _ctx: &mut TxContext,
) {
    let content = PostMetadata {
        content_object_id,
        content_type: content_type.to_string(),
        version: 1, // 初期バージョン
        uploaded_at: timestamp,
    };

    // 構造体をキーとして使用
    df::add(&mut post.id, ContentKey {}, content);
}
