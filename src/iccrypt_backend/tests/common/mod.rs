use anyhow::Ok;
use xshell::{cmd, Shell};

pub fn setup() -> anyhow::Result<()> {
    let sh = Shell::new()?;
    // let manifest = sh.read_file("Cargo.toml")?;
    // dbg!("hi");
    sh.change_dir("../../");
    cmd!(sh, "dfx build iccrypt_backend")
        .run()
        .unwrap_or_else(|_| {});
    cmd!(sh, "dfx canister install iccrypt_backend --mode upgrade")
        .run()
        .unwrap_or_else(|_| {});

    // cmd!(sh, "./deploy.sh local").run().unwrap_or_else(|_| {});

    // assert_eq!(1, 2);

    Ok(())
}

pub fn cleanup() -> anyhow::Result<()> {
    // let sh = Shell::new()?;
    // let manifest = sh.read_file("Cargo.toml")?;
    // cmd!(sh, "dfx start").run().unwrap_or_else(|_| {});
    // cmd!(sh, "dfx stop").run().unwrap_or_else(|_| {});

    // assert_eq!(1, 2);

    Ok(())
}
