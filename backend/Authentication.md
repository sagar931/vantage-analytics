# Vantage Security & Authentication Architecture

## 1. Executive Summary (Business Perspective)
Vantage employs a **"Zero-Trust, Local-First"** security model designed specifically for internal banking environments where data privacy is paramount. Unlike traditional web apps that store data in the cloud, Vantage operates entirely on the user's local machine, ensuring that **Barclays sensitive data never leaves the secure corporate endpoint.**

### Key Business Security Features:
* **No Cloud Storage:** All Excel models and logic files remain on the employee's encrypted hard drive.
* **Double-Lock Protection:** Access requires both **App Authentication** (Password) AND **Browser Permission** (File System API), making remote attacks virtually impossible.
* **Automatic Compliance:** Sessions adhere to strict 8-hour workdays with idle lockouts and auto-expiry, meeting internal compliance standards.
* **Role-Based Isolation:** Authentication is decoupled from data. Even if a user authenticates, they can only "see" the files they physically possess on their device.

---

## 2. Technical Architecture (End-to-End Flow)

### A. The "Double-Gate" Protocol
Vantage uses a hybrid security model combining **JWT (JSON Web Tokens)** for app access and **Native File System API** for data access.

#### Gate 1: Application Access (The Identity Layer)
1.  **Credential Storage:**
    * User credentials are stored in a local encrypted JSON file (`barclays_auth.vlm`) on the host server.
    * **Encryption:** Passwords are salted and hashed using `bcrypt` (Cost factor 10), rendering them unreadable even to admins.
    * *Security Note:* Raw passwords never touch the disk.

2.  **The Handshake (Login Flow):**
    * **Client:** Sends `SHA-256` protected credentials to `localhost:3001/api/auth/login`.
    * **Server:** Validates hash -> Checks Lockout Status -> Issues **Signed JWT**.
    * **Token Anatomy:** The JWT contains the User ID and `exp` (Expiration Timestamp). It is signed with a high-entropy `JWT_SECRET` known only to the backend.

3.  **Active Session Monitoring:**
    * The Frontend `AuthContext` runs a **"Heartbeat"** check every 30 seconds.
    * It validates the token against the server. If the server detects the token is expired, invalid, or the user has been revoked, it forces an immediate **Client-Side Wipe**, redirecting the user to login instantly.

#### Gate 2: Data Access (The Browser Sandbox)
* **Zero-Knowledge Backend:** The Node.js auth server **does not** have access to the Excel files. It only handles identity.
* **User Gesture Requirement:** Modern browsers (Chrome/Edge) block programmatic access to local files.
* **The Physical Key:** Even after logging in, the user must manually click "Open Data Directory". This grants a **transient, non-persisted** handle to the file system.
* **Refresh Protection:** If the user refreshes the page, the browser intentionally "forgets" this handle. The user must re-authorize, preventing session hijacking via persistent scripts.

---

## 3. Attack Vector Analysis

| Threat Scenario | Mitigation Strategy | Result |
| :--- | :--- | :--- |
| **Database Theft** | Attacker steals `barclays_auth.vlm` | **Fail:** Passwords are bcrypt-hashed and cannot be reverse-engineered. |
| **Session Hijacking** | Attacker copies `sessionStorage` token | **Fail:** Token is bound to `exp` time. Server validates it every 30s. |
| **Remote Access** | Attacker gains network access to IP | **Fail:** Browser File System API blocks non-local file access. Attacker cannot see files. |
| **Brute Force** | Script guesses passwords | **Blocked:** Account locks for 3 hours after 3 failed attempts. |

## 4. Operational Security
* **No External Dependencies:** The auth system runs offline (`localhost`). No calls to Firebase, AWS, or Auth0.
* **Audit Trail:** The backend logs (console) every login attempt, validation check, and lockout event for forensic review.