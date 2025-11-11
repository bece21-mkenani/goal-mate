# GOAL MATE FIRST VERSION:

* The AI-Powered education centered tool to bridge the gap between different students at defferent eduaction levels while helping them to have personalised studies and tracked learning path.

* In simple terms goal Mate is a comprehensive, full-stack application designed to help students organize, study, and collaborate. It combines the power of AI for personalized learning with real-time, secure group chat features, all managed by a powerful admin dashboard.

* Goal Mate admin Dashboard photo
* 
![Goal Mate admin Dashboard](https://tfdghduqsaniszkvzyhl.supabase.co/storage/v1/object/public/group_files/Screenshot%202025-11-11%20214304.png)


* Goal Mate analytics Photo

![Goal Mate analytics Feature](https://tfdghduqsaniszkvzyhl.supabase.co/storage/v1/object/public/group_files/Screenshot%202025-11-08%20175309.png)

---

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
