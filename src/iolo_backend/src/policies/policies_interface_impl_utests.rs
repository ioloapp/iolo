#[cfg(test)]
mod tests {
    use candid::Principal;
    use rand::Rng;
    use std::collections::HashSet;

    use crate::policies::conditions::{
        UpdateCondition, UpdateLastLoginTimeCondition, UpdateXOutOfYCondition,
    };
    use crate::policies::policy::UpdatePolicyArgs;
    use crate::secrets::secret::Secret;
    use crate::users::user::User;
    use crate::{
        common::error::SmartVaultErr,
        policies::{
            conditions::Validator,
            policies_interface_impl::{
                create_policy_impl, get_policy_as_beneficiary_impl, get_policy_as_owner_impl,
                get_policy_list_as_beneficiary_impl, get_policy_list_as_owner_impl,
                get_policy_list_as_validator_impl, update_policy_impl,
            },
            policy::{CreatePolicyArgs, Policy, PolicyWithSecretListEntries},
        },
        secrets::{secret::CreateSecretArgs, secrets_interface_impl::create_secret_impl},
        smart_vaults::smart_vault::POLICY_STORE,
        users::{
            user::{AddOrUpdateUserArgs, KeyBox},
            users_interface_impl::create_user_impl,
        },
    };

    #[tokio::test]
    async fn itest_policy_lifecycle() {
        let principal = create_principal();
        let beneficiary1 = create_principal();
        let beneficiary2 = create_principal();
        let validator1 = create_principal();
        let validator2 = create_principal();

        // Create Users in the backend
        create_test_users(&principal).await;
        create_test_users(&beneficiary1).await;
        create_test_users(&beneficiary2).await;
        create_test_users(&validator1).await;
        create_test_users(&validator2).await;

        // Create a Secret
        let added_secret = create_and_add_secret(principal.to_string()).await;

        // create and add an policy (still empty)
        let added_policy: Policy = create_and_add_policy(principal.to_string()).await;

        // create two conditions
        let last_login_time_condition: UpdateCondition = create_new_last_login_time_condition();
        let x_out_of_y_condition: UpdateCondition =
            create_new_x_oo_y_condition(validator1.to_string());

        // Update policy: add secret and two conditions
        let added_policy = update_policy_with_secret_and_two_conditions(
            &principal,
            &added_policy,
            &added_secret,
            &beneficiary1,
            &last_login_time_condition,
            &x_out_of_y_condition,
        )
        .await;

        // get policy list and check if policy is in there
        let policy_list = get_policy_list_as_owner_impl(principal.to_string()).unwrap();
        assert_eq!(policy_list.len(), 1);
        assert_eq!(&policy_list[0].id, added_policy.id());

        // get specific policy from proper interface implementation
        let mut fetched_policy: PolicyWithSecretListEntries =
            get_policy_as_owner_impl(added_policy.id().clone(), principal.to_string()).unwrap();
        assert_eq!(fetched_policy.secrets().len(), 1);
        assert_eq!(
            fetched_policy.secrets().iter().next().unwrap().id,
            added_secret.id()
        );
        assert_eq!(fetched_policy.beneficiaries.len(), 1);
        assert_eq!(fetched_policy.conditions.len(), 2);

        // get list of policies as beneficiary
        let policy_list_as_beneficiary =
            get_policy_list_as_beneficiary_impl(beneficiary1.to_string()).unwrap();
        assert_eq!(policy_list_as_beneficiary.len(), 1);
        assert_eq!(&policy_list_as_beneficiary[0].id, added_policy.id());

        // get specific policy as beneficiary: this should fail, because policy has not yet been activated
        let policy_response =
            get_policy_as_beneficiary_impl(added_policy.id().clone(), beneficiary1.to_string());
        assert!(policy_response.is_err_and(|e| matches!(e, SmartVaultErr::InvalidPolicyCondition)));

        // get policy list as validator: we expect a policy to be in there
        let get_policy_list_as_validator =
            get_policy_list_as_validator_impl(validator1.to_string()).unwrap();
        assert_eq!(get_policy_list_as_validator.len(), 1);
        assert_eq!(&get_policy_list_as_validator[0].id, added_policy.id());

        // UPDATE POLICY NAME and BENEFICIARIES (lave conditions unchanged)
        let updated_policy = update_policy_with_new_name_and_additional_beneficiary(
            &principal,
            &added_policy,
            "new name",
            &beneficiary1,
            &beneficiary2,
        )
        .await;

        // UPDATE POLICY CONDITIONS
        let condtion_updates: Vec<UpdateCondition> = updated_policy
            .conditions
            .clone()
            .into_iter()
            .map(UpdateCondition::from)
            .map(|c| match c {
                UpdateCondition::LastLogin(mut llc) => {
                    llc.number_of_days_since_last_login = 99;
                    return UpdateCondition::LastLogin(llc);
                }
                UpdateCondition::XOutOfY(mut xooy) => {
                    xooy.question = "this is an updated question for you".to_string();
                    return UpdateCondition::XOutOfY(xooy);
                }
                UpdateCondition::FixedDateTime(_) => c,
            })
            .collect();
        let updated_policy = update_policy_conditions(
            &principal,
            &updated_policy,
            &condtion_updates[0],
            &condtion_updates[1],
        )
        .await;

        // remove a policy condition
        let updated_policy = remove_one_policy_condition_by_omitting_it(
            &principal,
            &updated_policy,
            &condtion_updates[0],
        )
        .await;

        dbg!(&updated_policy);
    }

    fn create_principal() -> Principal {
        // create random u8
        let mut rng = rand::thread_rng();

        // create random u8 array
        let mut random_u8_array: [u8; 29] = [0; 29];
        rng.fill(&mut random_u8_array[..]);
        Principal::from_slice(&random_u8_array)
    }

    async fn create_test_users(p: &Principal) -> User {
        let aua: AddOrUpdateUserArgs = AddOrUpdateUserArgs {
            name: Some("Alice the main user".to_string()),
            email: None,
            user_type: None,
        };
        let user_main = create_user_impl(aua.clone(), p.to_string()).await.unwrap();
        user_main
    }

    async fn create_and_add_secret(p_id: String) -> Secret {
        let encrypted_symmetric_key: Vec<u8> = vec![1, 2, 3];

        let asa: CreateSecretArgs = CreateSecretArgs {
            category: None,
            name: Some("Google".to_string()),
            username: Some(vec![1, 2, 3]),
            password: Some(vec![1, 2, 3]),
            url: None,
            notes: Some(vec![1, 2, 3]),
            encrypted_symmetric_key,
        };

        // Add Secret
        let added_secret = create_secret_impl(asa.clone(), p_id).await;
        added_secret.unwrap()
    }

    fn create_new_last_login_time_condition() -> UpdateCondition {
        let last_login_time_condition: UpdateCondition =
            UpdateCondition::LastLogin(UpdateLastLoginTimeCondition {
                id: None,
                number_of_days_since_last_login: 0,
            });
        last_login_time_condition
    }

    fn create_new_x_oo_y_condition(validator_id: String) -> UpdateCondition {
        let x_out_of_y_condition: UpdateCondition =
            UpdateCondition::XOutOfY(UpdateXOutOfYCondition {
                id: None,
                validators: vec![Validator {
                    principal_id: validator_id,
                    status: false,
                }],
                quorum: 1,
                question: "When will you be happy?".to_string(),
            });
        x_out_of_y_condition
    }

    async fn create_and_add_policy(p_id: String) -> Policy {
        let apa: CreatePolicyArgs = CreatePolicyArgs {
            name: Some("Policy#1".to_string()),
        };
        let added_policy: Policy = create_policy_impl(apa.clone(), p_id).await.unwrap();
        added_policy
    }

    async fn update_policy_with_secret_and_two_conditions(
        principal: &Principal,
        added_policy: &Policy,
        added_secret: &Secret,
        beneficiary: &Principal,
        last_login_time_condition: &UpdateCondition,
        x_out_of_y_condition: &UpdateCondition,
    ) -> Policy {
        let mut secrets = HashSet::new();
        let mut kb: KeyBox = KeyBox::new();
        kb.insert(added_secret.id().to_string(), vec![1, 2, 3]);
        secrets.insert(added_secret.id().to_string());
        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: added_policy.clone().id().to_string(),
            name: added_policy.clone().name,
            beneficiaries: [beneficiary.to_string()].iter().cloned().collect(),
            secrets,
            key_box: kb,
            conditions_logical_operator: None,
            conditions: vec![
                last_login_time_condition.clone(),
                x_out_of_y_condition.clone(),
            ],
        };

        // add policy
        let added_policy_res = update_policy_impl(upa, principal.to_string()).await;
        assert!(added_policy_res.is_ok());
        let added_policy = added_policy_res.unwrap();

        // check if policy is in policy store and check if it contains the secret
        POLICY_STORE.with(|ps| {
            let policy_store = ps.borrow();
            // policy in store
            let pis = policy_store.get(added_policy.id()).unwrap();
            assert_eq!(pis.id(), added_policy.id());
            assert_eq!(pis.name(), added_policy.name());
            assert_eq!(pis.secrets().len(), 1);
            assert_eq!(
                pis.secrets().iter().next().unwrap(),
                &added_secret.id().to_string(),
                "Wrong secret"
            );
            assert_eq!(pis.beneficiaries().len(), 1);
            assert_eq!(
                pis.beneficiaries().iter().next().unwrap(),
                &beneficiary.to_string(),
                "Wrong beneficiary"
            );
            assert!(!pis.conditions_status);
            assert!(pis.conditions_logical_operator().is_none());
            assert_eq!(pis.conditions().len(), 2, "Policy conditions missing");
        });

        added_policy
    }

    async fn update_policy_with_new_name_and_additional_beneficiary(
        principal: &Principal,
        added_policy: &Policy,
        new_name: &str,
        beneficiary1: &Principal,
        beneficiary2: &Principal,
    ) -> Policy {
        let mut beneficiaries = HashSet::new();
        beneficiaries.insert(beneficiary1.to_string());
        beneficiaries.insert(beneficiary2.to_string());

        let update_conditions: Vec<UpdateCondition> = added_policy
            .conditions
            .iter()
            .map(|condition| condition.into_update_condition())
            .collect();

        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: added_policy.id().to_string(),
            name: Some(new_name.to_string()),
            beneficiaries,
            secrets: added_policy.secrets.clone(),
            key_box: added_policy.key_box.clone(),
            conditions_logical_operator: added_policy.conditions_logical_operator().clone(),
            conditions: update_conditions,
        };

        // perform the update
        let updated_policy = update_policy_impl(upa.clone(), principal.to_string()).await;
        assert!(updated_policy.is_ok());
        let updated_policy = updated_policy.unwrap();

        // check name and beneficiaries
        assert_eq!(updated_policy.name(), &upa.name);
        assert!(updated_policy
            .beneficiaries()
            .contains(&beneficiary1.to_string()));
        assert!(updated_policy
            .beneficiaries()
            .contains(&beneficiary2.to_string()));
        updated_policy
    }

    async fn update_policy_conditions(
        principal: &Principal,
        added_policy: &Policy,
        updated_last_login_time_condition: &UpdateCondition,
        updated_x_out_of_y_condition: &UpdateCondition,
    ) -> Policy {
        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: added_policy.clone().id().to_string(),
            name: added_policy.clone().name,
            beneficiaries: added_policy.beneficiaries().clone(),
            secrets: added_policy.secrets.clone(),
            key_box: added_policy.key_box.clone(),
            conditions_logical_operator: None,
            conditions: vec![
                updated_last_login_time_condition.clone(),
                updated_x_out_of_y_condition.clone(),
            ],
        };

        // add policy
        let added_policy_res = update_policy_impl(upa, principal.to_string()).await;
        assert!(added_policy_res.is_ok());
        let added_policy = added_policy_res.unwrap();

        // check if policy is in policy store and check if it contains the secret
        POLICY_STORE.with(|ps| {
            let policy_store = ps.borrow();
            // policy in store
            let pis = policy_store.get(added_policy.id()).unwrap();
            assert_eq!(pis.id(), added_policy.id());
            assert_eq!(pis.name(), added_policy.name());
            assert_eq!(pis.secrets().len(), 1);
            assert_eq!(pis.beneficiaries().len(), 2);
            assert!(!pis.conditions_status);
            assert!(pis.conditions_logical_operator().is_none());
            assert_eq!(pis.conditions().len(), 2, "Policy conditions missing");
        });

        added_policy
    }

    async fn remove_one_policy_condition_by_omitting_it(
        principal: &Principal,
        added_policy: &Policy,
        updated_last_login_time_condition: &UpdateCondition,
    ) -> Policy {
        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: added_policy.clone().id().to_string(),
            name: added_policy.clone().name,
            beneficiaries: added_policy.beneficiaries().clone(),
            secrets: added_policy.secrets.clone(),
            key_box: added_policy.key_box.clone(),
            conditions_logical_operator: None,
            conditions: vec![updated_last_login_time_condition.clone()],
        };

        // add policy
        let added_policy_res = update_policy_impl(upa, principal.to_string()).await;
        assert!(added_policy_res.is_ok());
        let added_policy = added_policy_res.unwrap();

        // check if policy is in policy store and check if it contains the secret
        POLICY_STORE.with(|ps| {
            let policy_store = ps.borrow();
            // policy in store
            let pis = policy_store.get(added_policy.id()).unwrap();
            assert_eq!(pis.id(), added_policy.id());
            assert_eq!(pis.name(), added_policy.name());
            assert_eq!(pis.secrets().len(), 1);
            assert_eq!(pis.beneficiaries().len(), 2);
            assert!(!pis.conditions_status);
            assert!(pis.conditions_logical_operator().is_none());
            assert_eq!(
                pis.conditions().len(),
                1,
                "Only one policy condition expected"
            );
        });

        added_policy
    }
}
