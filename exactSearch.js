import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import searchRecords from '@salesforce/apex/ExactSearchController.searchRecords';

export default class ExactSearch extends LightningElement {
    @track lastName = '';
    @track dateOfBirth = '';
    @track email = '';
    @track ssn = '';
    @track searchResults = [];
    @track isLoading = false;
    @track errorMessage = '';
    @track sortedBy = '';
    @track sortedDirection = 'asc';

    // Define columns for the data table
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
            type: 'date-local',
            sortable: true
        },
        {
            label: 'Email Address',
            fieldName: 'email',
            type: 'email',
            sortable: true
        },
        {
            label: 'SSN',
            fieldName: 'maskedSSN',
            type: 'text',
            sortable: true
        }
    ];

    // Computed properties
    get isSearchDisabled() {
        return !this.lastName || !this.dateOfBirth || (!this.email && !this.ssn);
    }

    get showResults() {
        return this.searchResults && this.searchResults.length > 0;
    }

    get showNoResults() {
        return !this.isLoading && this.searchResults && this.searchResults.length === 0 && this.hasSearched;
    }

    get showSearchInfo() {
        return this.hasSearched && (this.lastName || this.dateOfBirth || this.email || this.ssn);
    }

    get formattedDob() {
        if (this.dateOfBirth) {
            const date = new Date(this.dateOfBirth);
            return date.toLocaleDateString();
        }
        return '';
    }

    get maskedSsn() {
        if (this.ssn && this.ssn.length >= 4) {
            const lastFour = this.ssn.slice(-4);
            return `***-**-${lastFour}`;
        }
        return this.ssn;
    }

    hasSearched = false;

    // Event handlers
    handleLastNameChange(event) {
        this.lastName = event.target.value;
        this.clearResults();
    }

    handleDobChange(event) {
        this.dateOfBirth = event.target.value;
        this.clearResults();
    }

    handleEmailChange(event) {
        this.email = event.target.value;
        this.clearResults();
        // Clear SSN when email is entered
        if (this.email) {
            this.ssn = '';
        }
    }

    handleSsnChange(event) {
        this.ssn = event.target.value;
        this.clearResults();
        // Clear email when SSN is entered
        if (this.ssn) {
            this.email = '';
        }
    }

    handleSearch() {
        // Validate required fields
        if (!this.lastName || !this.dateOfBirth) {
            this.showToast('Error', 'Last Name and Date of Birth are required', 'error');
            return;
        }

        if (!this.email && !this.ssn) {
            this.showToast('Error', 'Either Email or SSN must be provided', 'error');
            return;
        }

        this.performSearch();
    }

    handleClear() {
        this.lastName = '';
        this.dateOfBirth = '';
        this.email = '';
        this.ssn = '';
        this.clearResults();
        this.hasSearched = false;
    }

    handleSort(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortData();
    }

    // Search functionality
    async performSearch() {
        this.isLoading = true;
        this.errorMessage = '';
        this.hasSearched = true;

        try {
            const searchParams = {
                lastName: this.lastName,
                dateOfBirth: this.dateOfBirth,
                email: this.email || null,
                ssn: this.ssn || null
            };

            const result = await searchRecords(searchParams);
            
            // Process the results to format data for display
            this.searchResults = result.map(record => {
                return {
                    Id: record.Id,
                    fullName: `${record.FirstName || ''} ${record.LastName || ''}`.trim(),
                    dateOfBirth: record.Date_of_Birth__c,
                    email: record.Email,
                    maskedSSN: this.maskSSN(record.SSN__c)
                };
            });

            if (this.searchResults.length === 0) {
                this.showToast('No Results', 'No records found matching the search criteria', 'warning');
            } else {
                this.showToast('Success', `${this.searchResults.length} record(s) found`, 'success');
            }

        } catch (error) {
            this.errorMessage = error.body?.message || 'An error occurred while searching';
            this.searchResults = [];
            this.showToast('Error', this.errorMessage, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Helper methods
    clearResults() {
        this.searchResults = [];
        this.errorMessage = '';
    }

    maskSSN(ssn) {
        if (!ssn) return '';
        
        // Remove any non-digit characters
        const cleanSSN = ssn.replace(/\D/g, '');
        
        if (cleanSSN.length >= 4) {
            const lastFour = cleanSSN.slice(-4);
            return `***-**-${lastFour}`;
        }
        
        return '***-**-****';
    }

    sortData() {
        const cloneData = [...this.searchResults];
        
        cloneData.sort((a, b) => {
            let aVal = a[this.sortedBy] || '';
            let bVal = b[this.sortedBy] || '';
            
            // Handle date fields
            if (this.sortedBy === 'dateOfBirth') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (this.sortedDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        this.searchResults = cloneData;
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}