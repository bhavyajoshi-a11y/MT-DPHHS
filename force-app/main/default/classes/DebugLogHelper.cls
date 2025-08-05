/**
 * DebugLogHelper - Comprehensive debugging utility for Salesforce applications
 * Especially useful for Community Portal debugging where standard debug logs may not appear
 */
public class DebugLogHelper {
    
    private static final String DEBUG_OBJECT_API_NAME = 'Debug_Log__c';
    
    /**
     * Log debug information with multiple fallback mechanisms
     * @param level - Log level (ERROR, WARN, INFO, DEBUG)
     * @param className - Name of the class where log is generated
     * @param methodName - Name of the method where log is generated
     * @param message - Debug message
     * @param context - Additional context information
     */
    public static void log(String level, String className, String methodName, String message, Object context) {
        // Strategy 1: Use System.debug with ERROR level (most likely to appear)
        String debugMessage = formatMessage(level, className, methodName, message, context);
        System.debug(LoggingLevel.ERROR, debugMessage);
        
        // Strategy 2: Create custom debug log record (survives transaction)
        createCustomDebugLog(level, className, methodName, message, context);
        
        // Strategy 3: Create Platform Event for real-time monitoring
        publishDebugEvent(level, className, methodName, message, context);
    }
    
    /**
     * Simplified logging methods
     */
    public static void logError(String className, String methodName, String message) {
        log('ERROR', className, methodName, message, null);
    }
    
    public static void logError(String className, String methodName, String message, Exception ex) {
        String contextInfo = 'Exception: ' + ex.getMessage() + '\nStack Trace: ' + ex.getStackTraceString();
        log('ERROR', className, methodName, message, contextInfo);
    }
    
    public static void logInfo(String className, String methodName, String message) {
        log('INFO', className, methodName, message, null);
    }
    
    public static void logDebug(String className, String methodName, String message, Object context) {
        log('DEBUG', className, methodName, message, context);
    }
    
    /**
     * Log user context information - crucial for community portal debugging
     */
    public static void logUserContext(String className, String methodName) {
        Map<String, Object> userContext = new Map<String, Object>{
            'UserId' => UserInfo.getUserId(),
            'UserName' => UserInfo.getName(),
            'UserType' => UserInfo.getUserType(),
            'ProfileId' => UserInfo.getProfileId(),
            'IsPortalUser' => UserInfo.getUserType() != 'Standard',
            'SessionId' => UserInfo.getSessionId(),
            'OrganizationId' => UserInfo.getOrganizationId(),
            'TimeZone' => UserInfo.getTimeZone().getDisplayName(),
            'Locale' => UserInfo.getLocale()
        };
        
        log('INFO', className, methodName, 'User Context Information', userContext);
    }
    
    /**
     * Format debug message with comprehensive information
     */
    private static String formatMessage(String level, String className, String methodName, String message, Object context) {
        String timestamp = System.now().format('yyyy-MM-dd HH:mm:ss.SSS');
        String userInfo = UserInfo.getUserId() + ' (' + UserInfo.getUserType() + ')';
        
        String formattedMessage = String.format(
            '[{0}] [{1}] {2}.{3}() - User: {4} - {5}',
            new List<String>{timestamp, level, className, methodName, userInfo, message}
        );
        
        if (context != null) {
            formattedMessage += '\nContext: ' + JSON.serializePretty(context);
        }
        
        return formattedMessage;
    }
    
    /**
     * Create custom debug log record that persists beyond transaction
     */
    @future
    private static void createCustomDebugLog(String level, String className, String methodName, String message, Object context) {
        try {
            // Check if custom object exists
            if (!hasDebugLogObject()) {
                return;
            }
            
            SObject debugLog = Schema.getGlobalDescribe().get(DEBUG_OBJECT_API_NAME).newSObject();
            debugLog.put('Level__c', level);
            debugLog.put('Class_Name__c', className);
            debugLog.put('Method_Name__c', methodName);
            debugLog.put('Message__c', message);
            debugLog.put('Context__c', context != null ? JSON.serializePretty(context) : null);
            debugLog.put('User_Id__c', UserInfo.getUserId());
            debugLog.put('User_Type__c', UserInfo.getUserType());
            debugLog.put('Timestamp__c', System.now());
            debugLog.put('Session_Id__c', UserInfo.getSessionId());
            
            insert debugLog;
            
        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'Failed to create custom debug log: ' + ex.getMessage());
        }
    }
    
    /**
     * Publish debug event for real-time monitoring
     */
    private static void publishDebugEvent(String level, String className, String methodName, String message, Object context) {
        try {
            // Check if platform event exists
            if (!hasDebugEvent()) {
                return;
            }
            
            SObject debugEvent = Schema.getGlobalDescribe().get('Debug_Event__e').newSObject();
            debugEvent.put('Level__c', level);
            debugEvent.put('Class_Name__c', className);
            debugEvent.put('Method_Name__c', methodName);
            debugEvent.put('Message__c', message);
            debugEvent.put('Context__c', context != null ? JSON.serializePretty(context) : null);
            debugEvent.put('User_Id__c', UserInfo.getUserId());
            debugEvent.put('User_Type__c', UserInfo.getUserType());
            
            EventBus.publish(debugEvent);
            
        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'Failed to publish debug event: ' + ex.getMessage());
        }
    }
    
    /**
     * Check if custom debug log object exists
     */
    private static Boolean hasDebugLogObject() {
        return Schema.getGlobalDescribe().containsKey(DEBUG_OBJECT_API_NAME);
    }
    
    /**
     * Check if debug event exists
     */
    private static Boolean hasDebugEvent() {
        return Schema.getGlobalDescribe().containsKey('Debug_Event__e');
    }
    
    /**
     * Enable debug logs for current user (if admin)
     */
    public static void enableDebugLogsForCurrentUser() {
        try {
            // This method can be called to programmatically enable debug logs
            // Only works if current user has appropriate permissions
            
            System.debug(LoggingLevel.ERROR, 'Attempting to enable debug logs for user: ' + UserInfo.getUserId());
            
            // Query for existing trace flag
            List<TraceFlag> existingFlags = [
                SELECT Id, ExpirationDate 
                FROM TraceFlag 
                WHERE TracedEntityId = :UserInfo.getUserId() 
                AND ExpirationDate > :System.now()
                LIMIT 1
            ];
            
            if (existingFlags.isEmpty()) {
                // Create new trace flag
                TraceFlag traceFlag = new TraceFlag();
                traceFlag.TracedEntityId = UserInfo.getUserId();
                traceFlag.LogType = 'USER_DEBUG';
                traceFlag.StartDate = System.now();
                traceFlag.ExpirationDate = System.now().addHours(1); // 1 hour duration
                
                // Set debug levels to maximum
                List<DebugLevel> debugLevels = [SELECT Id FROM DebugLevel WHERE DeveloperName = 'SFDC_DevConsole' LIMIT 1];
                if (!debugLevels.isEmpty()) {
                    traceFlag.DebugLevelId = debugLevels[0].Id;
                }
                
                insert traceFlag;
                
                System.debug(LoggingLevel.ERROR, 'Debug logging enabled for user with TraceFlag Id: ' + traceFlag.Id);
            } else {
                System.debug(LoggingLevel.ERROR, 'Debug logging already enabled for user');
            }
            
        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'Failed to enable debug logs: ' + ex.getMessage());
        }
    }
    
    /**
     * Get debug logs for analysis
     */
    public static List<String> getRecentDebugLogs(Integer limitCount) {
        List<String> logs = new List<String>();
        
        try {
            if (hasDebugLogObject()) {
                String query = 'SELECT Level__c, Class_Name__c, Method_Name__c, Message__c, Context__c, Timestamp__c, User_Id__c ' +
                              'FROM ' + DEBUG_OBJECT_API_NAME + ' ' +
                              'ORDER BY Timestamp__c DESC ' +
                              'LIMIT ' + limitCount;
                
                List<SObject> debugLogs = Database.query(query);
                
                for (SObject debugLog : debugLogs) {
                    String logEntry = String.format(
                        '[{0}] [{1}] {2}.{3}() - {4}',
                        new List<String>{
                            String.valueOf(debugLog.get('Timestamp__c')),
                            String.valueOf(debugLog.get('Level__c')),
                            String.valueOf(debugLog.get('Class_Name__c')),
                            String.valueOf(debugLog.get('Method_Name__c')),
                            String.valueOf(debugLog.get('Message__c'))
                        }
                    );
                    logs.add(logEntry);
                }
            }
        } catch (Exception ex) {
            logs.add('Error retrieving debug logs: ' + ex.getMessage());
        }
        
        return logs;
    }
}