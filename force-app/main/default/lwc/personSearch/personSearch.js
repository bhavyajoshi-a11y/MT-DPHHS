import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import searchPersons from '@salesforce/apex/PersonSearchController.searchPersons';

export default class PersonSearch extends LightningElement {
    @track searchCriteria = {
        lastName: '',
        dateOfBirth: '',
        emailOrSSN: ''
    };
    
    @track searchResults = [];
    @track isLoading = false;
    @track hasResults = false;
    @track showNoResults = false;
    
    // Column definitions for data table
    columns = [
        { label: 'Full Name', fieldName: 'fullName', type: 'text' },
        { label: 'Date of Birth', fieldName: 'dateOfBirth', type: 'date' },
        { label: 'Email Address', fieldName: 'emailAddress', type: 'email' },
        { label: 'SSN', fieldName: 'maskedSSN', type: 'text' }
    ];
    
    // Handle input changes
    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        
        this.searchCriteria = {
            ...this.searchCriteria,
            [field]: value
        };
        
        console.log(`Field ${field} updated to: ${value}`);
    }
    
    // Handle search button click
    handleSearch() {
        console.log('Search initiated with criteria:', this.searchCriteria);
        
        // Validate required fields
        if (!this.validateInputs()) {
            return;
        }
        
        this.performSearch();
    }
    
    // Validate required inputs
    validateInputs() {
        const { lastName, dateOfBirth, emailOrSSN } = this.searchCriteria;
        
        if (!lastName || !lastName.trim()) {
            this.showToast('Error', 'Last Name is required', 'error');
            return false;
        }
        
        if (!dateOfBirth) {
            this.showToast('Error', 'Date of Birth is required', 'error');
            return false;
        }
        
        if (!emailOrSSN || !emailOrSSN.trim()) {
            this.showToast('Error', 'Email or SSN is required', 'error');
            return false;
        }
        
        // Basic email/SSN validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailPattern.test(emailOrSSN);
        const isSSN = /^\d{3}-?\d{2}-?\d{4}$/.test(emailOrSSN.replace(/\s/g, ''));
        
        if (!isEmail && !isSSN) {
            this.showToast('Error', 'Please enter a valid email address or SSN format (XXX-XX-XXXX)', 'error');
            return false;
        }
        
        return true;
    }
    
    // Perform the actual search
    async performSearch() {
        this.isLoading = true;
        this.searchResults = [];
        this.hasResults = false;
        this.showNoResults = false;
        
        try {
            console.log('Calling Apex method with parameters:', {
                lastName: this.searchCriteria.lastName,
                dateOfBirth: this.searchCriteria.dateOfBirth,
                emailOrSSN: this.searchCriteria.emailOrSSN
            });
            
            const result = await searchPersons({
                lastName: this.searchCriteria.lastName.trim(),
                dateOfBirth: this.searchCriteria.dateOfBirth,
                emailOrSSN: this.searchCriteria.emailOrSSN.trim()
            });
            
            console.log('Apex method result:', result);
            
            if (result.isSuccess) {
                if (result.persons && result.persons.length > 0) {
                    this.searchResults = result.persons;
                    this.hasResults = true;
                    this.showNoResults = false;
                    
                    this.showToast('Success', `Found ${result.persons.length} matching record(s)`, 'success');
                } else {
                    this.hasResults = false;
                    this.showNoResults = true;
                    this.showToast('Info', 'No records found matching your search criteria', 'info');
                }
            } else {
                console.error('Search failed:', result.errorMessage);
                this.showToast('Error', result.errorMessage || 'Search failed. Please try again.', 'error');
                this.hasResults = false;
                this.showNoResults = false;
            }
            
        } catch (error) {
            console.error('Error during search:', error);
            
            // Enhanced error logging for community portal debugging
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                body: error.body
            });
            
            let errorMessage = 'An unexpected error occurred. Please contact support.';
            
            if (error.body && error.body.message) {
                errorMessage = error.body.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showToast('Error', errorMessage, 'error');
            this.hasResults = false;
            this.showNoResults = false;
        } finally {
            this.isLoading = false;
        }
    }
    
    // Clear search results and form
    handleClear() {
        this.searchCriteria = {
            lastName: '',
            dateOfBirth: '',
            emailOrSSN: ''
        };
        
        this.searchResults = [];
        this.hasResults = false;
        this.showNoResults = false;
        
        console.log('Search form and results cleared');
    }
    
    // Show toast message
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    
    // Getter for search button disabled state
    get isSearchDisabled() {
        return this.isLoading || 
               !this.searchCriteria.lastName || 
               !this.searchCriteria.dateOfBirth || 
               !this.searchCriteria.emailOrSSN;
    }
}