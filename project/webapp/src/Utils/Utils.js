import { isCommunicationUser, isPhoneNumber, isCallingApplication } from '@azure/communication-common';

export const utils = {
    getIdentifierText: (identifier) => {
        if (isCommunicationUser(identifier)) {
            return identifier.communicationUserId;
        } else if (isPhoneNumber(identifier)) {
            return identifier.phoneNumber;
        } else if(isCallingApplication(identifier)) {
            return identifier.callingApplicationId;
        } else {
            return 'Unknwon Identifier';
        }
    }
}
