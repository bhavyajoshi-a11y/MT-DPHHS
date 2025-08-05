# Salesforce Debug Logging Solutions Guide

## Problem: Debug Logs Not Appearing in Community Portal

When running LWC components in Salesforce Community Portal, debug logs often don't appear in Setup > Debug Logs because:

1. **Community users run in a different execution context**
2. **Debug logs are primarily designed for internal Salesforce users**
3. **Guest users and community users have limited logging capabilities**
4. **Trace flags may not be set up correctly for community users**

## Solutions

### Solution 1: Manual Debug Log Setup (Traditional Method)

#### Step 1: Enable Debug Logs in Setup

1. Go to **Setup** > **Environments** > **Logs** > **Debug Logs**
2. Click **New** to create a new trace flag
3. Set the following:
   - **Traced Entity Type**: User
   - **Traced Entity**: Select the community user or your admin user
   - **Debug Level**: Create or select a debug level with appropriate logging levels
   - **Start Date**: Current date/time
   - **Expiration Date**: Set to future date (max 24 hours)

#### Step 2: Create Custom Debug Level

1. Go to **Setup** > **Environments** > **Logs** > **Debug Levels**
2. Click **New** and set all categories to **ERROR** or **FINE** level:
   - Database: FINE
   - Workflow: FINE
   - Validation: INFO
   - Callout: INFO
   - Apex Code: FINE
   - Apex Profiling: INFO
   - Visualforce: INFO
   - System: FINE

### Solution 2: Using Custom Debug Log Object (Recommended for Community Portal)

Create a custom object to store debug information that persists beyond transaction boundaries.

#### Custom Object: Debug_Log__c

**Fields:**
- `Level__c` (Text, 50) - Log level (ERROR, WARN, INFO, DEBUG)
- `Class_Name__c` (Text, 255) - Name of the Apex class
- `Method_Name__c` (Text, 255) - Name of the method
- `Message__c` (Long Text Area, 32768) - Debug message
- `Context__c` (Long Text Area, 32768) - Additional context (JSON)
- `User_Id__c` (Text, 18) - User ID who triggered the log
- `User_Type__c` (Text, 50) - Type of user (Standard, PowerPartner, etc.)
- `Timestamp__c` (Date/Time) - When the log was created
- `Session_Id__c` (Text, 255) - Session ID for correlation

### Solution 3: Platform Events for Real-time Debugging

Create a platform event for real-time debugging monitoring.

#### Platform Event: Debug_Event__e

**Fields:**
- `Level__c` (Text, 50)
- `Class_Name__c` (Text, 255)
- `Method_Name__c` (Text, 255)
- `Message__c` (Long Text Area, 32768)
- `Context__c` (Long Text Area, 32768)
- `User_Id__c` (Text, 18)
- `User_Type__c` (Text, 50)

### Solution 4: Using the DebugLogHelper Class

Replace standard System.debug() calls with DebugLogHelper methods:

```apex
// Instead of:
System.debug('Processing search request');

// Use:
DebugLogHelper.logInfo('PersonSearchController', 'searchPersons', 'Processing search request');

// For errors:
DebugLogHelper.logError('PersonSearchController', 'searchPersons', 'Search failed', ex);

// For user context:
DebugLogHelper.logUserContext('PersonSearchController', 'searchPersons');
```

## Debugging Strategies for Community Portal

### 1. Check User Context First

Always log user information to understand the execution context:

```apex
System.debug(LoggingLevel.ERROR, 'User ID: ' + UserInfo.getUserId());
System.debug(LoggingLevel.ERROR, 'User Type: ' + UserInfo.getUserType());
System.debug(LoggingLevel.ERROR, 'Profile ID: ' + UserInfo.getProfileId());
System.debug(LoggingLevel.ERROR, 'Is Guest User: ' + (UserInfo.getUserType() == 'Guest'));
```

### 2. Use LoggingLevel.ERROR

Always use `LoggingLevel.ERROR` for System.debug() statements as they're most likely to appear:

```apex
System.debug(LoggingLevel.ERROR, 'Your debug message here');
```

### 3. Create Test Methods for Admin Users

Create test methods that call your Apex methods as admin users to see debug logs:

```apex
@isTest
private class PersonSearchControllerTest {
    @isTest
    static void testSearchPersonsAsAdmin() {
        // This will run as admin user and show debug logs
        PersonSearchController.SearchResult result = PersonSearchController.searchPersons('Doe', Date.today(), 'test@example.com');
        System.assert(result != null);
    }
}
```

### 4. Use Developer Console Logs

1. Open **Developer Console** (Ctrl+Shift+O or from Setup menu)
2. Go to **Debug** > **View Debug Logs**
3. Check **Include in Debug Log** for your user
4. Set log levels and monitor real-time

### 5. Monitor Custom Debug Logs

Query your custom debug log object to see all logs:

```apex
List<Debug_Log__c> logs = [
    SELECT Level__c, Class_Name__c, Method_Name__c, Message__c, Timestamp__c 
    FROM Debug_Log__c 
    WHERE CreatedDate = TODAY 
    ORDER BY Timestamp__c DESC 
    LIMIT 100
];

for (Debug_Log__c log : logs) {
    System.debug(log.Level__c + ': ' + log.Class_Name__c + '.' + log.Method_Name__c + ' - ' + log.Message__c);
}
```

## Advanced Debugging Techniques

### 1. Anonymous Apex for Quick Testing

Use Anonymous Apex to test your methods directly:

```apex
// Execute in Anonymous Apex window
PersonSearchController.SearchResult result = PersonSearchController.searchPersons('TestLastName', Date.today(), 'test@example.com');
System.debug(LoggingLevel.ERROR, 'Result: ' + JSON.serializePretty(result));
```

### 2. Create Debug Helper LWC Component

Create an admin-only LWC component to view debug logs:

```javascript
// In LWC JavaScript
import getRecentDebugLogs from '@salesforce/apex/DebugLogHelper.getRecentDebugLogs';

async connectedCallback() {
    try {
        const logs = await getRecentDebugLogs({ limitCount: 50 });
        console.log('Recent Debug Logs:', logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}
```

### 3. Email Debug Information

For critical errors, send debug information via email:

```apex
private static void sendDebugEmail(String subject, String body) {
    try {
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new String[]{'developer@yourcompany.com'});
        email.setSubject('Debug: ' + subject);
        email.setPlainTextBody(body);
        Messaging.sendEmail(new Messaging.SingleEmailMessage[]{email});
    } catch (Exception ex) {
        System.debug(LoggingLevel.ERROR, 'Failed to send debug email: ' + ex.getMessage());
    }
}
```

## Setup Checklist

### For Community Portal Debugging:

- [ ] Create custom Debug_Log__c object with appropriate fields
- [ ] Create Debug_Event__e platform event (optional)
- [ ] Deploy DebugLogHelper class
- [ ] Update your Apex classes to use DebugLogHelper
- [ ] Set up trace flags for admin users
- [ ] Create debug level with ERROR/FINE settings
- [ ] Test with Anonymous Apex first
- [ ] Monitor custom debug logs in addition to standard logs
- [ ] Set up email notifications for critical errors

### For Standard Salesforce Debugging:

- [ ] Go to Setup > Debug Logs
- [ ] Create trace flag for your user
- [ ] Set appropriate debug levels
- [ ] Use Developer Console for real-time monitoring
- [ ] Check log retention policies

## Common Issues and Solutions

### Issue: No logs appearing at all
**Solution:** Check if trace flag is active and not expired

### Issue: Logs appear for admin but not community users
**Solution:** Use custom debug log object and DebugLogHelper class

### Issue: Logs are truncated
**Solution:** Use custom objects to store full debug information

### Issue: Performance impact from excessive logging
**Solution:** Use conditional logging based on user type or custom settings

### Issue: Can't see real-time logs
**Solution:** Use platform events or email notifications for critical issues

## Best Practices

1. **Always log user context** when debugging community portal issues
2. **Use multiple debugging strategies** simultaneously
3. **Clean up expired trace flags** regularly
4. **Set up monitoring** for production environments
5. **Use meaningful log messages** with context information
6. **Test debugging setup** in sandbox before production
7. **Document debugging procedures** for your team
8. **Set up alerts** for critical errors in production