import {RootState} from "../store";

export const selectPolicies = (state: RootState)  => state.policies.policyList;

export const selectBeneficiaryPolicies = (state: RootState)  => state.policies.policyBeneficiaryList;

export const selectValidatorPolicies = (state: RootState)  => state.policies.policyValidatorList;

export const selectPolicyListState = (state: RootState)  => state.policies.loadingState;

export const selectShowAddPolicyDialog = (state: RootState)  => state.policies.showAddDialog;

export const selectShowViewPolicyDialog = (state: RootState)  => state.policies.showViewDialog;

export const selectShowEditPolicyDialog = (state: RootState)  => state.policies.showEditDialog;

export const selectShowDeletePolicyDialog = (state: RootState)  => state.policies.showDeleteDialog;

export const selectPolicyDialogItem  = (state: RootState)  => state.policies.dialogItem;

export const selectPolicyError = (state: RootState)  => state.policies.error;

export const selectPolicyDialogItemState = (state: RootState)  => state.policies.dialogItemState;
