# GOAL MATE FIRST VERSION:

* The AI-Powered education centered tool to bridge the gap between different students at defferent eduaction levels while helping them to have personalised studies and tracked learning path.

* In simple terms goal Mate is a comprehensive, full-stack application designed to help students organize, study, and collaborate. It combines the power of AI for personalized learning with real-time, secure group chat features, all managed by a powerful admin dashboard.

*
  

[Goal Mate Live Demo](https://goal-mate-rose.vercel.app/)


## Core Features


* **Advanced Group Chat:**


     * **This is where users connect and engage — primarily in general groups.**

     * **All users can ask questions, share ideas, and get clarification from others.**

     * **Each user has access to only two groups:**

       - **General Group** — open to everyone.

       - **Education-Level Group** (*Primary*, *Secondary*, or *Tertiary*) — assigned based on the user’s selected education level  

    * **Users are allowed to set their education level only once.** 

    * Any future changes can **only be made by an admin** through the Admin Dashboard.  

    * **This restriction is designed to **enhance security** and **maintain group integrity**across the platform.**

    * **Real-time Communication:** Built with Socket.io for instant messaging.

    * **Secure Rooms:** Features a main "general" room and three education-level-locked rooms (Primary, Secondary, Tertiary).

    * **User Security:** Backend logic prevents users from joining or posting in rooms that don't match their **one-time-set** education level.

    * **Rich Features:** Includes typing indicators, read receipts, emoji reactions, and a list of online users.

    * **File Uploads:** Users can upload images, PDFs, and text files directly to the chat, securely stored in Supabase Storage.**

* **AI Chatbot:** An integrated chatbot (powered by Google's Gemini) to answer questions and assist with learning.  

* **Admin Dashboard:**

    * **App Statistics:** A private, secure dashboard showing total users, premium users, and total groups.

    * **User Management:** Admins can view all users and directly change their **subscription tier** (Free/Premium) or their 
    **education level**.

    * **Admin Announcements:** A form for admins to broadcast messages to any of the specific chat rooms.

* **Push Notifications:** Uses web push notifications to alert users of upcoming study sessions, flashcard reviews, and new chat messages when they are offline.


* **Analytics** Give and overview of the study sesions and an insight of which course is give enought time.

* **Timer** Enable a student to keep track of number of hours spent during studying.

* **Profile** Here there is achieve section to motivate students on their studies, study tips and  Stat sction to keep track, set notification features and also a tool for a student to set education level
  
* **Study plan generator** a tool that is helping student to to be to set flexible time table, eliminating the need of having manual time table, it is an AI powered feature




---

## Tech Stack

### Frontend

* **React** (with Vite)

* **TypeScript**

* **Tailwind CSS**

* **Framer Motion** (for animations)

* **Socket.io Client**

* **Axios**

### Backend

* **Node.js**

* **Express**

* **TypeScript**

* **Socket.io**

* **Supabase** (PostgreSQL Database, Auth, Storage)

* **Google Gemini API** (for all AI features)

* **Multer** (for file uploads)

* **Web-Push** (for notifications)

* **node-cron** (for scheduled jobs)
  
# Goal-Mate Project Structure

```
goal-mate/
├── backend/
│   ├── .env                      # Backend secrets and keys
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── middleware/
│       │   ├── admin.middleware.ts    # Gatekeeper for admin-only routes
│       │   └── auth.middleware.ts     # Gatekeeper for all logged-in users
│       ├── ai.service.ts
│       ├── AnalyticsService.ts
│       ├── auth.service.ts            # Handles sign-up, sign-in, and admin logic
│       ├── FlashcardService.ts
│       ├── GroupService.ts            # Core logic for groups, rooms, and messages
│       ├── NotificationService.ts
│       ├── StorageService.ts          # Handles file uploads to Supabase
│       ├── study-plan.service.ts
│       ├── UserService.ts
│       └── index.ts                   # Main Express server and Socket.io hub
│
└── frontend/
    ├── .env.local                     # Frontend environment variables
    ├── package.json
    ├── index.html
    └── src/
        ├── assets/
        ├── components/
        │   ├── AdminDashboard.tsx     # Admin UI
        │   ├── AuthForm.tsx
        │   ├── Chat.tsx               # AI Chatbot UI
        │   ├── GroupChat.tsx          # Main group chat component
        │   ├── Navbar.tsx
        │   ├── StudyGroups.tsx        # The group lobby
        │   ├── UserProfile.tsx
        │   └── ... (other components)
        ├── contexts/
        │   └── SocketContext.tsx      # Manages the global Socket.io connection
        ├── hooks/
        │   └── usePushNotifications.ts
        ├── App.tsx                    # Main app router and state
        └── main.tsx
```

## Getting Started: How to Run Locally

To clone and run this project, you'll need to set up both the backend server and the frontend client.

### Prerequisites

* Node.js (v18 or later)

* pnpm

* A Supabase account (you will need a Project URL, anon key, and service key)

* A Google AI Studio API Key (for Gemini)


### 1. Backend Setup (`/backend`)


1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/goal-mate.git](https://github.com/your-username/goal-mate.git)
    cd goal-mate/backend
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Create your environment file:**

    Create a file named `.env` in the `/backend` directory and add your secret keys.

    ```env
    # Port for the server
    PORT=3036

    # Supabase Keys

    SUPABASE_URL=https://<your-project-id>.supabase.co

    SUPABASE_KEY=<your-project-anon-key>

    SUPABASE_SERVICE_KEY=<your-project-service-role-key>

    # Google Gemini Key

    GEMINI_API_KEY=<your-gemini-api-key>

    # VAPID Keys for Push Notifications

    # Generate these using `npx web-push generate-vapid-keys`

    VAPID_PUBLIC_KEY=<your-vapid-public-key>

    VAPID_PRIVATE_KEY=<your-vapid-private-key>

    VAPID_SUBJECT=mailto:your-email@example.com
    ```

4.  **Set your Admin ID:**

    In `backend/src/auth.service.ts`, you **must** change the `ADMIN_USER_ID` constant to match your own user ID after you sign up.

    ```typescript
    // src/auth.service.ts
    const ADMIN_USER_ID = 'your-supabase-user-id'; // 
    ```

5.  **Run the backend server:**

    ```bash
    pnpm run dev
    ```

    Your server will be running at `http://localhost:3036`.

### 2. Frontend Setup (`/frontend`)

1.  **Navigate to the frontend directory** in a new terminal:
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Create your environment file:**

    Create a file named `.env.local` in the `/frontend` directory.

    ```env
    # The URL of your backend server

    VITE_API_URL=http://localhost:3036

    # Your Supabase public keys (for auth client)

    VITE_SUPABASE_URL=https://<your-project-id>.supabase.co

    VITE_SUPABASE_KEY=<your-project-anon-key>

    # Your VAPID public key (must match the backend)

    VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
    ```

4.  **Run the frontend client:**

    ```bash
    pnpm run dev
    ```
    Your React app will open at `http://localhost:5173`.

### 3. Supabase Database & Storage Setup

This project will not run without the correct database schema and storage.

1.  **Database:** You must go to the Supabase SQL Editor and create the tables and RLS policies required for the app (e.g., `users`, `study_groups`, `group_members`, `group_messages`, `group_rooms`, `user_education_level`, etc.).

 ## Database Schema

This project relies on several key tables within your Supabase (PostgreSQL) database.

### `users` (Public)

Stores public-facing user data. RLS is enabled.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. Matches `auth.users.id`. |
| `name` | `text` | User's display name. |
| `email` | `text` | User's email. |
| `subscription_tier`| `text` | `free` (default) or `premium`. |
| `created_at` | `timestamptz` | |

### `user_education_level` (Public)

Stores the user's *one-time* education level choice. RLS is enabled.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | `uuid` | **Primary Key / Foreign Key** to `users.id`. |
| `level` | `text` | `primary`, `secondary`, or `tertiary`. |
| `created_at` | `timestamptz` | |


### `study_groups` (Public)

Stores all available study groups.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. |
| `name` | `text` | Name of the group. |
| `description` | `text` | |
| `is_admin_group`| `boolean` | `true` only for the "Goal Mate Admin" group. |
| `created_by` | `uuid` | **Foreign Key** to `users.id`. |


### `group_rooms` (Public)

Defines the chat rooms *within* a group.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. |
| `group_id` | `uuid` | **Foreign Key** to `study_groups.id`. |
| `room_name` | `text` | e.g., "general", "primary", "secondary". |


### `group_members` (Public)
A "join table" that links users to the groups they are in.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. |
| `user_id` | `uuid` | **Foreign Key** to `users.id`. |
| `group_id` | `uuid` | **Foreign Key** to `study_groups.id`. |


### `group_messages` (Public)
Stores every message sent in every room.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. |
| `group_id` | `uuid` | **Foreign Key** to `study_groups.id`. |
| `user_id` | `uuid` | **Foreign Key** to `users.id`. |
| `room_name` | `text` | **Required.** e.g., "general". |
| `content` | `text` | The text message. (Not-null, use `''` for files). |
| `file_url` | `text` | **Nullable.** Public URL from Supabase Storage. |
| `reactions` | `jsonb` | Stores emoji reactions, e.g., `{"👍": ["user_id_1"]}`. |
### `study_plans` (Public)

Stores the AI-generated study plans for each user.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. |
| `user_id` | `uuid` | **Foreign Key** to `users.id`. |
| `plan_data` | `jsonb` | Stores the full generated plan (schedule, topics, etc.). |
| `subjects` | `text[]` | Array of subjects included in the plan. |
| `created_at` | `timestamptz` | When the plan was generated. |


### `flashcard_decks` (Public)

Stores the decks of flashcards created by users.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. |
| `user_id` | `uuid` | **Foreign Key** to `users.id`. |
| `subject` | `text` | The subject of the deck (e.g., "Calculus"). |
| `created_at` | `timestamptz` | |


### `flashcards` (Public)

Stores individual flashcards and their spaced repetition data.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. |
| `deck_id` | `uuid` | **Foreign Key** to `flashcard_decks.id`. |
| `user_id` | `uuid` | **Foreign Key** to `users.id`. |
| `question` | `text` | The "front" of the card. |
| `answer` | `text` | The "back" of the card. |
| `next_review_at`| `timestamptz` | When the card is due for review. |
| `interval` | `integer` | The number of days until the next review. |
| `ease_factor` | `real` | A number representing how "easy" the card is. |


### `user_statistics` (Public)

Tracks gamification and progress metrics for each user.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. |
| `user_id` | `uuid` | **Foreign Key** to `users.id`. (Unique). |
| `total_points` | `integer` | Total points earned. |
| `day_streak` | `integer` | Current consecutive day streak. |
| `last_active_date` | `date` | The last date the user was active. |
| `total_study_time`| `integer` | Total study time in seconds. |
| `subjects_studied`| `text[]` | Array of unique subjects studied. |
| `achievements_earned` | `text[]` | Array of achievement IDs. |


### `push_subscriptions` (Public)

Stores the VAPID push notification subscriptions for users.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. |
| `user_id` | `uuid` | **Foreign Key** to `users.id`. |
| `subscription_info`| `jsonb` | The unique subscription object from the browser. |
| `created_at` | `timestamptz` | |


2.  **Storage:** You must create a new Storage Bucket named `group_files`.

3.  **Bucket Policies:**

    * Make the bucket **public**.

    * Set file size restrictions (e.g., `10MB`).

    * Set allowed MIME type restrictions (e.g., `image/png`, `image/jpeg`, `application/pdf`).

---

## 📖 How to Use Goal Mate

### As a Regular User

1.  **Sign Up:** Create a new account.

2.  **Chat with AI:** Use the "Goal Mate" (Chat) page to ask the AI questions.

3.  **Create a Plan:** Go to "Study Plans," enter your subjects and free time, and let the AI generate a schedule for you.

4.  **Make Flashcards:** Go to "Flashcards," enter a subject, and have the AI generate a deck. You can review them anytime.

5.  **Join Groups:**

    * Go to the "Groups" page and enter the "Goal Mate Admin" group.

    * When you first enter a room, you'll be asked to **select your education level** (or you can set it on your Profile).

    * This choice is **one-time and permanent**.

    * Once set, you can chat in the "general" room and your specific education room (e.g., "secondary"). All other rooms will be 
    visually locked and inaccessible.

### As an Admin

*To become an admin, you must set your User ID in the `backend/src/auth.service.ts` file.*

1.  **Log In:** When you log in as an admin, a new **"Admin"** link will appear in your navbar.

2.  **View Stats:** See real-time counts of all users, premium users, and groups.

3.  **Manage Users:** In the "User Management" table:

    * Change any user's subscription from "free" to "premium" (and back).

    * Change any user's education level to move them to a different room. This is the only way for a user's level to be changed.

4.  **Send Announcements:** Use the "Admin Announcement" form to select a room and broadcast a message to all users in that room.

----
