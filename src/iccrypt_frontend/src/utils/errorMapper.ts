import {ICCryptError} from "../error/Errors";

export function mapError(input: Error): ICCryptError{
    console.log('error', input);
    if(input) {
        if (input.hasOwnProperty('UserAlreadyExists')) {
            throw new ICCryptError(input['UserAlreadyExists'])
        } else if (input.hasOwnProperty('SecretHasNoId')) {
            throw new ICCryptError(input['SecretHasNoId'])
        } else if (input.hasOwnProperty('SecretDoesAlreadyExist')) {
            throw new ICCryptError(input['SecretDoesAlreadyExist'])
        } else if (input.hasOwnProperty('UserDeletionFailed')) {
            throw new ICCryptError(input['UserDeletionFailed'])
        } else if (input.hasOwnProperty('SecretDoesNotExist')) {
            throw new ICCryptError(input['SecretDoesNotExist'])
        } else if (input.hasOwnProperty('UserVaultCreationFailed')) {
            throw new ICCryptError(input['UserVaultCreationFailed'])
        } else if (input.hasOwnProperty('UserDoesNotExist')) {
            throw new ICCryptError(input['UserDoesNotExist'])
        } else if (input.hasOwnProperty('UserVaultDoesNotExist')) {
            throw new ICCryptError(input['UserVaultDoesNotExist'])
        } else if (input.name === 'PrincipalCreationFailed') {
            throw new ICCryptError(input.name);
        }
        throw input;
    }
    throw new ICCryptError('A unknown error occurred');
}
