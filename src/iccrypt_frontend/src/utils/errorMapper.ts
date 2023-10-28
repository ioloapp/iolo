import {ICCryptError} from "../error/Errors";

export function mapError(input: Error): ICCryptError{
    console.log('error', input);
    if(input) {
        if (input.hasOwnProperty('UserAlreadyExists')) {
            throw new ICCryptError(input['UserAlreadyExists'])
        } else if (input.hasOwnProperty('UserDoesNotExist')) {
            throw new ICCryptError(input['UserDoesNotExist'])
        } else if (input.hasOwnProperty('UserDeletionFailed')) {
            throw new ICCryptError(input['UserDeletionFailed'])
        } else if (input.hasOwnProperty('UserVaultCreationFailed')) {
            throw new ICCryptError(input['UserVaultCreationFailed'])
        } else if (input.hasOwnProperty('UserVaultDoesNotExist')) {
            throw new ICCryptError(input['UserVaultDoesNotExist'])
        } else if (input.hasOwnProperty('SecretDoesNotExist')) {
            throw new ICCryptError(input['SecretDoesNotExist'])
        } else if (input.hasOwnProperty('SecretHasNoId')) {
            throw new ICCryptError(input['SecretHasNoId'])
        } else if (input.hasOwnProperty('SecretAlreadyExists')) {
            throw new ICCryptError(input['SecretAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentAlreadyExists')) {
            throw new ICCryptError(input['TestamentAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentDoesNotExist')) {
            throw new ICCryptError(input['TestamentDoesNotExist'])
        }  else if (input.hasOwnProperty('InvalidTestamentCondition')) {
            throw new ICCryptError(input.message)
        }  else if (input.hasOwnProperty('NoTestamentsForHeir')) {
            throw new ICCryptError(input['NoTestamentsForHeir'])
        }  else if (input.name ===  'KeyGenerationNotAllowed') {
            throw new ICCryptError(input.message);
        } else if (input.name === 'PrincipalCreationFailed') {
            // Frontend error, not from backend
            throw new ICCryptError(input.message);
        }
        throw input;
    }
    throw new ICCryptError('A unknown error occurred');
}
