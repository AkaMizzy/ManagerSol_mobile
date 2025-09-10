# Manifolder to Declaration Linking Feature

## Overview
This feature enables users to create declarations directly from manifolder question answers, establishing a direct relationship between manifolder details and declarations in the system.

## Database Schema Changes

### Declaration Table Updates
```sql
-- Added foreign key relationships to link declarations with manifolder data
ALTER TABLE declaration 
ADD COLUMN id_manifold VARCHAR(255) AFTER date_declaration,
ADD COLUMN id_manifold_detail VARCHAR(255) AFTER id_manifold,
ADD FOREIGN KEY(id_manifold) REFERENCES manifolder(id),
ADD FOREIGN KEY(id_manifold_detail) REFERENCES manifolder_detail(id);
```

### Table Relationships
| Table | Relationship | Purpose |
|-------|-------------|---------|
| `declaration` | → `manifolder` | Links declaration to specific manifolder session |
| `declaration` | → `manifolder_detail` | Links declaration to specific question answer |
| `manifolder_detail` | → `task_element` | References the question that was answered |

## Backend Implementation

### New API Endpoints

#### 1. Enhanced Declaration Creation
**Endpoint:** `POST /declarations`
**New Fields:** `id_manifold`, `id_manifold_detail`
**Validation:** Both fields must be provided together if either is present

#### 2. Manifolder Details for Declaration
**Endpoint:** `GET /manifolder-details-for-declaration/:manifolderId/:manifolderDetailId`
**Purpose:** Fetches comprehensive manifolder context for pre-populating declaration form
**Returns:**
```json
{
  "manifolder": {
    "id": "uuid",
    "title": "Manifolder Title",
    "projectId": "uuid",
    "projectTitle": "Project Name",
    "defaultZoneId": "uuid",
    "zoneTitle": "Zone Name"
  },
  "manifolderDetail": {
    "id": "uuid",
    "questionTitle": "Question Text",
    "questionType": "text|number|file|etc",
    "answer": { /* answer data */ }
  },
  "availableZones": [ /* project zones */ ]
}
```

### Enhanced Declaration Queries
- Updated `GET /declarations` and `GET /declarations/:id` to include manifolder information via JOINs
- Added `manifolderInfo` object to declaration responses containing linked manifolder data

## Frontend Implementation

### Component Flow
```
ManifolderQuestions → QuestionAccordion → CreateDeclarationModal
```

### Key Components Modified

#### 1. QuestionAccordion.tsx
**New Props:**
- `onCreateDeclaration?: (questionId: string) => void`

**New UI Element:**
- "Create Declaration" button (orange `#f87b1b`)
- Only visible when `isSubmitted && onCreateDeclaration` is true
- Positioned after answer submission confirmation

#### 2. ManifolderQuestions.tsx
**New State:**
```typescript
const [showDeclarationModal, setShowDeclarationModal] = useState(false);
const [manifolderDetailsForDeclaration, setManifolderDetailsForDeclaration] = useState<ManifolderDetailsForDeclaration | null>(null);
const [declarationTypes, setDeclarationTypes] = useState<any[]>([]);
const [projects, setProjects] = useState<any[]>([]);
const [companyUsers, setCompanyUsers] = useState<any[]>([]);
```

**New Functions:**
- `handleCreateDeclaration(questionId: string)` - Orchestrates declaration creation flow
- `loadDeclarationData()` - Loads dropdown data (types, projects, users)
- `handleDeclarationSubmit(declarationData: any)` - Submits new declaration

#### 3. CreateDeclarationModal.tsx
**New Props:**
- `manifolderDetails?: ManifolderDetailsForDeclaration`

**Enhanced Features:**
- Pre-populates form with manifolder context
- Displays manifolder summary section
- Maintains all existing functionality

## User Workflow

### Step-by-Step Process
1. **Answer Question** - User fills out and submits a manifolder question
2. **Button Appears** - "Create Declaration" button becomes visible
3. **Click Button** - User clicks to create declaration
4. **Data Fetch** - System fetches manifolder context and dropdown data
5. **Modal Opens** - Declaration creation modal opens pre-populated
6. **Complete Form** - User fills remaining declaration details
7. **Submit** - Declaration is created with manifolder linkage

### Data Flow
```
Question Answer → Answer ID → Manifolder Context → Pre-populated Declaration Form
```

## Type Definitions

### New Interfaces
```typescript
interface ManifolderDetailsForDeclaration {
  manifolder: {
    id: string;
    title: string;
    projectId: string;
    projectTitle: string;
    defaultZoneId: string;
    zoneTitle: string;
    manifolderType: string;
  };
  manifolderDetail: {
    id: string;
    questionId: string;
    questionTitle: string;
    questionType: string;
    answer: {
      text?: string;
      file?: string;
      latitude?: number;
      longitude?: number;
      quantity?: number;
      status?: number;
    };
  };
  availableZones: Zone[];
}
```

### Enhanced Declaration Interface
```typescript
interface Declaration {
  // ... existing fields
  id_manifold?: string;
  id_manifold_detail?: string;
  manifolderInfo?: {
    manifolderId: string;
    manifolderDetailId: string;
    manifolderTitle: string;
    question: { title: string; type: string; description: string };
    answer: { /* answer details */ };
  };
}
```

## Technical Considerations

### Validation Rules
- `id_manifold` and `id_manifold_detail` must be provided together
- Both IDs must be accessible to user's company
- Answer must exist before declaration can be created

### Error Handling
- Graceful fallback if manifolder data unavailable
- User-friendly error messages for validation failures
- Non-blocking data loading (declaration types, projects, users)

### Performance
- Parallel data loading for dropdowns
- Efficient JOIN queries for declaration retrieval
- Minimal re-renders with proper state management

## Benefits
- **Streamlined Workflow** - Direct path from question answer to declaration
- **Context Preservation** - Manifolder information automatically linked
- **Data Integrity** - Foreign key constraints ensure referential integrity
- **User Experience** - Pre-populated forms reduce manual data entry
- **Traceability** - Clear audit trail from question to declaration
