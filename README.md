# Personal Class Calendar

Single-page web app for a one-week class schedule with Firebase Firestore storage.

- Weekly grid (Mon–Sun, time slots: 10:30, 1:30, 4:30, 7:30)
- Click a cell to add a class, or click an existing class to edit
- Each class: Course code, section, room, absences counter
- Multi-slot classes supported (e.g. 4:30–7:30 merges vertically)
- Per-class modal with assignments/deliverables list and sticky input bar
- Data saved in Firebase Firestore (`classes` collection)

---

## 1. How to run the app

1. Open the folder in VS Code / your IDE:

   ```text
   c:/Users/jcisi/Documents/IT Projects/Personal Class Calendar
   ```

2. Use a simple static server to avoid CORS issues, for example:

   - VS Code Live Server extension, or
   - Python (if installed):

     ```bash
     python -m http.server 5500
     ```

3. In your browser, open:

   ```text
   http://localhost:5500/index.html
   ```

You can also just double-click `index.html`, but some browsers block ES module imports from `file://` URLs, so a local server is recommended.

---

## 2. Firebase setup (Firestore)

You haven’t created anything in Firebase yet, so follow these steps.

### 2.1 Create a Firebase project

1. Go to <https://console.firebase.google.com/> and sign in.
2. Click **Add project** (or **Create project**).
3. Name it something like **personal-class-calendar**.
4. Disable Google Analytics if you don’t care (simpler), then create the project.

### 2.2 Add a Web App to the project

1. In your new project, click the **Web** (`</>`) icon: **Add app**.
2. App nickname: `class-calendar-web` (or anything).
3. Do **not** enable Hosting for now (optional).
4. Click **Register app**.
5. You’ll see a config snippet like:

   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

6. Copy that object.

### 2.3 Enable Firestore

1. In the left sidebar of the Firebase console, click **Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (recommended) or test mode if you prefer while you experiment.
4. Pick the default location.

For development you can use a relaxed rule like this while you experiment (optional, but convenient):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Remember this is **not secure for a public app**; since this is just for you locally it’s normally fine. You can tighten it later if needed.

To edit rules:

1. In Firestore, open the **Rules** tab.
2. Paste the rules above and click **Publish**.

---

## 3. Connect this app to your Firebase project

1. Open `firebase-config.js` in your editor.
2. Replace the `firebaseConfig` object with the one from your Firebase project.

Example shape (do **not** paste this literally; use your own values):

```js
const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
};
```

3. Save the file and refresh the browser.
4. Open your browser dev tools console: you should **not** see Firebase errors.

Backend-wise, the app uses a single collection:

- Collection: `classes`
- Document ID: generated per class (e.g. `cls_...`)

Each document roughly looks like:

```json
{
  "id": "cls_...",
  "day": "monday",              // monday..sunday
  "startIndex": 1,               // 0 = 10:30, 1 = 1:30, 2 = 4:30, 3 = 7:30
  "endIndex": 2,
  "courseCode": "ABC 123",
  "section": "AB12C3",
  "room": "A-1234",
  "absences": 0,
  "assignments": [
    { "id": "a1", "title": "Quiz 1", "dueDate": "2025-04-01", "completed": false }
  ]
}
```

You never need to create these documents manually; the UI handles it.

---

## 4. Using the UI

### 4.1 Adding a class

1. Click on an empty grid cell.
2. In the modal:

   - **Course Code**: e.g. `CPE 101` or `CP 101`.
   - **Section**: e.g. `AB12C3`.
   - **Room**: e.g. `A-1234` or `A-1234B`.
   - **Absences**: use the `-` / `+` buttons.
   - **Time Block**: choose start and end slots (for merged cells, e.g. 4:30 to 7:30).
   - **Day**: select the day.

3. Click **Save Class**.

The cells spanning that time range on that day will merge visually into one block.

### 4.2 Editing a class

1. Click on a class block (any part of the merged area).
2. Adjust fields, absences, or assignments.
3. Click **Save Class** again.

### 4.3 Assignments / deliverables

Inside the class modal:

- The list of assignments is in the center section.
- The **bottom bar is sticky**:

  - Type a title.
  - (Optional) set a due date.
  - Click **Add** or press Enter while the title input is focused.

Each assignment has:

- A **check pill**: click to mark as completed / uncompleted.
- A small **× button** to delete it.

Assignments are also stored in the same Firestore document for that class.

### 4.4 Clearing the view

- **Clear All (Local Only)** in the header wipes the in-memory schedule so you can quickly mock changes.
- Refresh the page to reload everything from Firestore.

---

## 5. Customization ideas

You can tweak these yourself any time:

- Add more time slots by editing `TIME_SLOTS` in `app.js` and adjusting styles if needed.
- Change color theme in `style.css` (the `:root` variables at the top).
- Add more fields to assignments (notes, type, etc.) and persist them in `app.js`.

If you want, you can ask me later to:

- Tighten Firestore security rules for your specific use.
- Add filters (e.g. show only days with classes).
- Add export/import of your schedule.
