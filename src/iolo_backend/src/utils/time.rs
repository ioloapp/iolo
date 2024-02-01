cfg_if::cfg_if! {
    if #[cfg(test)] {
        pub fn get_current_time() -> u64 {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("Error getting system time")
                .as_nanos().try_into().unwrap() // In nanoseconds, u64 supports nanoseconds until Sunday, 21. July 2554 23:34:33.709 GMT :)
        }
    } else {
        pub fn get_current_time() -> u64 {
            ic_cdk::api::time()  // In nanoseconds
        }
    }
}

#[cfg(test)]
mod tests {
    use std::thread;

    use super::*;

    #[test]
    fn utest_time() {
        let time_1 = get_current_time();
        thread::sleep(std::time::Duration::from_millis(100)); // Sleep 100 milliseconds to ensure that user_vault has a different creation date
        let time_2 = get_current_time();

        assert!(
            time_1 < time_2,
            "time_1 {} is not less than time_2 {}",
            time_1,
            time_2
        );
        assert!(time_1 > 1674990000000000000, "time_1 {} is either not in Nanoseconds (19 digits) or less than 1674990000000000000 (2023-01-29, 12:00", time_1);
    }
}
