use xshell::{cmd, Shell};

#[allow(dead_code)]
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

#[allow(dead_code)]
pub fn cleanup() -> anyhow::Result<()> {
    let sh = Shell::new()?;
    sh.change_dir("../../");
    cmd!(sh, "./deploy.sh local").run().unwrap_or_else(|_| {});
    Ok(())
}

#[allow(dead_code)]
pub fn upgrade_canister(canister: &str) -> anyhow::Result<()> {
    let c: &str;
    if canister == "all" {
        c = "--all";
    } else {
        c = &canister;
    }

    let sh = Shell::new()?;
    sh.change_dir("../../");

    cmd!(sh, "dfx canister create {c}").run().unwrap();
    cmd!(sh, "dfx build {c}").run().unwrap();
    cmd!(sh, "dfx canister install {c} --mode upgrade")
        .run()
        .unwrap();
    Ok(())
}

pub fn get_backend_canister_id() -> anyhow::Result<String> {
    let sh = Shell::new()?;
    let id = cmd!(sh, "dfx canister id iccrypt_backend").read().unwrap();
    Ok(id)
}
