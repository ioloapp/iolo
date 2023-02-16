use crate::utils::KeyPairs::{get_key_pairs, KeyPair};

// returns a keypair
pub fn deterministically_derive_key_pair(
    master_key_id: i32,
    caller: &str,
    derivation_id: &str,
) -> KeyPair {
    let kps: Vec<KeyPair> = get_key_pairs();
    let mut index: usize = 1;

    index += usize::try_from(master_key_id).unwrap();

    caller.as_bytes().iter().for_each(|b: &u8| {
        index += usize::from(*b);
    });

    derivation_id.as_bytes().iter().for_each(|b: &u8| {
        index += usize::from(*b);
    });

    kps[(index % kps.len())].clone()
}

#[cfg(test)]
mod tests {
    use super::deterministically_derive_key_pair;

    #[test]
    fn test_index_derivation() {
        let kp1 = deterministically_derive_key_pair(1, "caller", "SomeTestDerivationString");
        let kp2 = deterministically_derive_key_pair(1, "caller", "SomeTestDerivationString");
        let kp3 = deterministically_derive_key_pair(1, "caller", "ICCrypt||Alice||Bob");
        let kp4 = deterministically_derive_key_pair(1, "caller", "ICCrypt||Evesdropper||Bob");

        assert_eq!(kp1.private_key, kp2.private_key);
        assert_eq!(kp1.public_key, kp2.public_key);
        assert_ne!(kp1.private_key, kp3.private_key);
        assert_ne!(kp1.private_key, kp4.private_key);
        assert_ne!(kp3.private_key, kp4.private_key);
    }
}
