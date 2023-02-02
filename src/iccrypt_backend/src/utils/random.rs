use uuid::Uuid;

pub async fn get_new_uuid() -> String {
    let ra: [u8; 16] = get_random_array().await;
    Uuid::from_bytes(ra).as_hyphenated().to_string()
}

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // local rust, dummy mockup implementation.
        async fn get_random_array() -> [u8;16] {
            [rand::random();16]
        }

    } else {
        // Internet Computer
        #[ic_cdk_macros::update]
        async fn get_random_array() -> [u8;16]{
            // this management canistesr call throws errors. don't know why. can't find a good
            // answer on the forum.
            // Error msg: Error: The Replica returned an error: code 5, message: "IC0504: Canister rrkah-fqaaa-aaaaa-aaaaq-cai violated contract: "ic0_call_new" cannot be executed in non replicated query mode"
            // TODO find fix for this!
            // let random_bytes: Vec<u8> = match call(Principal::management_canister(), "raw_rand", ()).await {
            //     Ok((res,)) => res,
            //     Err((_, err)) => trap(&format!("Failed to get random seed: {}", err)),
            // };

            // another try
            // let management_canister = ic_cdk::export::Principal::management_canister();
            // let random_bytes: Vec<u8> = match ic_cdk::call(management_canister, "raw_rand", ()).await {
            //     Ok((res,)) => res,
            //     Err((_, err)) => ic_cdk::trap(&format!("Failed to get random seed: {}", err)),
            // };

            // WORKAROUND: generating some pseudorandomness using the timestamp
            let mut random_bytes: Vec<u8> = vec![ic_cdk::api::time() as u8; 32];
            // END OF WORKAROUND

            // management canister's "rand_raw" returns a vec of length 32.
            // we need to resize for the Uuid library.
            random_bytes.resize(16, 0);

            let bytes: [u8; 16] = random_bytes.try_into().unwrap_or_else(|v: Vec<u8>| {
                panic!("Expected a Vec of length {} but it was {}", 16, v.len())
            });

            bytes
        }

    }
}

#[cfg(test)]
mod tests {
    // use super::*;
    // use uuid::Uuid;

    #[tokio::test]
    async fn utest_uuid() {
        // let uuid = get_new_uuid().await;
        // dbg!("++++++++");
        // dbg!(&uuid);
        // assert_eq!(
        //     uuid,
        //     Uuid::try_parse(&uuid).unwrap().as_hyphenated().to_string()
        // );
    }
}
