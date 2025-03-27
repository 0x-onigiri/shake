module shake::user;

use shake::paginator;
use std::string::String;
use sui::clock::Clock;
use sui::table::{Self, Table};
use sui::table_vec::{Self, TableVec};

// アカウントリスト(共有オブジェクト)
public struct UserList has key {
    id: UID,
    // User.idのマッピング
    users: Table<address, address>,
}

// ユーザープロフィール(所有オブジェクトSBTとしてユーザーのアドレス転送する)
public struct User has key {
    id: UID,
    // アカウント所有者のウォレットアドレス
    owner_address: address,
    // ユーザー名
    username: String,
    // 画像
    image: String,
    // アカウント作成日時
    created_at: u64,
    // 作成したブログ記事
    posts: TableVec<UserPost>,
}

//Userによって作成されたpost Postは共有オブジェクトとするので、そのIDを保存する
public struct UserPost has copy, store {
    post_address: address,
}

// Hot Potato ブログ記事作成とUserへのPostCreatedの登録が確実に行われることを保証
public struct UserActivity {
    user: User,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(UserList {
        id: object::new(ctx),
        users: table::new(ctx),
    });
}

// 初回記事作成：新しいアカウントを作成
public fun create_new_user(
    user_list: &mut UserList,
    username: vector<u8>,
    image_blob_id: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
): UserActivity {
    let user = User {
        id: object::new(ctx),
        owner_address: ctx.sender(),
        username: username.to_string(),
        image: image_blob_id.to_string(),
        created_at: clock.timestamp_ms(),
        posts: table_vec::empty(ctx),
    };

    //todo: user_listにアカウントが存在しないこと確認し問題なければUserListに追加
    user_list.users.add(ctx.sender(), user.id.to_address());

    UserActivity { user }
}

// アカウント作成後の新規記事作成はここでUserActivityを作成してから行う
public fun create_user_activity(user: User): UserActivity {
    UserActivity { user }
}

public fun existing_user_activity(user: User): UserActivity {
    return UserActivity {
        user,
    }
}

// potato 利用するトランザクションは最後にこの関数を呼び出して処理する
public fun delete_user_activity(user_activity: UserActivity, ctx: &TxContext) {
    let UserActivity { user } = user_activity;
    //UserActivityをunpackしてuserを返却する
    transfer::transfer(user, ctx.sender());
}

// 記事作成時に呼びだし記事のidをUserへ記録する
public(package) fun record_post_creation(user_activity: &mut UserActivity, post_address: address) {
    user_activity
        .user
        .posts
        .push_back(UserPost {
            post_address,
        })
}

public fun get_user_address(registry: &UserList, owner_addr: address): address {
    if (registry.users.contains(owner_addr)) {
        *registry.users.borrow(owner_addr)
    } else {
        @0x0
    }
}

public fun get_posts(
    user: &User,
    cursor: u64,
    limit: u64,
    ascending: bool,
): (vector<UserPost>, bool, u64) {
    return paginator::get_page(&user.posts, cursor, limit, ascending)
}
