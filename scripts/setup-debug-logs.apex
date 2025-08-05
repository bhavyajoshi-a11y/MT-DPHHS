/**
 * Anonymous Apex Script to Set Up Debug Logging
 * Execute this in Developer Console > Debug > Open Execute Anonymous Window
 * This will create a trace flag for the current user with appropriate debug levels
 */

try {
    // Step 1: Create or get debug level
    DebugLevel debugLevel;
    List<DebugLevel> existingLevels = [SELECT Id FROM DebugLevel WHERE DeveloperName = 'MyCustomDebugLevel' LIMIT 1];
    
    if (existingLevels.isEmpty()) {
        // Create new debug level with comprehensive logging
        debugLevel = new DebugLevel();
        debugLevel.DeveloperName = 'MyCustomDebugLevel';
        debugLevel.MasterLabel = 'My Custom Debug Level';
        debugLevel.ApexCode = 'FINE';
        debugLevel.ApexProfiling = 'INFO';
        debugLevel.Callout = 'INFO';
        debugLevel.Database = 'FINE';
        debugLevel.System = 'FINE';
        debugLevel.Validation = 'INFO';
        debugLevel.Visualforce = 'INFO';
        debugLevel.Workflow = 'INFO';
        
        insert debugLevel;
        System.debug('Created new debug level: ' + debugLevel.Id);
    } else {
        debugLevel = existingLevels[0];
        System.debug('Using existing debug level: ' + debugLevel.Id);
    }
    
    // Step 2: Check for existing trace flag
    List<TraceFlag> existingFlags = [
        SELECT Id, ExpirationDate 
        FROM TraceFlag 
        WHERE TracedEntityId = :UserInfo.getUserId() 
        AND ExpirationDate > :System.now()
        LIMIT 1
    ];
    
    if (existingFlags.isEmpty()) {
        // Step 3: Create trace flag for current user
        TraceFlag traceFlag = new TraceFlag();
        traceFlag.TracedEntityId = UserInfo.getUserId();
        traceFlag.LogType = 'USER_DEBUG';
        traceFlag.StartDate = System.now();
        traceFlag.ExpirationDate = System.now().addHours(2); // 2 hours duration
        traceFlag.DebugLevelId = debugLevel.Id;
        
        insert traceFlag;
        
        System.debug('✅ Debug logging enabled successfully!');
        System.debug('📋 Trace Flag ID: ' + traceFlag.Id);
        System.debug('👤 User: ' + UserInfo.getName() + ' (' + UserInfo.getUserId() + ')');
        System.debug('⏰ Expires: ' + traceFlag.ExpirationDate);
        System.debug('🔧 Debug Level: ' + debugLevel.DeveloperName);
        
    } else {
        System.debug('⚠️ Debug logging already enabled for user');
        System.debug('📋 Existing Trace Flag ID: ' + existingFlags[0].Id);
        System.debug('⏰ Expires: ' + existingFlags[0].ExpirationDate);
    }
    
    // Step 4: Test the logging setup
    System.debug(LoggingLevel.ERROR, '🧪 TEST LOG - If you see this message, debug logging is working!');
    
    // Step 5: Enable DebugLogHelper if available
    try {
        DebugLogHelper.enableDebugLogsForCurrentUser();
        System.debug('✅ DebugLogHelper setup completed');
    } catch (Exception ex) {
        System.debug('⚠️ DebugLogHelper not available or failed: ' + ex.getMessage());
    }
    
    System.debug('');
    System.debug('🚀 SETUP COMPLETE! Your debug logs should now appear in:');
    System.debug('   1. Setup > Debug Logs');
    System.debug('   2. Developer Console > Debug > View Debug Logs');
    System.debug('   3. Custom Debug_Log__c records (if DebugLogHelper is deployed)');
    System.debug('');
    System.debug('💡 Next steps:');
    System.debug('   - Test your LWC component');
    System.debug('   - Check for new debug logs');
    System.debug('   - Monitor custom debug log records');
    
} catch (Exception e) {
    System.debug('❌ Error setting up debug logs: ' + e.getMessage());
    System.debug('📊 Stack trace: ' + e.getStackTraceString());
    System.debug('');
    System.debug('🔧 Manual setup required:');
    System.debug('   1. Go to Setup > Debug Logs');
    System.debug('   2. Click New to create trace flag');
    System.debug('   3. Select your user and set debug level');
    System.debug('   4. Set expiration date (max 24 hours)');
}