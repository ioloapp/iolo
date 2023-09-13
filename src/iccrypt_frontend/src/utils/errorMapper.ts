import {SmartVaultErr} from "../../../declarations/iccrypt_backend/iccrypt_backend.did";
import {ICCryptError} from "../error/Errors";

export function mapError(input: SmartVaultErr): ICCryptError{
    if(input['UserAlreadyExists']){
        throw new ICCryptError(input['UserAlreadyExists'])
    } else if(input['SecretHasNoId']){
        throw new ICCryptError(input['SecretHasNoId'])
    } else if(input['SecretDoesAlreadyExist']){
        throw new ICCryptError(input['SecretDoesAlreadyExist'])
    } else if(input['UserDeletionFailed']){
        throw new ICCryptError(input['UserDeletionFailed'])
    } else if(input['SecretDoesNotExist']){
        throw new ICCryptError(input['SecretDoesNotExist'])
    } else if(input['UserVaultCreationFailed']){
        throw new ICCryptError(input['UserVaultCreationFailed'])
    } else if(input['UserDoesNotExist']){
        throw new ICCryptError(input['UserDoesNotExist'])
    } else if(input['UserVaultDoesNotExist']){
        throw new ICCryptError(input['UserVaultDoesNotExist'])
    }
    throw new ICCryptError('Unknown Error Type');
}
