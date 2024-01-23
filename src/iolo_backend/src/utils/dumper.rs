use crate::smart_vaults::smart_vault::{SECRET_STORE, USER_STORE};

pub fn dump_secret_store() {
    SECRET_STORE.with(|ss| {
        let secret_store = ss.borrow();
        // loop throush secrets
        println!("\n\n------- DUMPING SECRET STORE -------");
        for (k, v) in secret_store.secrets.iter() {
            println!("{}", k);
            println!("-----------------");
            println!("{:?}\n", v);
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
            println!("{}", k);
            println!("-----------------");
            println!("{:?}\n", v);
        }
        println!("------- DUMPING USER STORE  END -------\n\n");
    });
}
