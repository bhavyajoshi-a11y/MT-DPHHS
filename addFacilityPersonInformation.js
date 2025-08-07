/**
 * @description       : 
 * @author            : pranay
 * @group             : 
 * @last modified on  : 08-07-2025
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 * Modifications Log
 * Ver   Date         Author   Modification
 * 1.0   03-13-2025   pranay   Initial Version
**/
import { LightningElement, track, api, wire } from 'lwc';
import {
    validatePhoneNumberWithParenthesis, isInputValid, isNumberOnly, maskSSNNumber, getMinDateFor18YearsOld, wiredZipCodeCounties
} from "c/cc_Util";
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import CC_CONTACT_ROLE_RELATIONSHIP_OBJECT from "@salesforce/schema/CC_Contact_Role_Relationship__c";
import RACE_FIELD from "@salesforce/schema/CC_Contact_Role_Relationship__c.CC_Race_Origin__c";
import searchMembersDemographicInputs from '@salesforce/apex/CC_ApplicationController.searchMembersDemographicInputs';
//import SUFFIX_FIELD from "@salesforce/schema/Account.Suffix__c";
//import ACCOUNT from '@salesforce/schema/Account';
export default class AddFacilityPersonInformation extends LightningElement {
    @api currentUserDetails = {};
    @api personaType;
    @api countyPicklistOptions;
    @api zipCodeCountyMap = [];
    @api countriesToStates = {};
    @api countries = [];
    @api readOnly = false;
    @api savedPersonInformation;
    @api secName = '';
    raceOptionsValue = [];
    @track raceCheck =[];
    @track lastName = '';
    @track dateOfBirth = '';
    @track email = '';
    @track ssn = '';
    @track ownershipRecords = [];
    noRecordFound = false;
     //  suffixOptions = [];

      handleLastNameChange(event) {
        this.lastName = event.target.value;
    }

    handleDobChange(event) {
        this.dateOfBirth = event.target.value;
    }

    handleEmailChange(event) {
        this.email = event.target.value;
        //this.clearResults();
        // Clear SSN when email is entered
        // if (this.email) {
        //     this.ssn = '';
        // }
    }

    handleSsnChange(event) {
        this.ssn = event.target.value;
       // this.clearResults();
        // Clear email when SSN is entered
        // if (this.ssn) {
        //     this.email = '';
        // }
    }


    minDateForAge = getMinDateFor18YearsOld();
    @api returnFirstInvalidField() {
        const inputs = this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-input-address, lightning-radio-group, lightning-checkbox-group');
        for (const input of inputs) {
            if (!input.checkValidity()) { // checkValidity() just returns true/false without showing a message
                return input;
            }
        }
        return null;
    }
    @track personInformation = {
        mailingAddressSame : false,
        physicalAddress : {state:'', city:'',street:'',zip:'',country:'US', aptSuite:'', county:''},
        mailingAddress : {state:'', city:'',street:'',zip:'',country:'US', aptSuite:'', county:''},
        race: '',
        savedPersonType : [],
        dateOfBirth: '',
        hasPortalAccess: false
    };

   @api 
    get _personInformation() {
        return this.personInformation;
    }

    @wire(getObjectInfo, { objectApiName: CC_CONTACT_ROLE_RELATIONSHIP_OBJECT })
    objectInfo;
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: RACE_FIELD
    })
    wiredRacePicklist({ data, error }) {
        if (data) {
            this.raceOptionsValue = data.values.map(row => ({
                label: row.label,
                value: row.value
            }));
        }
        if (error) {
            console.error("Error fetching Race picklist values:", error);
        }
    }
     /*  @wire(getObjectInfo, { objectApiName: ACCOUNT })
    accountInfo;
    @wire(getPicklistValues, {
    recordTypeId: "$accountInfo.data.defaultRecordTypeId",
    fieldApiName: SUFFIX_FIELD
    })
    wiredSuffixPicklist({ data, error }) {
        if (data) {
            this.suffixOptions = data.values.map(row => ({
                label: row.label,
                value: row.value
            }));
        }
        if (error) {
            console.error("Error fetching Suffix picklist values:", error);
        }
    }*/

    

//     @track emailType = this.secName + 'emailType';
//    @track phoneType = this.secName  + 'phoneType';
//    @track altPhoneType = this.secName + 'altPhoneType';
    async connectedCallback() {
        // setTimeout(() => {
            if(this.readOnly) {
                this.disableAllFields = true;
                this.disableFields = true;
                this.personInformation = JSON.parse(JSON.stringify(this.savedPersonInformation));
                if(this.personInformation.mailingAddressSame) {
                    // this.showMailingAddress = false;
                }
                if(this.personInformation.race){
                    this.raceCheck = this.personInformation.race ? this.personInformation.race.split(';') : [] ;
                }
            }
            // const { zipCodeCountyMap, countyPicklistOptions } = await wiredZipCodeCounties();
            // this.countyPicklistOptions = countyPicklistOptions;
            // this.zipCodeCountyMap = zipCodeCountyMap;
        // }, 1000);      
    }
     handleSearch(event) {
        console.log('this.lastName',this.lastName,'this.dateOfBirth',this.dateOfBirth,'this.email',this.email,'this.ssn',this.ssn);
                                                         const searchParams = {
                                                                                   lastName: this.lastName,
                                                                                   dateOfBirth: this.dateOfBirth,
                                                                                   email: this.email || null,
                                                                                   ssn: this.ssn || null
                                                                               };
                                                                               console.log('searchParams ==> ',JSON.stringify(searchParams));
                              searchMembersDemographicInputs({ searchParams: searchParams }).then(res => {
                                console.log('res',res);
                                 this.ownershipRecords = Array.isArray(res) ? res : (res?.contactList || []);
                                     this.ownershipRecords.forEach(data => {
                             if (data.dateOfBirth) {
                                const [year, month, day] = data.dateOfBirth.split('-'); // Split the date into parts
                                data.formatedDob = `${month}/${day}/${year}`; // Rearrange into MM/DD/YYYY
                            } else {
                                data.formatedDob = null; // Handle null or empty date
                            }
                            data.isSelected = false;
                            data.maskedSSN = maskSSNNumber(data.ssn);
                        });
                        
                    }).catch(err => {
                        const message = err?.body?.message || err?.message || err || 'Unknown error';
                        this.dispatchEvent(new ShowToastEvent({ title: 'Error', message, variant: 'error' }));
                        // Also log for debugging
                        // eslint-disable-next-line no-console
                        console.error('Search error:', err);
                    }).finally(() => {
                       // this.showSpinner = false;
                        this.noRecordFound = (this.ownershipRecords?.length || 0) === 0;
                    });
     }

    handleChange(event) {
        let eventName = event.currentTarget.name;
        let eventValue = event.currentTarget.value;
        let dataName = event.target.dataset.name;
        if(dataName && (dataName.includes("emailType") || dataName.includes("phoneType") || dataName.includes("altPhoneType"))){
            this.personInformation[dataName] = eventValue;
        }
        else if(eventName == 'phone' || eventName == 'altPhone') {
            // const inputField = event.target;
            // const { validatedPhoneNo, isPhoneNumberValid } = validatePhoneNumberWithParenthesis(event.target.value);
            // event.target.value = validatedPhoneNo;
            // this.personInformation[event.target.name] =  event.target.value;
            // const inputField = event.target;
            const { validatedPhoneNo, isPhoneNumberValid } = validatePhoneNumberWithParenthesis(event.target.value);

            // Manually set the field's validity
            // if (isPhoneNumberValid) {
            //     inputField.setCustomValidity(''); // Clear any existing error message
            // } else {
            //     // Set an error message only if the field isn't empty.
            //     // The `required` attribute will handle the error for an empty field.
            //     if (inputField.value) {
            //         inputField.setCustomValidity('Please enter a valid phone number format, like (123) 456-7890.');
            //     } else {
            //         inputField.setCustomValidity(''); 
            //     }
            // }
            // inputField.reportValidity(); // Show or hide the error message immediately

            event.target.value = validatedPhoneNo;
            this.personInformation[event.target.name] =  event.target.value;
        }else if(eventName == 'ssn') {
            let dataId = event.currentTarget.dataset.id;
            const ssnInput = this.template.querySelector('[data-id="' + dataId + '"]');
            let inputLength = event.currentTarget.value.length;
            this.tempSSN = eventValue;
            if (inputLength === 0) {
                this.personInformation.ssn = eventValue;
            }
            if (inputLength === 9) {
                ssnInput.setCustomValidity("");
                event.target.value = maskSSNNumber(eventValue);
                this.personInformation.decryptedSsn = eventValue;
            } else if (inputLength > 0 && inputLength < 9) {
                ssnInput.setCustomValidity("Please enter a valid SSN number.");
            } else if (inputLength === 10) {
                ssnInput.setCustomValidity("Please enter a valid SSN number.");
                //this.personInformation.decryptedSsn = this.tempSSN.slice(0, -1);
                event.target.value = this.personInformation.decryptedSsn.slice(0, -1);
            } else {
                ssnInput.setCustomValidity("");
            }
            ssnInput.reportValidity();
        }
        else if(event.target.type == 'checkbox') {
            this.personInformation[event.target.name] = event.target.checked;
        }
        else if (eventName === "race") {

            if (eventValue.includes("Prefer not to answer")) {
                this.personInformation[event.target.name] = "Prefer not to answer";
                event.target.value = "Prefer not to answer";
            }
            else{
                var RaceValue = eventValue.join(';');
                this.personInformation[event.target.name] = RaceValue;
            }
            
            //this.personalInformation.race = eventValue || []; // Ensure it's always an array
        } 

        else {
            this.personInformation[event.target.name] = event.target.value;
        }
        // if( eventName == 'ethnicity' ||  eventName == 'ssn'  ||  eventName == 'dateOfBirth' ||  eventName == 'gender' || eventName == 'race' || eventName == 'phone' || eventName == 'phoneType' || eventName == 'altPhone' || eventName == 'altPhoneType' ) {
            const inputEvent = new CustomEvent('inputchange', { detail: { personaType: this.personaType,personInformation : this.personInformation,  eventName : eventName ,eventValue : eventValue } });
            this.dispatchEvent(inputEvent);
        // }   

        if( this.personaType == 'Director' && ( eventName == 'firstName' || eventName == 'middleName' || eventName == 'lastName') ){
            const inputEvent = new CustomEvent('directornamechange', { detail: '' });
            this.dispatchEvent(inputEvent);

        }
        // else if(   eventName == 'race'  ){
        //     const inputEvent = new CustomEvent('inputchange', { detail: { personaType: this.personaType,personInformation : this.personInformation,  eventName : eventName ,eventValue : RaceValue } });
        //     this.dispatchEvent(inputEvent);
        // }
        
    }

    handleBillingAddress(event) {
        let addressDetails = event.detail;
        this.personInformation.physicalAddress = {
            ...this.personInformation.physicalAddress,
            state: addressDetails.province,
            city: addressDetails.city,
            street: addressDetails.street,
            zip: addressDetails.postalCode,
            country: "US"
        };
        let zipcode = addressDetails.postalCode;

        if (this.zipCodeCountyMap.hasOwnProperty(zipcode)) {
            this.personInformation.physicalAddress.county = this.zipCodeCountyMap[zipcode];
        }
        const postalcode = this.template.querySelector(
            "lightning-input-address[data-id=billingAddress]"
        );
        const patternForZipCode = /^\d{5}$/;
        if (!patternForZipCode.test(addressDetails.postalCode) && addressDetails.postalCode != '') {
            postalcode.setCustomValidityForField(
                "Please enter Zip Code in 5 digit number format.",
                "postalCode"
            );
        }
         else {
            postalcode.setCustomValidityForField("", "postalCode");
        }
        const inputEvent = new CustomEvent('inputchange', { detail: { personaType: this.personaType,personInformation : this.personInformation,  eventName : 'physicalAddress' ,eventValue : '' } });
        this.dispatchEvent(inputEvent);
    }

    handleMailingAddress(event) {
        let addressDetails = event.detail;
        this.personInformation.mailingAddress = {
            ...this.personInformation.mailingAddress,
            state: addressDetails.province,
            city: addressDetails.city,
            street: addressDetails.street,
            zip: addressDetails.postalCode,
            country: "US"
        };
        let zipcode = addressDetails.postalCode;

        if (this.zipCodeCountyMap.hasOwnProperty(zipcode)) {
            this.personInformation.mailingAddress.county = this.zipCodeCountyMap[zipcode];
        }
        const postalcode = this.template.querySelector(
            "lightning-input-address[data-id=mailingAddress]"
        );
        const patternForZipCode = /^\d{5}$/;
        if (!patternForZipCode.test(addressDetails.postalCode) && addressDetails.postalCode != '') {
            postalcode.setCustomValidityForField(
                "Please enter Zip Code in 5 digit number format.",
                "postalCode"
            );
        } else {
            postalcode.setCustomValidityForField("", "postalCode");
        }
        const inputEvent = new CustomEvent('inputchange', { detail: { personaType: this.personaType,personInformation : this.personInformation,  eventName : 'mailingAddress' ,eventValue : '' } });
        this.dispatchEvent(inputEvent);
    }

    handleMailingCountyApt(event) {
        this.personInformation.mailingAddress[event.target.name] = event.target.value;
        console.log('here in handleMailingCountyApt address')
        const inputEvent = new CustomEvent('inputchange', { detail: { personaType: this.personaType,personInformation : this.personInformation,  eventName : 'mailingAddress' ,eventValue : '' } });
        this.dispatchEvent(inputEvent);  
    }

    handleBillingCountyApt(event) {
        this.personInformation.physicalAddress[event.target.name] = event.target.value;
        console.log('here in handleBillingCountyApt address')
        const inputEvent = new CustomEvent('inputchange', { detail: { personaType: this.personaType,personInformation : this.personInformation,  eventName : 'physicalAddress' ,eventValue : '' } });
        this.dispatchEvent(inputEvent);   
    }

    // @track showMailingAddress = true;
    // get showMailingAddress( ){
    //         if( !this.personInformation.mailingAddressSame ){
    //             this.personInformation.mailingAddress = {};
    //         }
    //         return !this.personInformation.mailingAddressSame;
    // }

    handleMailingSame(event) {
        // this.showMailingAddress = !this.showMailingAddress;
        this.personInformation[event.target.name] = event.target.checked;
        this.personInformation.mailingAddress = {
            ...this.personInformation.physicalAddress
        };
        if(!this.personInformation[event.target.name]){
            this.personInformation.mailingAddress = {};
        }

        const inputEvent = new CustomEvent('inputchange', { detail: { personaType: this.personaType,personInformation : this.personInformation,  eventName : 'samemailing' ,eventValue : '' } });
        this.dispatchEvent(inputEvent);   
    }


    @track disableFields = false;
    @track disableAllFields = false;
    handleLoggedInUser(event) {
        if(event.target.name == "loggedInUser") {
            if(event.target.checked){
                this.personInformation = JSON.parse(JSON.stringify(this.currentUserDetails));
                if(this.personInformation.mailingAddressSame) {
                    // this.showMailingAddress = false;
                    this.personInformation.mailingAddress = {...this.personInformation.physicalAddress};
                }
                this.raceCheck = this.personInformation.race ? this.personInformation.race : [] ;
                this.disableFields = true;
                    this.disableAllFields = false;           
                
            }else {
                this.personInformation = {
                    physicalAddress : {state:'', city:'',street:'',zip:'',country:'US', aptSuite:'', county:'', other:''},
                    mailingAddress : {state:'', city:'',street:'',zip:'',country:'US', aptSuite:'', county:'', other:''}
                };
                this.disableFields = false;
                // this.showMailingAddress = false;
                this.raceCheck = [];
            }

        }
        if( this.personaType == 'Owner' ){
            const loggedinuserevent = new CustomEvent('loggedinuserchange', { detail: { personaType: this.personaType, isLoggedInUserOwner : event.target.checked, personInformation : this.personInformation } });
            this.dispatchEvent(loggedinuserevent);
        }
        else if(  this.personaType == 'Director' ){
            const loggedinuserevent = new CustomEvent('loggedinuserchange', { detail: { personaType: this.personaType,  isLoggedInUserDirector : event.target.checked,  personInformation : this.personInformation } });
            this.dispatchEvent(loggedinuserevent);
        } 
        else if( this.personaType == 'Co-owner'){
            const loggedinuserevent = new CustomEvent('loggedinuserchange', { detail: { personaType: this.personaType,  isLoggedInUserCoowner : event.target.checked,  personInformation : this.personInformation } });
            this.dispatchEvent(loggedinuserevent);
        }
 
        this.personInformation[event.target.name] = event.target.checked;

        if(event.target.checked){
            setTimeout(() => {
                const nameFields = this.template.querySelectorAll('.namefield');
                if( nameFields ){
                        nameFields.forEach( component => {
                        component.setCustomValidity("");
                        component.reportValidity();
                        })
                }
            
            }, 500);
        }
       
    }

    handleAccountSelection(event) {
        if( this.personaType == 'Director'  ){
            const inputEvent = new CustomEvent('directornamechange', { detail: '' });
            this.dispatchEvent(inputEvent);

        }
        let selectedAccount = event.detail;
        this.personInformation = JSON.parse(JSON.stringify(selectedAccount));
        //Added by Payal - check with Sai
        if( this.personInformation && this.personInformation.race && this.personInformation.race.includes(';') ){
            this.raceCheck = this.personInformation.race.split(';');
        }
        else{
            this.raceCheck = this.personInformation.race;
        }
        //end

        if(this.personInformation.mailingAddressSame) {

            // this.showMailingAddress = false;
            this.personInformation.mailingAddress = {...this.personInformation.physicalAddress};
        }
        this.disableFields = true;
        this.disableAllFields = true;
    }

    handleAccountRemove() {
        this.personInformation = {
            mailingAddressSame : false,
            physicalAddress : {state:'', city:'',street:'',zip:'',country:'US', aptSuite:'', county:''},
            mailingAddress : {state:'', city:'',street:'',zip:'',country:'US', aptSuite:'', county:''},
             hasPortalAccess: false
        };
        // this.showMailingAddress = true;
        this.disableFields = false;
        this.disableAllFields = false;
    }

    @api isInputValid() {
        // if(this.disableAllFields || this.disableFields) {
        //     //returning true if all fields are disabled
        //     return true;
        // }
        const allInputs = this.template.querySelectorAll(
        'lightning-input, lightning-combobox, lightning-radio-group, lightning-checkbox-group, lightning-input-address'
        );

        // Use the 'reduce' method to iterate over all inputs and check their validity.
        // 'validSoFar' carries the result of the previous check.
        // The final result is 'true' only if every single component is valid.
        const allValid = [...allInputs].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity(); // Show errors on all invalid fields
            return validSoFar && inputCmp.checkValidity();
        }, true);
        console.log('Child Validation Result:', allValid);
        
        // Return the final validation status.
        return allValid;
        // return isInputValid(this);
    }

    @api
    submit() {
        return new Promise((resolve, reject) => {
            try {
                resolve({personInformation : this.personInformation, componentType : this.personaType});
            }catch(error) {
                reject(error);
            }
        });
    }

    get disableOwnerSearch() {
        return this.personInformation.loggedInUser;
    }

    loggedInUserLabel = '';
    get showLoggedInUser() {
        // this.loggedInUserLabel = this.personaType == 'Director' ? 'Logged in User is the Director of the Facility' : 'Logged in User is the Owner of the Facility';
        // return this.personaType == 'Director' || this.personaType == 'Owner' ? true : false;
        if(this.personaType == 'Director'){
            this.loggedInUserLabel = 'Logged in User is the Director of the Facility';
        }else if(this.personaType == 'Owner'){
            this.loggedInUserLabel = 'Logged in User is the Owner of the Facility';
        }else if(this.personaType == 'Co-owner'){
            this.loggedInUserLabel = 'Logged in User is the Co-owner of the Facility';
        }
        return this.personaType == 'Director' || this.personaType == 'Owner' || this.personaType == 'Co-owner' ? true : false;
    }

    get isCoOwner() {
        return this.personaType == 'Co-owner';
    }
    get isDirector() {
        return this.personaType == 'Director';
    }

    get genderOptions() {
        return [
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
            { label: 'Denied Request', value: 'Denied Request' },
        ];
    }
    get suffixOptions() {
        return [
            { label: 'Esq.', value: 'Esq.' },
            { label: 'Jr.', value: 'Jr.' },
            { label: 'Sr.', value: 'Sr.' },
            { label: 'III', value: 'III' },
            { label: 'IV', value: 'IV' },
            { label: 'V', value: 'V' },
            { label: 'VI', value: 'VI' },
            { label: 'VII', value: 'VII' },
        ];
    }
    
    get ethnicityOptions() {
        return [
            { label: 'Unspecified', value: 'Unspecified' },
            { label: 'Hispanic or Latino', value: 'Hispanic or Latino' },
            { label: 'Not Hispanic or Latino', value: 'Not Hispanic or Latino' },
        ];
    }
    
    get raceOptions() {
        return [
            { label: 'American Indian or Alaska Native', value: 'American Indian or Alaska Native' },
            { label: 'Asian', value: 'Asian' },
            { label: 'Black or African American', value: 'Black or African American' },
            { label: 'Native Hawaiian or Other Pacific Islander', value: 'Native Hawaiian or Other Pacific Islander' },
            { label: 'White', value: 'White' },
            { label: 'Prefer not to answer', value: 'Prefer not to answer' },
        ];
    }

    get phoneTypeOptions() {
        return [
            { label: 'Cell', value: 'Cell' },
            { label: 'Home', value: 'Home' },
            { label: 'Work', value: 'Work' },
        ];
    }

    get emailTypeOptions() {
        return [
            { label: 'Business', value: 'Business' },
            { label: 'Personal', value: 'Personal' },
        ];
    }

    get countryPicklistValueOptions() {
        return this.countries || [];
    }

    get billingStatePicklistValueOptions() {
        return (this.countriesToStates && this.countriesToStates['US']) || [];
    }

    get mailingStatePicklistValueOptions() {
        return (this.countriesToStates && this.countriesToStates['US']) || [];
    }


    isNumberOnlyFromComp(event) {
        isNumberOnly(event);
    }

    @api
    handlePersonInformation(data) {
        try{
            this.personInformation = JSON.parse(JSON.stringify(data.personInformation));
            if(data.eventName == 'ssn') {   
                this.personInformation[data.eventName] = maskSSNNumber(data.eventValue);
            }
            if( data.eventName == 'race' && data.eventValue && data.eventValue != undefined ){
                this.raceCheck = data.eventValue ;

            }
        }
        catch(error) {
            console.log('Error in person info:', JSON.stringify(error));
            console.log('Error in person infob 123 :',error );
        }        
    }
    @api
    handleUpdateData(data) {
        try{
            this.personInformation = JSON.parse(JSON.stringify(data))
            this.personInformation['ssn'] = maskSSNNumber(data.decryptedSsn);
            if(data.race && data.race != undefined ){
                this.raceCheck = data.race.split(';');
            }

        }
        catch(error) {
            console.log('Error in handleUpdateData:', error);
        }        
    }
    
}
