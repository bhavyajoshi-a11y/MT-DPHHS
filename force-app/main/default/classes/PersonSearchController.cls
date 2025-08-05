/**
 * Controller for Person Search LWC Component
 * Handles exact match searches for person records in community portal
 */
public with sharing class PersonSearchController {
    
    /**
     * Search for persons based on provided criteria
     * @param lastName - Required last name for search
     * @param dateOfBirth - Date of birth for search
     * @param emailOrSSN - Either email or SSN for search
     * @return List of matching person records
     */
    @AuraEnabled(cacheable=false)
    public static SearchResult searchPersons(String lastName, Date dateOfBirth, String emailOrSSN) {
        // Enhanced logging using DebugLogHelper for community portal debugging
        DebugLogHelper.logUserContext('PersonSearchController', 'searchPersons');
        
        Map<String, Object> searchParams = new Map<String, Object>{
            'lastName' => lastName,
            'dateOfBirth' => dateOfBirth,
            'emailOrSSN' => emailOrSSN
        };
        DebugLogHelper.logInfo('PersonSearchController', 'searchPersons', 'Search initiated with parameters', searchParams);
        
        SearchResult result = new SearchResult();
        
        try {
            // Validate required parameters
            if (String.isBlank(lastName)) {
                DebugLogHelper.logError('PersonSearchController', 'searchPersons', 'Validation Error: Last Name is required');
                result.isSuccess = false;
                result.errorMessage = 'Last Name is required';
                return result;
            }
            
            if (dateOfBirth == null) {
                DebugLogHelper.logError('PersonSearchController', 'searchPersons', 'Validation Error: Date of Birth is required');
                result.isSuccess = false;
                result.errorMessage = 'Date of Birth is required';
                return result;
            }
            
            if (String.isBlank(emailOrSSN)) {
                DebugLogHelper.logError('PersonSearchController', 'searchPersons', 'Validation Error: Email or SSN is required');
                result.isSuccess = false;
                result.errorMessage = 'Email or SSN is required';
                return result;
            }
            
            // Build dynamic SOQL query for exact matches
            String soqlQuery = buildSOQLQuery(lastName, dateOfBirth, emailOrSSN);
            DebugLogHelper.logDebug('PersonSearchController', 'searchPersons', 'SOQL Query built', soqlQuery);
            
            // Execute query
            List<Person__c> persons = Database.query(soqlQuery);
            DebugLogHelper.logInfo('PersonSearchController', 'searchPersons', 'Query executed successfully. Results count: ' + persons.size());
            
            // Transform results for LWC consumption
            result.persons = transformPersonData(persons);
            result.isSuccess = true;
            
            DebugLogHelper.logInfo('PersonSearchController', 'searchPersons', 'Search completed successfully');
            
        } catch (Exception e) {
            DebugLogHelper.logError('PersonSearchController', 'searchPersons', 'Exception occurred during search', e);
            
            result.isSuccess = false;
            result.errorMessage = 'An error occurred while searching. Please contact administrator.';
            
            // Log detailed error for administrators
            createErrorLog(e, lastName, dateOfBirth, emailOrSSN);
        }
        
        return result;
    }
    
    /**
     * Build SOQL query based on provided search criteria
     */
    private static String buildSOQLQuery(String lastName, Date dateOfBirth, String emailOrSSN) {
        System.debug(LoggingLevel.ERROR, 'Building SOQL Query - START');
        
        String baseQuery = 'SELECT Id, FirstName__c, LastName__c, FullName__c, DateOfBirth__c, Email__c, SSN__c ' +
                          'FROM Person__c ' +
                          'WHERE LastName__c = :lastName ' +
                          'AND DateOfBirth__c = :dateOfBirth ';
        
        // Determine if searching by email or SSN
        if (emailOrSSN.contains('@')) {
            baseQuery += 'AND Email__c = :emailOrSSN';
            System.debug(LoggingLevel.ERROR, 'Search criteria: Email provided');
        } else {
            baseQuery += 'AND SSN__c = :emailOrSSN';
            System.debug(LoggingLevel.ERROR, 'Search criteria: SSN provided');
        }
        
        baseQuery += ' LIMIT 50'; // Prevent excessive results
        
        System.debug(LoggingLevel.ERROR, 'Building SOQL Query - END');
        return baseQuery;
    }
    
    /**
     * Transform Person records for LWC display
     */
    private static List<PersonData> transformPersonData(List<Person__c> persons) {
        System.debug(LoggingLevel.ERROR, 'Transforming Person Data - START');
        
        List<PersonData> transformedData = new List<PersonData>();
        
        for (Person__c person : persons) {
            PersonData data = new PersonData();
            data.id = person.Id;
            data.fullName = person.FullName__c;
            data.dateOfBirth = person.DateOfBirth__c;
            data.emailAddress = person.Email__c;
            
            // Mask SSN - show only last 4 digits
            if (String.isNotBlank(person.SSN__c) && person.SSN__c.length() >= 4) {
                String maskedSSN = '***-**-' + person.SSN__c.right(4);
                data.maskedSSN = maskedSSN;
            }
            
            transformedData.add(data);
        }
        
        System.debug(LoggingLevel.ERROR, 'Transforming Person Data - END. Count: ' + transformedData.size());
        return transformedData;
    }
    
    /**
     * Create error log for debugging purposes
     */
    private static void createErrorLog(Exception e, String lastName, Date dateOfBirth, String emailOrSSN) {
        try {
            // Create a custom error log record for community portal debugging
            Error_Log__c errorLog = new Error_Log__c();
            errorLog.Class_Name__c = 'PersonSearchController';
            errorLog.Method_Name__c = 'searchPersons';
            errorLog.Error_Message__c = e.getMessage();
            errorLog.Stack_Trace__c = e.getStackTraceString();
            errorLog.User_Id__c = UserInfo.getUserId();
            errorLog.Search_Parameters__c = 'LastName: ' + lastName + ', DOB: ' + dateOfBirth + ', EmailOrSSN: ' + emailOrSSN;
            errorLog.Timestamp__c = System.now();
            
            insert errorLog;
            
            System.debug(LoggingLevel.ERROR, 'Error log created with Id: ' + errorLog.Id);
            
        } catch (Exception logException) {
            System.debug(LoggingLevel.ERROR, 'Failed to create error log: ' + logException.getMessage());
        }
    }
    
    // Wrapper classes for data transfer
    public class SearchResult {
        @AuraEnabled public Boolean isSuccess { get; set; }
        @AuraEnabled public String errorMessage { get; set; }
        @AuraEnabled public List<PersonData> persons { get; set; }
        
        public SearchResult() {
            this.persons = new List<PersonData>();
        }
    }
    
    public class PersonData {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String fullName { get; set; }
        @AuraEnabled public Date dateOfBirth { get; set; }
        @AuraEnabled public String emailAddress { get; set; }
        @AuraEnabled public String maskedSSN { get; set; }
    }
}