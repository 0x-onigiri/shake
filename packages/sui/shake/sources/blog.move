module shake::blog;

use shake::user::User;
use std::string::String;
use sui::clock::Clock;
use sui::table::{Self, Table};
use sui::sui::{SUI};
use sui::coin::{Coin};


public struct Post has key, store {
    id: UID,
    title: String,
    created_at: u64,
    updated_at: u64,
    // thumbnail_blob_id: String,
    post_blob_id: String,
    post_metadata_id: ID,
}

public struct PostMetadata has key, store {
    id: UID,
    post_id: ID,
    owner: address,
    like: u64,
    tag: vector<String>,
    price: Option<u64>,
}

public struct PostPayment has key {
    id: UID,
    list: Table<ID, vector<address>>,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(PostPayment {
        id: object::new(ctx),
        list: table::new(ctx),
    });
}

#[allow(lint(self_transfer))]
public fun create_post(
    _: &User,
    title: String,
    post_blob_id: String,
    price: Option<u64>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let timestamp = clock.timestamp_ms();
    let post_metadata_id = object::new(ctx);

    let post = Post {
        id: object::new(ctx),
        title,
        post_blob_id,
        post_metadata_id: post_metadata_id.uid_to_inner(),
        created_at: timestamp,
        updated_at: timestamp,
    };

    let post_metadata = PostMetadata {
        id: post_metadata_id,
        post_id: post.id.uid_to_inner(),
        owner: ctx.sender(),
        like: 0,
        tag: vector[],
        price,
    };

    transfer::public_transfer(post, ctx.sender());
    transfer::public_share_object(post_metadata);
}

public fun purchase_post(
    post_payment: &mut PostPayment,
    post_metadata: &PostMetadata,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    // TODO: post_metadata.price でチェックする
    assert!(payment.value() >= 10_000_000, 0);

    let post_id = post_metadata.post_id;
    if (!post_payment.list.contains(post_id)) {
        post_payment.list.add(post_id, vector::empty<address>());
    };
    let list = post_payment.list.borrow_mut(post_id);
    list.push_back(ctx.sender());

    transfer::public_transfer(payment, post_metadata.owner);

}

public fun is_purchased_post(
    post_payment: &PostPayment,
    post_metadata: &PostMetadata,
    ctx: &mut TxContext,
): bool {
    let post_id = post_metadata.post_id;
    if (!post_payment.list.contains(post_id)) return false;

    let list = post_payment.list.borrow(post_id);
    list.contains(&ctx.sender())
}

public fun namespace(post_payment: &PostPayment): vector<u8> {
    post_payment.id.to_bytes()
}
entry fun seal_approve(
    id: vector<u8>,
    post_payment: &PostPayment,
    post_metadata: &PostMetadata,
    ctx: &TxContext
) {
    assert!(
        approve_internal(ctx.sender(), id, post_payment, post_metadata),
        9999
    );
}

fun approve_internal(
    caller: address,
    id: vector<u8>,
    post_payment: &PostPayment,
    post_metadata: &PostMetadata,
): bool {
    // Check if the id has the right prefix
    let namespace = namespace(post_payment);
    if (!is_prefix(namespace, id)) {
        return false
    };

    let list = post_payment.list.borrow(post_metadata.post_id);
    list.contains(&caller)
}


fun is_prefix(prefix: vector<u8>, word: vector<u8>): bool {
    if (prefix.length() > word.length()) {
        return false
    };
    let mut i = 0;
    while (i < prefix.length()) {
        if (prefix[i] != word[i]) {
            return false
        };
        i = i + 1;
    };
    true
}
