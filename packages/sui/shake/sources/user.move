module shake::user;

use std::string::String;
use sui::clock::Clock;
use sui::table::{Self, Table};

public struct User has key, store {
    id: UID,
    name: String,
    profile_image_id: String,
    bio: String,
    created_at: u64,
}

public struct UserList has key {
    id: UID,
    users: Table<address, address>,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(UserList {
        id: object::new(ctx),
        users: table::new(ctx),
    });
}

#[allow(lint(self_transfer))]
public fun create_user(
    user_list: &mut UserList,
    name: String,
    profile_image_id: String,
    bio: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(!user_list.users.contains(sender), 0);

    let timestamp = clock.timestamp_ms();
    let user = User {
        id: object::new(ctx),
        name,
        profile_image_id,
        bio,
        created_at: timestamp,
    };

    user_list.users.add(sender, user.id.to_address());

    transfer::public_transfer(user, sender);
}

public(package) fun users(self: &UserList): &Table<address, address> {
    &self.users
}
