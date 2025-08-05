# Person Search Lightning Web Component

A Lightning Web Component (LWC) for searching person records with exact match criteria on Last Name, Date of Birth, and Email or SSN.

## Features

- **Exact Match Search**: Uses SOQL exact match criteria for precise results
- **Multiple Search Options**: Accepts either Email or SSN as search criteria
- **Secure SSN Handling**: Displays only last 4 digits of SSN with masking
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Validation**: Input validation with helpful error messages
- **Professional UI**: Clean, modern interface using Salesforce Lightning Design System

## Search Fields

### Required Fields
- **Last Name**: Text field for exact last name match
- **Date of Birth**: Date picker for exact date match
- **Email Address**: Email field (optional, but either Email or SSN must be provided)
- **SSN**: Text field for Social Security Number (optional, but either Email or SSN must be provided)

### Display Columns
The search results table displays:
- **Full Name**: Combined first and last name
- **Date of Birth**: Date field
- **Email Address**: Email field with mailto link
- **SSN**: Encrypted field showing only last 4 digits (XXX-XX-1234)

## Installation

### Prerequisites
- Salesforce org with Lightning Experience enabled
- Deploy permissions for custom objects and Apex classes
- Lightning Web Components enabled

### Deployment Steps

1. **Deploy Custom Object**
   ```bash
   sf project deploy start --source-dir force-app/main/default/objects/Person__c
   ```

2. **Deploy Apex Controller**
   ```bash
   sf project deploy start --source-dir force-app/main/default/classes
   ```

3. **Deploy Lightning Web Component**
   ```bash
   sf project deploy start --source-dir force-app/main/default/lwc/personSearch
   ```

### Manual Setup (Alternative)

1. Create the `Person__c` custom object with these fields:
   - `FirstName` (Text, 80)
   - `LastName` (Text, 80, Required)
   - `Date_of_Birth__c` (Date, Required)
   - `Email__c` (Email)
   - `SSN__c` (Encrypted Text, 11, Mask Type: Last Four)

2. Deploy the Apex class `PersonSearchController`
3. Deploy the LWC component `personSearch`

## Usage

### Adding to Lightning Pages

1. Go to **Setup** → **Lightning App Builder**
2. Edit an existing Lightning page or create a new one
3. Add the **Person Search** component from the custom components list
4. Configure component height if needed (default: 600px)
5. Save and activate the page

### Search Functionality

1. **Enter Search Criteria**:
   - Last Name (required)
   - Date of Birth (required)
   - Email Address (optional)
   - SSN (optional)
   - At least one of Email Address or SSN must be provided

2. **Click Search**: The component will perform an exact match query

3. **View Results**: Results appear in a sortable data table below the search form

4. **Clear Form**: Use the Clear button to reset all fields

### Search Logic

The component accepts separate fields for Email and SSN:
- **Email Address**: Validates email format and searches exact match on Email__c field
- **SSN**: Accepts formatted (123-45-6789) or unformatted (123456789) input, searches exact match on SSN__c field
- **Combined Search**: If both Email and SSN are provided, searches for records matching either criteria

## Security Features

- **SSN Encryption**: SSN field uses Salesforce encrypted text field
- **Data Masking**: Only last 4 digits of SSN are displayed
- **Input Validation**: Client-side validation prevents invalid data submission
- **CRUD Security**: Respects object-level and field-level security

## Technical Implementation

### SOQL Queries
The component uses exact match SOQL queries:

```sql
-- Example queries based on input:

-- Email only:
SELECT Id, FirstName, LastName, Date_of_Birth__c, Email__c, SSN__c 
FROM Person__c 
WHERE LastName = :lastName 
AND Date_of_Birth__c = :dateOfBirth 
AND Email__c = :email
LIMIT 50

-- SSN only:
SELECT Id, FirstName, LastName, Date_of_Birth__c, Email__c, SSN__c 
FROM Person__c 
WHERE LastName = :lastName 
AND Date_of_Birth__c = :dateOfBirth 
AND SSN__c = :cleanSSN
LIMIT 50

-- Both Email and SSN:
SELECT Id, FirstName, LastName, Date_of_Birth__c, Email__c, SSN__c 
FROM Person__c 
WHERE LastName = :lastName 
AND Date_of_Birth__c = :dateOfBirth 
AND (Email__c = :email OR SSN__c = :cleanSSN)
LIMIT 50
```

### Component Architecture

- **personSearch.html**: Lightning template with search form and results table
- **personSearch.js**: JavaScript controller handling user interactions and Apex calls
- **personSearch.css**: Custom styling for enhanced UI/UX
- **PersonSearchController.cls**: Apex controller with search methods and data wrapper

### Error Handling

- Input validation with real-time feedback
- Apex exception handling with user-friendly messages
- Toast notifications for success/error states
- Loading states during search operations

## Customization

### Modifying Search Fields
To add additional search fields:

1. Add the field to the `Person__c` object
2. Update the SOQL query in `PersonSearchController.cls`
3. Add the input field to `personSearch.html` 
4. Add the corresponding JavaScript handlers in `personSearch.js`
5. Update the grid layout classes for responsive design

### Styling Customization
Modify `personSearch.css` to change:
- Color schemes
- Button styles
- Table appearance
- Responsive breakpoints

## Troubleshooting

### Common Issues

1. **"Object doesn't exist" error**
   - Ensure the `Person__c` custom object is deployed
   - Check object permissions

2. **"Method doesn't exist" error**
   - Verify the Apex class is deployed
   - Check method accessibility

3. **Search returns no results**
   - Verify exact match criteria (case-sensitive)
   - Check field-level security permissions
   - Ensure test data exists

### Debug Mode
Enable debug logs in Setup → Debug Logs to trace SOQL queries and Apex execution.

## Support

For questions or issues:
1. Check Salesforce Developer Console for JavaScript errors
2. Review Setup → Debug Logs for Apex errors
3. Verify object and field permissions in Setup → Profiles

## License

This component is provided as-is for educational and development purposes.