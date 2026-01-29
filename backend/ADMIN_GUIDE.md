# Vantage User Management Guide

## Overview
The **Vantage Admin Tool** (`admin-tool.js`) is a secure, command-line interface (CLI) for managing user access to the Vantage Analytics Platform.

It operates directly on the local encrypted credential file (`barclays_auth.vlm`) and does not require an internet connection or external database.

---

## ⚡️ Quick Reference

| Action | Command |
| :--- | :--- |
| **Add User** | `node admin-tool.js add <email> <password> <name> <dept>` |
| **List Users** | `node admin-tool.js list` |
| **Remove User** | `node admin-tool.js remove <email>` |

---

## 🛠️ Setup & Prerequisites

Ensure you are in the `backend` directory where the tool is located.

1. **Open Terminal**
   ```bash
   cd backend