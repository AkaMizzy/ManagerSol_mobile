# Signature Feature Implementation

## Overview

The Signature Feature enables users to capture hand-drawn digital signatures for manifolders with three specific roles: **Technicien**, **Contrôle**, and **Admin**. Each signature is captured individually with an associated email address and stored in a dedicated database table. This feature is mandatory for manifolder creation and ensures proper authorization workflow.

## Architecture

### Database Schema

#### Table: `manifold_signature`
```sql
CREATE TABLE manifold_signature (
    id VARCHAR(255) PRIMARY KEY,
    id_manifolder VARCHAR(255),
    signature_role ENUM('technicien', 'control', 'admin'),
    signature TEXT, -- Base64 encoded signature image
    signer_email VARCHAR(255),
    date_sign DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_manifolder) REFERENCES manifolder(id) ON DELETE CASCADE,
    UNIQUE KEY unique_manifolder_role (id_manifolder, signature_role)
);
```

### Signature Roles

| Role | Description | Required |
|------|-------------|----------|
| `technicien` | Technical personnel signature | ✅ Yes |
| `control` | Quality control signature | ✅ Yes |
| `admin` | Administrative approval signature | ✅ Yes |

## Backend Implementation

### File: `backend/routes/manifolderSignatureRoutes.js`

#### Key Functions

1. **`ensureManifolderAccessible()`**
   - Validates user access to manifolder through company relationship
   - Prevents unauthorized access to signatures

2. **`updateManifolderSignatureStatus()`**
   - Counts signatures and logs status (no database update needed)
   - Used for debugging and monitoring

3. **`validateEmail()` & `validateSignatureRole()`**
   - Input validation functions
   - Ensures data integrity

#### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/manifolder-signatures` | Save signature for a manifolder |
| `GET` | `/manifolder-signatures/:manifolderId` | Get all signatures for a manifolder |
| `GET` | `/manifolder-signatures/:manifolderId/:role` | Get specific signature by role |
| `PUT` | `/manifolder-signatures/:signatureId` | Update existing signature |
| `DELETE` | `/manifolder-signatures/:signatureId` | Delete signature |
| `GET` | `/manifolder-signatures/status/:manifolderId` | Get completion status |

#### Security Features

- **Authentication Required**: All endpoints require valid JWT token
- **Company Access Control**: Users can only access signatures for manifolders in their company
- **Input Validation**: Email format, signature data, and role validation
- **SQL Injection Protection**: Using parameterized queries
- **Transaction Safety**: Database operations use transactions

## Frontend Implementation

### File: `components/SignatureField.tsx`

#### Component Architecture

```typescript
interface SignatureFieldProps {
  role: 'technicien' | 'control' | 'admin';
  roleLabel: string;
  onSignatureComplete: (role: string, signature: string, email: string) => void;
  isCompleted: boolean;
}
```

#### Key Features

1. **Modern Modal Design**
   - Clean, minimal UI with professional styling
   - Fade animation for smooth user experience
   - Responsive design for mobile and desktop

2. **Signature Canvas**
   - Uses `react-native-signature-canvas` library
   - Dashed border with "Sign here" placeholder
   - Custom styling to hide built-in buttons
   - Crosshair cursor for better drawing experience

3. **Validation System**
   - Email format validation
   - Signature presence validation
   - Real-time feedback

4. **State Management**
   - Local state for modal visibility
   - Signature data capture
   - Email input handling

#### Signature Capture Flow

```mermaid
graph TD
    A[User clicks signature field] --> B[Modal opens]
    B --> C[User enters email]
    C --> D[User draws signature]
    D --> E[User clicks Confirm]
    E --> F[Email validation]
    F --> G[Signature capture via readSignature()]
    G --> H[handleSignature() receives data]
    H --> I[onSignatureComplete() callback]
    I --> J[Modal closes & data saved]
```

### File: `app/(tabs)/manifolder.tsx`

#### Integration Points

1. **Signature State Management**
```typescript
const [signatures, setSignatures] = useState<{
  technicien: { signature: string; email: string } | null;
  control: { signature: string; email: string } | null;
  admin: { signature: string; email: string } | null;
}>({
  technicien: null,
  control: null,
  admin: null,
});
```

2. **Validation Logic**
```typescript
const isAllSignaturesComplete = () => {
  return signatures.technicien && signatures.control && signatures.admin;
};
```

3. **Database Integration**
```typescript
// Save signatures after manifolder creation
const signaturePromises = [
  manifolderService.saveSignature({
    id_manifolder: result.manifolderId,
    signature_role: 'technicien',
    signature: signatures.technicien!.signature,
    signer_email: signatures.technicien!.email,
  }, token!),
  // ... similar for control and admin
];
await Promise.all(signaturePromises);
```

### File: `services/manifolderService.ts`

#### Service Methods

```typescript
// Save individual signature
saveSignature(payload: {
  id_manifolder: string;
  signature_role: 'technicien' | 'control' | 'admin';
  signature: string;
  signer_email: string;
}, token: string): Promise<{...}>

// Get all signatures for a manifolder
getManifolderSignatures(manifolderId: string, token: string): Promise<{...}>

// Get signature completion status
getSignatureStatus(manifolderId: string, token: string): Promise<{...}>
```

## UI/UX Design

### Design Principles

1. **Minimalism**: Clean interface with essential elements only
2. **Hierarchy**: Clear visual hierarchy with proper button styling
3. **Consistency**: Unified spacing, colors, and typography
4. **Professional**: Business-grade appearance suitable for enterprise apps
5. **Accessibility**: Proper contrast, touch targets, and keyboard navigation

### Color Palette

- **Primary**: `#11224e` (Brand Blue)
- **Success**: `#34C759` (Green for completed signatures)
- **Warning**: `#007AFF` (Blue for control role)
- **Info**: `#FF9500` (Orange for admin role)
- **Neutral**: `#6B7280`, `#374151` (Text colors)
- **Background**: `#FAFAFA` (Light gray for canvas)

### Layout Structure

```
┌─────────────────────────────────────┐
│ Digital Signature - [Role]      ✕   │
├─────────────────────────────────────┤
│ Signer Email Address                │
│ [Email Input Field]                 │
│                                     │
│ Signature                           │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │        Sign here                │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Clear] [Confirm]                   │
└─────────────────────────────────────┘
```

## Technical Implementation Details

### Signature Data Format

- **Storage**: Base64 encoded PNG images
- **Size**: Optimized with `trimWhitespace: true`
- **Quality**: High-quality PNG format for clarity

### Error Handling

1. **Frontend Validation**
   - Email format validation
   - Signature presence validation
   - User-friendly error messages

2. **Backend Validation**
   - Input sanitization
   - Database constraint validation
   - Transaction rollback on errors

3. **Network Error Handling**
   - Retry mechanisms
   - Graceful degradation
   - User feedback

### Performance Considerations

1. **Canvas Optimization**
   - Efficient signature capture
   - Minimal memory usage
   - Smooth drawing experience

2. **Database Optimization**
   - Proper indexing on frequently queried fields
   - Efficient signature storage
   - Batch operations for multiple signatures

3. **Frontend Optimization**
   - Lazy loading of signature components
   - Efficient state management
   - Minimal re-renders

## Security Considerations

### Data Protection

1. **Signature Data**
   - Base64 encoding for safe transmission
   - Secure storage in database
   - Access control through company relationships

2. **Email Validation**
   - Format validation
   - Required field validation
   - SQL injection prevention

3. **Access Control**
   - JWT token authentication
   - Company-based access restrictions
   - Role-based permissions

### Compliance

- **GDPR**: Personal data (email) handling
- **Data Retention**: Signature data storage policies
- **Audit Trail**: Signature timestamps and metadata

## Testing Strategy

### Unit Tests

1. **Component Tests**
   - SignatureField component rendering
   - Modal open/close functionality
   - Validation logic

2. **Service Tests**
   - API call functionality
   - Error handling
   - Data transformation

### Integration Tests

1. **End-to-End Flow**
   - Complete signature capture process
   - Database integration
   - Error scenarios

2. **API Tests**
   - Endpoint functionality
   - Authentication
   - Data validation

## Deployment Considerations

### Database Migration

```sql
-- Create the manifold_signature table
CREATE TABLE manifold_signature (
    id VARCHAR(255) PRIMARY KEY,
    id_manifolder VARCHAR(255),
    signature_role ENUM('technicien', 'control', 'admin'),
    signature TEXT,
    signer_email VARCHAR(255),
    date_sign DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_manifolder) REFERENCES manifolder(id) ON DELETE CASCADE,
    UNIQUE KEY unique_manifolder_role (id_manifolder, signature_role)
);
```

### Environment Configuration

1. **Backend**
   - Database connection settings
   - JWT secret configuration
   - CORS settings

2. **Frontend**
   - API endpoint configuration
   - Signature canvas settings
   - Error handling configuration

## Future Enhancements

### Planned Features

1. **Digital Certificates**
   - Add digital signature verification
   - Enhanced security measures

2. **Signature Templates**
   - Pre-defined signature templates
   - Custom signature styles

3. **Workflow Management**
   - Sequential signature approval process
   - Notification system

4. **Audit Trail**
   - Enhanced logging and tracking
   - Signature history

5. **Mobile Optimization**
   - Enhanced mobile signature experience
   - Touch gesture improvements

### Technical Debt

1. **Code Refactoring**
   - Extract common validation logic
   - Improve error handling consistency

2. **Performance Optimization**
   - Implement signature caching
   - Optimize database queries

3. **Testing Coverage**
   - Increase test coverage
   - Add performance tests

## Troubleshooting

### Common Issues

1. **Signature Not Capturing**
   - Check canvas initialization
   - Verify `readSignature()` method
   - Ensure proper event handling

2. **Email Validation Errors**
   - Verify regex pattern
   - Check input sanitization
   - Test edge cases

3. **Database Connection Issues**
   - Check connection pool
   - Verify transaction handling
   - Monitor query performance

### Debug Tools

1. **Frontend Debugging**
   - React DevTools
   - Console logging
   - Network tab monitoring

2. **Backend Debugging**
   - Database query logging
   - Error stack traces
   - Performance monitoring

## Conclusion

The Signature Feature provides a comprehensive solution for digital signature capture in the manifolder workflow. It combines modern UI/UX design with robust backend architecture, ensuring a professional and secure user experience. The implementation follows best practices for security, performance, and maintainability, making it suitable for enterprise-level applications.

The feature successfully integrates with the existing manifolder creation process while maintaining clean separation of concerns and providing extensibility for future enhancements.
