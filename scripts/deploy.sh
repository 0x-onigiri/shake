#!/bin/bash

output=$(cd ./packages/contracts/blog && sui client publish --silence-warnings)

extract_package_id() {
    echo "$output" | grep -A 4 "Published Objects" | grep "PackageID:" | sed 's/.*PackageID: \([0-9a-fA-Fx]*\).*/\1/'
}

extract_object_id() {
    local search_pattern="$1"
    echo "$output" | grep -B 4 "$search_pattern" | grep "ObjectID:" | sed 's/.*ObjectID: \([0-9a-fA-Fx]*\).*/\1/'
}

packageId=$(extract_package_id)
userListObjectId=$(extract_object_id "ObjectType: .*::user::UserList ")

env_info="VITE_NETWORK=testnet
VITE_PACKAGE_ID=$packageId
VITE_USER_LIST_OBJECT_ID=$userListObjectId"

echo "$env_info" > "./packages/frontend/.env.local"
echo "$env_info"
