use candid::Principal;

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // we are in the test environment
        pub fn get_caller() -> Principal {
            Principal::from_slice(&[
                1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0,
            ])
        }
    } else {
        // we are running on the ic (local or web)
        pub fn get_caller() -> Principal {
           ic_cdk::caller()
        }
    }
}
