#[cfg(test)]
mod tests {
    use candid::Principal;
    use rand::Rng;
    use std::collections::HashSet;

    use crate::policies::conditions::{
        UpdateCondition, UpdateFixedDateTimeCondition, UpdateLastLoginTimeCondition,
        UpdateXOutOfYCondition,
    };
    use crate::policies::policy::UpdatePolicyArgs;
    use crate::secrets::secret::Secret;
    use crate::users::user::User;
    use crate::{
        common::error::SmartVaultErr,
        policies::{
            conditions::{Condition, Validator},
            policies_interface_impl::{
                create_policy_impl, get_policy_as_beneficiary_impl, get_policy_as_owner_impl,
                get_policy_list_as_beneficiary_impl, get_policy_list_as_owner_impl,
                get_policy_list_as_validator_impl, update_policy_impl,
            },
            policy::{CreatePolicyArgs, Policy, PolicyWithSecretListEntries},
        },
        secrets::{
            secret::CreateSecretArgs,
            secrets_interface_impl::{create_secret_impl, get_secret_as_beneficiary_impl},
        },
        smart_vaults::smart_vault::POLICY_STORE,
        users::{
            user::{AddOrUpdateUserArgs, KeyBox},
            users_interface_impl::create_user_impl,
        },
    };

    #[tokio::test]
    async fn itest_policy_lifecycle() {
        let principal = create_principal();
        let beneficiary = create_principal();
        let validator = create_principal();
        let validator2 = create_principal();

        // Create Users in the backend
        create_test_users(&principal).await;
        create_test_users(&beneficiary).await;
        create_test_users(&validator).await;
        create_test_users(&validator2).await;

        // Create a Secret
        let added_secret = create_and_add_secret(principal.to_string()).await;

        // create and add an policy (still empty)
        let added_policy: Policy = create_and_add_policy(principal.to_string()).await;

        // create two conditions
        let last_login_time_condition: UpdateCondition = create_last_login_time_condition();
        let x_out_of_y_condition: UpdateCondition = create_x_oo_y_condition(validator.to_string());

        // Update policy with other attributes
        let added_policy = update_policy_with_secret_and_two_conditions(
            &principal,
            &added_policy,
            &added_secret,
            &beneficiary,
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
            get_policy_list_as_beneficiary_impl(beneficiary.to_string()).unwrap();
        assert_eq!(policy_list_as_beneficiary.len(), 1);
        assert_eq!(&policy_list_as_beneficiary[0].id, added_policy.id());

        // get specific policy as beneficiary: this should fail, because policy has not yet been activated
        let policy_response =
            get_policy_as_beneficiary_impl(added_policy.id().clone(), beneficiary.to_string());
        assert!(policy_response.is_err_and(|e| matches!(e, SmartVaultErr::InvalidPolicyCondition)));

        // get policy list as validator
        let get_policy_list_as_validator =
            get_policy_list_as_validator_impl(validator.to_string()).unwrap();
        assert_eq!(get_policy_list_as_validator.len(), 1);
        assert_eq!(&get_policy_list_as_validator[0].id, added_policy.id());

        // get policy list as beneficiary: this should fail, because validator is not a beneficiary
        let get_policy_list_as_validator =
            get_policy_list_as_validator_impl(beneficiary.to_string());
        assert_eq!(get_policy_list_as_validator.unwrap().len(), 0);

        // get policy as validator: this should fail, because validator is not a beneficiary
        let policy_response =
            get_policy_as_beneficiary_impl(added_policy.id().clone(), validator.to_string());
        assert!(
            policy_response.is_err_and(|e| matches!(e, SmartVaultErr::NoPolicyForBeneficiary(_)))
        );

        // UPDATE POLICY NAME and BENEFICIARIES
        let mut beneficiaries = HashSet::new();
        beneficiaries.insert(beneficiary.to_string());
        beneficiaries.insert(validator.to_string());

        let update_conditions: Vec<UpdateCondition> = added_policy
            .conditions
            .iter()
            .map(|condition| match condition {
                Condition::LastLogin(last_login) => {
                    UpdateCondition::LastLogin(UpdateLastLoginTimeCondition {
                        id: last_login.id.clone(),
                        number_of_days_since_last_login: last_login.number_of_days_since_last_login,
                    })
                }
                Condition::XOutOfY(x_out_of_y) => {
                    UpdateCondition::XOutOfY(UpdateXOutOfYCondition {
                        id: x_out_of_y.id.clone(),
                        validators: x_out_of_y.validators.clone(),
                        question: x_out_of_y.question.clone(),
                        quorum: x_out_of_y.quorum,
                    })
                }
                Condition::FixedDateTime(fixed_date_time) => {
                    UpdateCondition::FixedDateTime(UpdateFixedDateTimeCondition {
                        id: fixed_date_time.id.clone(),
                        time: fixed_date_time.time,
                    })
                }
            })
            .collect();

        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: added_policy.id().to_string(),
            name: Some("new policy updates".to_string()),
            beneficiaries,
            secrets: added_policy.secrets.clone(),
            key_box: added_policy.key_box.clone(),
            conditions_logical_operator: added_policy.conditions_logical_operator().clone(),
            conditions: update_conditions,
        };

        let updated_policy = update_policy_impl(upa.clone(), principal.to_string()).await;
        assert!(updated_policy.is_ok());
        let updated_policy = updated_policy.unwrap();
        assert_eq!(updated_policy.name(), &upa.name);
        assert!(updated_policy
            .beneficiaries()
            .contains(&validator.to_string()));
        assert!(updated_policy
            .beneficiaries()
            .contains(&beneficiary.to_string()));

        // UPDATE POLICY CONDITIONS
        let last_login_time_condition: UpdateCondition =
            UpdateCondition::LastLogin(UpdateLastLoginTimeCondition {
                id: "My Time Based Condition number two".to_string(),
                number_of_days_since_last_login: 100,
            });

        let x_out_of_y_condition: UpdateCondition =
            UpdateCondition::XOutOfY(UpdateXOutOfYCondition {
                id: "My X out of Y Condition".to_string(),
                validators: vec![Validator {
                    principal_id: validator2.to_string(),
                    status: false,
                }],
                quorum: 1,
                question: "Do I live on the moon?".to_string(),
            });

        let mut beneficiaries = HashSet::new();
        beneficiaries.insert(validator.to_string());
        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: updated_policy.id().to_string(),
            name: updated_policy.name,
            beneficiaries: updated_policy.beneficiaries,
            secrets: updated_policy.secrets,
            key_box: updated_policy.key_box,
            conditions_logical_operator: added_policy.conditions_logical_operator().clone(),
            conditions: vec![last_login_time_condition, x_out_of_y_condition],
        };

        let updated_policy = update_policy_impl(upa, principal.to_string()).await;
        assert!(updated_policy.is_ok());
        // let updated_policy = updated_policy.unwrap();
        let policy_list_as_old_validator = get_policy_list_as_validator_impl(validator.to_string());
        let policy_list_as_new_validator =
            get_policy_list_as_validator_impl(validator2.to_string());
        assert_eq!(policy_list_as_old_validator.unwrap().len(), 0);
        assert_eq!(policy_list_as_new_validator.unwrap().len(), 1);
        let updated_policy = updated_policy.unwrap();

        // test get secret as beneficiary

        // this should return an error, because the policy has not been activated
        let secret_as_beneficiary = get_secret_as_beneficiary_impl(
            added_secret.id().to_string(),
            updated_policy.id,
            beneficiary.to_string(),
        );
        assert!(secret_as_beneficiary
            .is_err_and(|e| matches!(e, SmartVaultErr::InvalidPolicyCondition)));
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

    fn create_last_login_time_condition() -> UpdateCondition {
        let last_login_time_condition: UpdateCondition =
            UpdateCondition::LastLogin(UpdateLastLoginTimeCondition {
                id: "My Time Based Condition".to_string(),
                number_of_days_since_last_login: 0,
            });
        last_login_time_condition
    }

    fn create_x_oo_y_condition(validator_id: String) -> UpdateCondition {
        let x_out_of_y_condition: UpdateCondition =
            UpdateCondition::XOutOfY(UpdateXOutOfYCondition {
                id: "My X out of Y Condition".to_string(),
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

        dbg!(&added_policy);

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
}
