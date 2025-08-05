public with sharing class PersonSearchController {
    
    public class PersonRecord {
        @AuraEnabled
        public String fullName { get; set; }
        @AuraEnabled
        public Date dateOfBirth { get; set; }
        @AuraEnabled
        public String emailAddress { get; set; }
        @AuraEnabled
        public String ssnLastFour { get; set; }
        
        public PersonRecord(String fullName, Date dob, String email, String ssn) {
            this.fullName = fullName;
            this.dateOfBirth = dob;
            this.emailAddress = email;
            this.ssnLastFour = maskSSN(ssn);
        }
        
        private String maskSSN(String ssn) {
            if (String.isBlank(ssn)) {
                return '';
            }
            // Remove any non-digit characters
            String cleanSSN = ssn.replaceAll('\\D', '');
            if (cleanSSN.length() >= 4) {
                return 'XXX-XX-' + cleanSSN.substring(cleanSSN.length() - 4);
            }
            return 'XXX-XX-XXXX';
        }
    }
    
    @AuraEnabled(cacheable=false)
    public static List<PersonRecord> searchPersons(String lastName, Date dateOfBirth, String email, String ssn) {
        try {
            List<PersonRecord> results = new List<PersonRecord>();
            
            // Validate inputs
            if (String.isBlank(lastName) || dateOfBirth == null) {
                throw new AuraHandledException('Please provide Last Name and Date of Birth');
            }
            
            if (String.isBlank(email) && String.isBlank(ssn)) {
                throw new AuraHandledException('Please provide either Email or SSN');
            }
            
            String query = 'SELECT Id, FirstName, LastName, Date_of_Birth__c, Email__c, SSN__c FROM Person__c WHERE LastName = :lastName AND Date_of_Birth__c = :dateOfBirth';
            
            // Build query based on provided fields
            if (!String.isBlank(email) && !String.isBlank(ssn)) {
                // Both email and SSN provided
                String cleanSSN = ssn.replaceAll('\\D', '');
                query += ' AND (Email__c = :email OR SSN__c = :cleanSSN)';
                ssn = cleanSSN;
            } else if (!String.isBlank(email)) {
                // Only email provided
                query += ' AND Email__c = :email';
            } else if (!String.isBlank(ssn)) {
                // Only SSN provided
                String cleanSSN = ssn.replaceAll('\\D', '');
                query += ' AND SSN__c = :cleanSSN';
                ssn = cleanSSN;
            }
            
            query += ' LIMIT 50';
            
            List<Person__c> persons = Database.query(query);
            
            for (Person__c person : persons) {
                String fullName = (person.FirstName != null ? person.FirstName + ' ' : '') + person.LastName;
                results.add(new PersonRecord(
                    fullName,
                    person.Date_of_Birth__c,
                    person.Email__c,
                    person.SSN__c
                ));
            }
            
            return results;
            
        } catch (Exception e) {
            System.debug('Error in searchPersons: ' + e.getMessage());
            throw new AuraHandledException('Search failed: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=false)
    public static List<PersonRecord> searchPersonsByEmail(String lastName, Date dateOfBirth, String email) {
        try {
            List<PersonRecord> results = new List<PersonRecord>();
            
            String query = 'SELECT Id, FirstName, LastName, Date_of_Birth__c, Email__c, SSN__c FROM Person__c WHERE LastName = :lastName AND Date_of_Birth__c = :dateOfBirth AND Email__c = :email LIMIT 50';
            
            List<Person__c> persons = Database.query(query);
            
            for (Person__c person : persons) {
                String fullName = (person.FirstName != null ? person.FirstName + ' ' : '') + person.LastName;
                results.add(new PersonRecord(
                    fullName,
                    person.Date_of_Birth__c,
                    person.Email__c,
                    person.SSN__c
                ));
            }
            
            return results;
            
        } catch (Exception e) {
            System.debug('Error in searchPersonsByEmail: ' + e.getMessage());
            throw new AuraHandledException('Search failed: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=false)
    public static List<PersonRecord> searchPersonsBySSN(String lastName, Date dateOfBirth, String ssn) {
        try {
            List<PersonRecord> results = new List<PersonRecord>();
            
            // Clean SSN - remove any formatting
            String cleanSSN = ssn.replaceAll('\\D', '');
            
            String query = 'SELECT Id, FirstName, LastName, Date_of_Birth__c, Email__c, SSN__c FROM Person__c WHERE LastName = :lastName AND Date_of_Birth__c = :dateOfBirth AND SSN__c = :cleanSSN LIMIT 50';
            
            List<Person__c> persons = Database.query(query);
            
            for (Person__c person : persons) {
                String fullName = (person.FirstName != null ? person.FirstName + ' ' : '') + person.LastName;
                results.add(new PersonRecord(
                    fullName,
                    person.Date_of_Birth__c,
                    person.Email__c,
                    person.SSN__c
                ));
            }
            
            return results;
            
        } catch (Exception e) {
            System.debug('Error in searchPersonsBySSN: ' + e.getMessage());
            throw new AuraHandledException('Search failed: ' + e.getMessage());
        }
    }
}