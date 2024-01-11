import {IoloError} from "../error/Errors";

export function mapError(input: Error): IoloError{
    console.error('error', input);
    if(input) {
        if (input.hasOwnProperty('UserAlreadyExists')) {
            throw new IoloError(input['UserAlreadyExists'])
        } else if (input.hasOwnProperty('UserDoesNotExist')) {
            throw new IoloError(input['UserDoesNotExist'])
        } else if (input.hasOwnProperty('UserDeletionFailed')) {
            throw new IoloError(input['UserDeletionFailed'])
        } else if (input.hasOwnProperty('UserVaultCreationFailed')) {
            throw new IoloError(input['UserVaultCreationFailed'])
        } else if (input.hasOwnProperty('UserVaultDoesNotExist')) {
            throw new IoloError(input['UserVaultDoesNotExist'])
        } else if (input.hasOwnProperty('SecretDoesNotExist')) {
            throw new IoloError(input['SecretDoesNotExist'])
        } else if (input.hasOwnProperty('SecretHasNoId')) {
            throw new IoloError(input['SecretHasNoId'])
        } else if (input.hasOwnProperty('SecretAlreadyExists')) {
            throw new IoloError(input['SecretAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentAlreadyExists')) {
            throw new IoloError(input['TestamentAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentDoesNotExist')) {
            throw new IoloError(input['TestamentDoesNotExist'])
        }  else if (input.hasOwnProperty('InvalidTestamentCondition')) {
            throw new IoloError(input.message)
        }  else if (input.hasOwnProperty('Unauthorized')) {
            throw new IoloError(input['Unauthorized'])
        } else if (input.hasOwnProperty('NoTestamentsForHeir')) {
            throw new IoloError(input['NoTestamentsForHeir'])
        }  else if (input.name ===  'KeyGenerationNotAllowed') {
            throw new IoloError(input.message);
        } else if (input.name === 'PrincipalCreationFailed') {
            // Frontend error, not from backend
            throw new IoloError(input.message);
        }
        throw input;
    }
    throw new IoloError('A unknown error occurred');
}
