module blog::blog;

// === Imports ===

use std::string::{Self, String};
use sui::{
    clock::Clock,
    event,
};
use blog::user::UserActivity;

// === Structs ===

public struct Post has key, store {
    id: UID,
    // 投稿者のアドレス
    author: address,
    // 記事タイトル
    title: String,
    // 記事作成日時（タイムスタンプ）
    created_at: u64,
}

fun init(_ctx: &mut TxContext) {}

// === Public Functions ===

public fun create_post(
    mut user_activity: UserActivity,
    title: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
): UserActivity {
    let timestamp = clock.timestamp_ms();

    let post = Post {
        id: object::new(ctx),
        author: ctx.sender(),
        title: string::utf8(title),
        created_at: timestamp,
    };

    user_activity.record_post_creation(post.id.to_address());

    transfer::share_object(post);

    user_activity
}
