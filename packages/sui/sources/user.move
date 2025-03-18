module shake_onigiri::user;

use std::string::String;
use sui::clock::Clock;
use sui::table::{Self, Table};
use sui::table_vec::{Self, TableVec};

// モジュール初期化用の一度だけ使用するオブジェクト
public struct USER has drop {}

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
    // アカウント作成日時
    created_at: u64,
    // プロフィール画像 複数アップロード可（Walrus blob ID）
    profile_image: Option<ID>,
    // 自己紹介やブログの説明
    bio: String,
    // 作成したブログ記事
    posts: TableVec<PostCreated>,
}

//Userによって作成されたpost Postは共有オブジェクトとするので、そのIDを保存する
public struct PostCreated has store {
    post_address: address,
}

// Hot Potato ブログ記事作成とUserへのPostCreatedの登録が確実に行われることを保証
public struct UserActivity {
    user: User,
}

// 初回記事作成：新しいアカウントを作成
public fun create_new_user(
    user_list: &mut UserList,
    username: vector<u8>,
    bio: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
): UserActivity {
    let user = User {
        id: object::new(ctx),
        owner_address: ctx.sender(),
        username: username.to_string(),
        created_at: clock.timestamp_ms(),
        profile_image: option::none(),
        bio: bio.to_string(),
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

// potato 利用するトランザクションは最後にこの関数を呼び出して処理する
public fun delete_user_activity(user_activity: UserActivity, ctx: &TxContext) {
    let UserActivity { user } = user_activity;
    //UserActivityをunpackしてuserを返却する
    transfer::transfer(user, ctx.sender());
}

// 新しいユーザーレジストリを作成
// todo: init()で１度だけ呼び出す予定
fun new_user_list(ctx: &mut TxContext): UserList {
    UserList {
        id: object::new(ctx),
        users: table::new(ctx),
    }
}

// 記事作成時に呼びだし記事のidをUserへ記録する
public(package) fun record_post_creation(user_activity: &mut UserActivity, post_address: address) {
    user_activity
        .user
        .posts
        .push_back(PostCreated {
            post_address,
        })
}
