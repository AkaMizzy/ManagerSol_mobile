# Authentication System Documentation

## Overview
The ManagerSol mobile app now uses a robust authentication system based on React Context and AsyncStorage for persistent login state.

## Features

### ✅ **Persistent Login**
- Users stay logged in across app restarts
- No need to re-enter credentials every time
- Secure token storage using AsyncStorage

### ✅ **Role-Based Access Control**
- Only users with role 'user' can access the mobile app
- Admin and superAdmin users are redirected to web application
- Secure token validation

### ✅ **Automatic Navigation**
- No manual redirects needed
- App automatically shows correct screens based on auth state
- Smooth user experience with loading states

### ✅ **Type Safety**
- Full TypeScript support
- Proper interfaces for User and AuthState
- Centralized API configuration

## Architecture

### **AuthContext.tsx**
- Central authentication state management
- Handles login, logout, and user updates
- Manages AsyncStorage operations
- Provides authentication state to entire app

### **useAuth Hook**
```typescript
const { user, token, isAuthenticated, isLoading, login, logout } = useAuth();
```

### **API Configuration**
- Centralized API configuration in `config/api.ts`
- Base URL configuration for different environments
- Easy to switch between development and production

## Usage Examples

### **Login Screen**
```typescript
const { login, isLoading } = useAuth();

const handleLogin = async () => {
  const result = await login(email, password);
  if (result.success) {
    // User will be automatically redirected to main app
  } else {
    Alert.alert('Login Failed', result.error);
  }
};
```

### **Protected Components**
```typescript
const { user, isAuthenticated } = useAuth();

if (!isAuthenticated) {
  return <LoginScreen />;
}

return <UserDashboard user={user} />;
```

### **API Calls with Auth**
```typescript
// Use the existing centralized API configuration
import API_CONFIG from '@/app/config/api';

const fetchUserData = async () => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
```

### **Logout**
```typescript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // User will be automatically redirected to login
};
```

## Storage Keys
- `auth_token`: User's authentication token
- `auth_user`: User profile data

## Security Features
- Token-based authentication
- Secure storage using AsyncStorage
- Role-based access control
- Centralized API configuration

## Benefits Over Previous System
1. **No Redirects** - Uses conditional rendering
2. **Persistent State** - Remembers login across sessions
3. **Better UX** - No flash of wrong content
4. **Scalable** - Easy to add features like token refresh
5. **Type Safe** - Full TypeScript support
6. **Centralized** - All auth logic in one place
7. **Clean Architecture** - Uses existing API configuration

## Future Enhancements
- Token refresh mechanism
- Biometric authentication
- Offline support
- Push notifications
- Session timeout handling
