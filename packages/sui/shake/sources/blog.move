module shake::blog;

use std::string::{String};
use sui::clock::Clock;

public struct Post has key, store {
    id: UID,
    title: String,
    created_at: u64,
    updated_at: u64,
    thumbnail_blob_id: String,
    post_blob_id: String,
}

public struct PostMetadata has key, store {
    id: UID,
    like: u64,
    tag: vector<String>,
    price: Option<u64>,
}

public fun create_post(
    title: String,
    thumbnail_blob_id: String,
    post_blob_id: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let timestamp = clock.timestamp_ms();
    let post = Post {
        id: object::new(ctx),
        title,
        thumbnail_blob_id,
        post_blob_id,
        created_at: timestamp,
        updated_at: timestamp,
    };

    let post_metadata = PostMetadata {
        id: object::new(ctx),
        like: 0,
        tag: vector[],
        price: option::none(),
    };

    transfer::public_transfer(post, ctx.sender());
    transfer::public_share_object(post_metadata);
}
