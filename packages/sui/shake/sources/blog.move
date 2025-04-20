module shake::blog;

use shake::user::User;
use std::string::String;
use sui::clock::Clock;
use sui::coin::Coin;
use sui::object_table::{Self, ObjectTable};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::vec_map::{Self, VecMap};

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
    // postに対するレビューを格納 <レビュワーアカウントid, レビューオブジェクト>
    reviews: ObjectTable<ID, Review>, // indexer 等使用する場合は不要
    // postに対するレビューを格納 <レビュワーアカウントid, レビューオブジェクトID>
    // reviews: Table<ID, ID>,
    // レビューの総数
    review_count: u64,
    // レビューに対する評価を格納 <レビューid, <評価者アカウントid, 評価>>
    review_votes: Table<ID, Table<ID, u8>>,
    // レビューの評価数 <評価(1:Helpful, 2:NotHelpful), 評価数>
    review_vote_count: VecMap<VoteForReview, u64>,
}

public struct Review has key, store {
    id: UID,
    post_id: ID,
    content: String,
    created_at: u64,
    updated_at: u64,
}

public enum VoteForReview has copy, drop, store {
    Helpful,
    NotHelpful,
    None,
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

    let mut review_vote_count = vec_map::empty<VoteForReview, u64>();
    review_vote_count.insert(VoteForReview::Helpful, 0);
    review_vote_count.insert(VoteForReview::NotHelpful, 0);

    let post_metadata = PostMetadata {
        id: post_metadata_id,
        post_id: post.id.uid_to_inner(),
        owner: ctx.sender(),
        like: 0,
        tag: vector[],
        price,
        reviews: object_table::new(ctx),
        review_votes: table::new(ctx),
        review_count: 0,
        review_vote_count: review_vote_count,
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
    ctx: &TxContext,
) {
    assert!(approve_internal(ctx.sender(), id, post_payment, post_metadata), 9999);
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

#[allow(lint(self_transfer))]
public fun create_review(
    post_metadata: &mut PostMetadata,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let review = Review {
        id: object::new(ctx),
        post_id: post_metadata.post_id,
        content,
        created_at: clock.timestamp_ms(),
        updated_at: clock.timestamp_ms(),
    };

    post_metadata.reviews.add(ctx.sender().to_id(), review);
    post_metadata.review_count = post_metadata.review_count + 1;
}

/// レビューに対する評価を追加
entry fun vote_for_review(post_metadata: &mut PostMetadata, reaction_arg: vector<u8>) {
    let reaction = parse_vote_for_review(reaction_arg);

    match (reaction) {
        VoteForReview::Helpful => {
            let count = post_metadata.review_vote_count.get_mut(&VoteForReview::Helpful);
            *count = *count + 1;
        },
        VoteForReview::NotHelpful => {
            let count = post_metadata.review_vote_count.get_mut(&VoteForReview::NotHelpful);
            *count = *count + 1;
        },
        // Noneの場合はエラーとする todo エラーメッセージを追加する
        VoteForReview::None => abort 100,
    };
}

// フロントからおそらくenum渡せないので、vector<u8>で受け取り変換する
fun parse_vote_for_review(reaction_arg: vector<u8>): VoteForReview {
    if (reaction_arg == b"Helpful") {
        VoteForReview::Helpful
    } else if (reaction_arg == b"NotHelpful") {
        VoteForReview::NotHelpful
    } else {
        VoteForReview::None
    }
}
