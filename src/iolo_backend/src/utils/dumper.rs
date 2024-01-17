use crate::smart_vaults::smart_vault::{SECRET_STORE, USER_STORE, USER_VAULT_STORE};

pub fn dump_secret_store() {
    SECRET_STORE.with(|ss| {
        let secret_store = ss.borrow();
        // loop throush secrets
        println!("\n\n------- DUMPING SECRET STORE -------");
        for (k, v) in secret_store.secrets.iter() {
            println!("{}: {:?}", k, v);
        }
        println!("------- DUMPING SECRET STORE  END -------\n\n");
    });
}

pub fn dump_user_store() {
    USER_STORE.with(|us| {
        let user_store = us.borrow();
        // loop throush secrets
        println!("\n\n------- DUMPING USER STORE -------");
        for (k, v) in user_store.users.iter() {
            println!("{}: {:?}", k, v);
        }
        println!("------- DUMPING USER STORE  END -------\n\n");
    });
}

pub fn dump_user_vault_store() {
    USER_VAULT_STORE.with(|us| {
        let user_vault_store = us.borrow();
        // loop throush secrets
        println!("\n\n------- DUMPING USER VAULT STORE -------");
        for (k, v) in user_vault_store.user_vaults.iter() {
            println!("{}: {:?}", k, v);
        }
        println!("------- DUMPING USER VAULT STORE  END -------\n\n");
    });
}
