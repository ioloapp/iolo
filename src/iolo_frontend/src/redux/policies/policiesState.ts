import {UiPolicyListEntry, UiPolicyWithSecretListEntries} from "../../services/IoloTypesForUi";

export interface PoliciesState {
    policyList: UiPolicyListEntry[],
    policyBeneficiaryList: UiPolicyListEntry[],
    policyValidatorList: UiPolicyListEntry[],
    dialogItem: UiPolicyWithSecretListEntries
    dialogItemState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean;
    showViewDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: PoliciesState = {
    policyList: [],
    policyBeneficiaryList: [],
    policyValidatorList: [],
    dialogItem: {
        name: '',
        secrets: [],
        beneficiaries: [],
        conditionsStatus: false,
        conditionsLogicalOperator: null,
        conditions: []
    },
    dialogItemState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showViewDialog: false,
    showEditDialog: false,
    showDeleteDialog: false,
}
