# MyHealth Companion - Project Structure

## Overview
A comprehensive patient empowerment and health navigation application built with React, TypeScript, Vite, and TailwindCSS.

## 📁 Folder Structure

```
src/
├─ components/
│   ├─ Sidebar.tsx                 # Main navigation sidebar (collapsible)
│   ├─ Topbar.tsx                  # Top header with notifications and user menu
│   ├─ Layout.tsx                  # Main layout wrapper
│   ├─ timeline/
│   │   ├─ TimelineItem.tsx        # Individual timeline event card
│   │   └─ TimelineList.tsx        # Timeline events list with grouping
│   ├─ chat/
│   │   ├─ ChatBubble.tsx          # Chat message bubbles
│   │   └─ QuickPromptCard.tsx     # Quick prompt suggestion cards
│   ├─ documents/
│   │   └─ DocumentCard.tsx        # Document display card
│   ├─ dashboard/
│   │   └─ QuickActionCard.tsx     # Dashboard action cards
│   ├─ PlainLanguageModal.tsx      # Modal for plain language explanations
│   └─ ui/                         # Shadcn UI components
│
├─ pages/
│   ├─ Home.tsx                    # Landing page
│   ├─ Dashboard.tsx               # Patient dashboard
│   ├─ Timeline.tsx                # Patient health timeline
│   ├─ AIHealthGuide.tsx           # AI conversational assistant
│   ├─ Appointments.tsx            # Appointments management
│   ├─ Documents.tsx               # Medical documents library
│   ├─ Settings.tsx                # User settings
│   └─ NotFound.tsx                # 404 page
│
├─ api/
│   ├─ getPatientTimeline.ts       # Mock API for timeline data
│   ├─ getPatientProfile.ts        # Mock API for patient profile
│   ├─ sendAIQuery.ts              # Mock API for AI queries
│   └─ getDocuments.ts             # Mock API for documents
│
├─ data/
│   └─ mockTimeline.ts             # Mock timeline events data
│
├─ hooks/
│   ├─ use-mobile.tsx              # Mobile detection hook
│   ├─ use-toast.ts                # Toast notifications hook
│   └─ useHealthChat.ts            # AI chat management hook
│
├─ lib/
│   └─ utils.ts                    # Utility functions
│
├─ App.tsx                         # Main app component
└─ main.tsx                        # Entry point
```

## 🎨 Key Features

### 1. **Navigation**
- **Sidebar**: Collapsible sidebar with icons and labels
- **Topbar**: Notifications, user menu, and sidebar trigger

### 2. **Pages**

#### Dashboard
- Patient profile card with basic info, blood type, allergies
- Health metrics (blood pressure, weight)
- Upcoming appointments preview
- Recent activity feed
- Quick action cards for common tasks

#### Timeline
- Chronological health events (appointments, medications, treatments)
- Expandable event details
- Month-grouped display with visual timeline line
- Type-based color coding and icons

#### AI Health Guide
- Real-time streaming chat interface
- Quick prompt suggestions
- Compassionate AI responses in plain language
- Typing indicators and smooth animations

#### Appointments
- Upcoming and past appointments
- Type badges (In-Person, Telehealth)
- Provider, date, time, location details
- Reminder functionality

#### Documents
- Categorized medical documents (Lab Results, Letters, Imaging, Prescriptions, Reports)
- Search and filter functionality
- View and download actions
- Upload document prompt

#### Settings
- Language selection
- Notification preferences (toggles for different types)
- Account information (editable)
- Security & privacy options

### 3. **Components**

#### Timeline Components
- `TimelineItem`: Individual event card with expand/collapse
- `TimelineList`: Grouped timeline with month headers

#### Chat Components
- `ChatBubble`: User and assistant message bubbles
- `QuickPromptCard`: Clickable suggestion cards

#### Document Components
- `DocumentCard`: Document display with metadata and actions

#### UI Components
- Reusable action cards, modals, and form elements
- Shadcn UI components for consistent design

### 4. **Mock APIs**
All API functions simulate backend calls with delays:
- `getPatientTimeline()`: Fetch timeline events
- `getPatientProfile()`: Fetch patient information
- `sendAIQuery()`: Send chat messages to AI
- `getDocuments()`: Fetch medical documents

### 5. **Design System**
- Healthcare-focused color palette:
  - Primary: Medical blue (#2563EB)
  - Secondary: Wellness green (#10B981)
  - Accent: Warm coral (#F97316)
- Smooth animations and transitions
- Responsive layouts
- Semantic HSL color tokens

## 🚀 Technologies

- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn UI** - Component library
- **Lucide React** - Icons
- **React Router** - Navigation
- **TanStack Query** - Data fetching

## 📦 Backend Integration (Lovable Cloud)

The app is ready for backend integration:
- **Database**: Store timeline events, appointments, documents
- **Authentication**: User login and data isolation
- **AI**: Real AI chat via Lovable AI Gateway (already implemented)
- **Storage**: Document uploads with Supabase Storage

## 🎯 Next Steps

1. **Authentication**: Add user login and signup
2. **Database**: Connect to Supabase for data persistence
3. **Real Documents**: Enable file uploads and storage
4. **Notifications**: Implement actual email/SMS notifications
5. **Export**: PDF generation for health records
