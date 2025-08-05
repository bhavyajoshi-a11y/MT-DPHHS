public with sharing class ExactSearchController {
    
    /**
     * Performs exact search on records based on provided criteria
     * @param searchParams Map containing search parameters
     * @return List of matching records
     */
    @AuraEnabled(cacheable=false)
    public static List<Contact> searchRecords(Map<String, Object> searchParams) {
        try {
            String lastName = (String) searchParams.get('lastName');
            String dateOfBirth = (String) searchParams.get('dateOfBirth');
            String email = (String) searchParams.get('email');
            String ssn = (String) searchParams.get('ssn');
            
            // Validate required parameters
            if (String.isBlank(lastName) || String.isBlank(dateOfBirth)) {
                throw new AuraHandledException('Last Name and Date of Birth are required');
            }
            
            if (String.isBlank(email) && String.isBlank(ssn)) {
                throw new AuraHandledException('Either Email or SSN must be provided');
            }
            
            // Build dynamic SOQL query with exact match criteria
            String query = buildExactSearchQuery(lastName, dateOfBirth, email, ssn);
            
            // Execute the query
            List<Contact> results = Database.query(query);
            
            return results;
            
        } catch (Exception e) {
            System.debug('Error in searchRecords: ' + e.getMessage());
            throw new AuraHandledException('Search failed: ' + e.getMessage());
        }
    }
    
    /**
     * Builds the SOQL query with exact match criteria
     * @param lastName Last name for exact match
     * @param dateOfBirth Date of birth for exact match
     * @param email Email for exact match (optional)
     * @param ssn SSN for exact match (optional)
     * @return String SOQL query
     */
    private static String buildExactSearchQuery(String lastName, String dateOfBirth, String email, String ssn) {
        List<String> conditions = new List<String>();
        
        // Base query
        String query = 'SELECT Id, FirstName, LastName, Email, Date_of_Birth__c, SSN__c FROM Contact WHERE ';
        
        // Add exact match conditions
        conditions.add('LastName = :lastName');
        conditions.add('Date_of_Birth__c = :dateOfBirth');
        
        // Add email or SSN condition (one will be provided)
        if (String.isNotBlank(email)) {
            conditions.add('Email = :email');
        }
        
        if (String.isNotBlank(ssn)) {
            conditions.add('SSN__c = :ssn');
        }
        
        // Combine conditions
        query += String.join(conditions, ' AND ');
        
        // Add ordering and limits for performance
        query += ' ORDER BY LastName, FirstName LIMIT 100';
        
        System.debug('Generated Query: ' + query);
        return query;
    }
    
    /**
     * Alternative method using Database.query with bind variables for security
     */
    @AuraEnabled(cacheable=false)
    public static List<Contact> searchRecordsSecure(String lastName, String dateOfBirth, String email, String ssn) {
        try {
            // Validate required parameters
            if (String.isBlank(lastName) || String.isBlank(dateOfBirth)) {
                throw new AuraHandledException('Last Name and Date of Birth are required');
            }
            
            if (String.isBlank(email) && String.isBlank(ssn)) {
                throw new AuraHandledException('Either Email or SSN must be provided');
            }
            
            // Convert dateOfBirth string to Date
            Date dobDate = Date.valueOf(dateOfBirth);
            
            List<Contact> results = new List<Contact>();
            
            // Search with email if provided
            if (String.isNotBlank(email)) {
                results = [
                    SELECT Id, FirstName, LastName, Email, Date_of_Birth__c, SSN__c 
                    FROM Contact 
                    WHERE LastName = :lastName 
                    AND Date_of_Birth__c = :dobDate 
                    AND Email = :email
                    ORDER BY LastName, FirstName 
                    LIMIT 100
                ];
            }
            // Search with SSN if provided
            else if (String.isNotBlank(ssn)) {
                results = [
                    SELECT Id, FirstName, LastName, Email, Date_of_Birth__c, SSN__c 
                    FROM Contact 
                    WHERE LastName = :lastName 
                    AND Date_of_Birth__c = :dobDate 
                    AND SSN__c = :ssn
                    ORDER BY LastName, FirstName 
                    LIMIT 100
                ];
            }
            
            return results;
            
        } catch (Exception e) {
            System.debug('Error in searchRecordsSecure: ' + e.getMessage());
            throw new AuraHandledException('Search failed: ' + e.getMessage());
        }
    }
    
    /**
     * Test method to validate search functionality
     */
    @TestVisible
    private static void validateSearchCriteria(String lastName, String dateOfBirth, String email, String ssn) {
        if (String.isBlank(lastName)) {
            throw new AuraHandledException('Last Name is required');
        }
        
        if (String.isBlank(dateOfBirth)) {
            throw new AuraHandledException('Date of Birth is required');
        }
        
        if (String.isBlank(email) && String.isBlank(ssn)) {
            throw new AuraHandledException('Either Email or SSN must be provided');
        }
        
        // Validate date format
        try {
            Date.valueOf(dateOfBirth);
        } catch (Exception e) {
            throw new AuraHandledException('Invalid date format for Date of Birth');
        }
        
        // Validate email format if provided
        if (String.isNotBlank(email)) {
            Pattern emailPattern = Pattern.compile('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
            if (!emailPattern.matcher(email).matches()) {
                throw new AuraHandledException('Invalid email format');
            }
        }
        
        // Validate SSN format if provided (assuming XXX-XX-XXXX format)
        if (String.isNotBlank(ssn)) {
            Pattern ssnPattern = Pattern.compile('^\\d{3}-?\\d{2}-?\\d{4}$');
            if (!ssnPattern.matcher(ssn).matches()) {
                throw new AuraHandledException('Invalid SSN format');
            }
        }
    }
}