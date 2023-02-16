use super::KeyReader::{read_keys, KeyPair};

// returns a number between 0 and 1000
pub fn deterministically_derive_key_pair(
    master_key_id: i32,
    caller: &str,
    derivation_id: &str,
) -> KeyPair {
    let kps: Vec<KeyPair> = read_keys().0;
    let mut index: usize = 1;

    index += usize::try_from(master_key_id).unwrap();

    caller.as_bytes().iter().for_each(|b: &u8| {
        index += usize::from(*b);
    });

    derivation_id.as_bytes().iter().for_each(|b: &u8| {
        index += usize::from(*b);
    });

    kps[(index % 1000)].clone()
}

#[cfg(test)]
mod tests {
    use super::deterministically_derive_key_pair;

    #[test]
    fn test_index_derivation() {
        let kp1 = deterministically_derive_key_pair(1, "caller", "SomeTestDerivationString");
        let kp2 = deterministically_derive_key_pair(1, "caller", "SomeTestDerivationString");
        let kp3 = deterministically_derive_key_pair(1, "caller", "ICCrypt||Alice||Bob");
        let kp4 = deterministically_derive_key_pair(1, "caller", "ICCrypt||Eve||Bob");

        assert_eq!(kp1.private_key, kp2.private_key);
        assert_eq!(kp1.public_key, kp2.public_key);
        assert_ne!(kp1.private_key, kp3.private_key);
        assert_ne!(kp1.private_key, kp4.private_key);
        assert_ne!(kp3.private_key, kp4.private_key);
    }
}
