import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import searchPersons from '@salesforce/apex/PersonSearchController.searchPersons';

export default class PersonSearch extends LightningElement {
    @track lastName = '';
    @track dateOfBirth = '';
    @track email = '';
    @track ssn = '';
    @track searchResults = [];
    @track errorMessage = '';
    @track isLoading = false;
    @track showResults = false;

    // Define columns for the datatable
    columns = [
        {
            label: 'Full Name',
            fieldName: 'fullName',
            type: 'text',
            sortable: true
        },
        {
            label: 'Date of Birth',
            fieldName: 'dateOfBirth',
            type: 'date',
            sortable: true
        },
        {
            label: 'Email Address',
            fieldName: 'emailAddress',
            type: 'email',
            sortable: true
        },
        {
            label: 'SSN',
            fieldName: 'ssnLastFour',
            type: 'text',
            sortable: false
        }
    ];

    // Getters for computed properties
    get isSearchDisabled() {
        return !this.lastName || !this.dateOfBirth || (!this.email && !this.ssn) || this.isLoading;
    }

    get hasResults() {
        return this.searchResults && this.searchResults.length > 0;
    }

    // Event handlers for input changes
    handleLastNameChange(event) {
        this.lastName = event.target.value;
        this.clearError();
    }

    handleDateOfBirthChange(event) {
        this.dateOfBirth = event.target.value;
        this.clearError();
    }

    handleEmailChange(event) {
        this.email = event.target.value;
        this.clearError();
    }

    handleSSNChange(event) {
        this.ssn = event.target.value;
        this.clearError();
    }

    // Search handler
    async handleSearch() {
        if (!this.validateInputs()) {
            return;
        }

        this.isLoading = true;
        this.clearError();
        this.showResults = false;

        try {
            const results = await searchPersons({
                lastName: this.lastName.trim(),
                dateOfBirth: this.dateOfBirth,
                email: this.email?.trim() || null,
                ssn: this.ssn?.trim() || null
            });

            this.searchResults = results || [];
            this.showResults = true;

            // Show success toast
            this.showToast(
                'Search Complete',
                `Found ${this.searchResults.length} record(s)`,
                'success'
            );

        } catch (error) {
            console.error('Search error:', error);
            this.errorMessage = error.body?.message || 'An error occurred during search. Please try again.';
            
            // Show error toast
            this.showToast(
                'Search Error',
                this.errorMessage,
                'error'
            );
        } finally {
            this.isLoading = false;
        }
    }

    // Clear form handler
    handleClear() {
        this.lastName = '';
        this.dateOfBirth = '';
        this.email = '';
        this.ssn = '';
        this.searchResults = [];
        this.errorMessage = '';
        this.showResults = false;
        this.isLoading = false;

        // Clear all input fields
        const inputs = this.template.querySelectorAll('lightning-input');
        inputs.forEach(input => {
            input.value = '';
        });

        this.showToast(
            'Form Cleared',
            'Search form has been reset',
            'info'
        );
    }

    // Validation method
    validateInputs() {
        let isValid = true;
        const inputs = this.template.querySelectorAll('lightning-input');
        
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
            }
        });

        if (!this.lastName?.trim()) {
            this.errorMessage = 'Last Name is required';
            isValid = false;
        } else if (!this.dateOfBirth) {
            this.errorMessage = 'Date of Birth is required';
            isValid = false;
        } else if (!this.email?.trim() && !this.ssn?.trim()) {
            this.errorMessage = 'Either Email Address or SSN is required';
            isValid = false;
        } else if (this.email?.trim() && !this.isValidEmail(this.email.trim())) {
            this.errorMessage = 'Please enter a valid email address';
            isValid = false;
        } else if (this.ssn?.trim() && !this.isValidSSN(this.ssn.trim())) {
            this.errorMessage = 'Please enter a valid SSN (9 digits)';
            isValid = false;
        }

        return isValid;
    }

    // Email validation helper
    isValidEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    // SSN validation helper
    isValidSSN(value) {
        // Check if it's a valid SSN (9 digits, with or without formatting)
        const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
        const cleanValue = value.replace(/\D/g, '');
        return ssnRegex.test(value) || cleanValue.length === 9;
    }

    // Clear error message
    clearError() {
        this.errorMessage = '';
    }

    // Show toast message
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: variant === 'error' ? 'sticky' : 'dismissable'
        });
        this.dispatchEvent(event);
    }
}