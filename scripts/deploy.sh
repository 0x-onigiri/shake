#!/bin/bash

output=$(cd ./packages/sui/shake && sui client publish --silence-warnings)

extract_package_id() {
    echo "$output" | grep -A 4 "Published Objects" | grep "PackageID:" | sed 's/.*PackageID: \([0-9a-fA-Fx]*\).*/\1/'
}

extract_object_id() {
    local search_pattern="$1"
    echo "$output" | grep -B 4 "$search_pattern" | grep "ObjectID:" | sed 's/.*ObjectID: \([0-9a-fA-Fx]*\).*/\1/'
}

packageId=$(extract_package_id)
userListObjectId=$(extract_object_id "ObjectType: .*::user::UserList ")
postPaymentObjectId=$(extract_object_id "ObjectType: .*::blog::PostPayment ")

# env_info="VITE_NETWORK=testnet
# VITE_PACKAGE_ID=$packageId
# VITE_USER_LIST_OBJECT_ID=$userListObjectId
# VITE_POST_PAYMENT_OBJECT_ID=$postPaymentObjectId"

# echo "$env_info" > "./packages/frontend/.env.local"
# echo "$env_info"


contract_const_info="export const SHAKE_ONIGIRI = {
  testnet: {
    packageId: '$packageId',
    userListObjectId: '$userListObjectId',
    postPaymentObjectId: '$postPaymentObjectId',
  },
}"

echo "$contract_const_info" > "./packages/frontend/src/constants/contract.ts"
echo "$contract_const_info"
