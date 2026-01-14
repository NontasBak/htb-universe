# HTB Universe

A metadata management and progress tracking application for the Hack The Box platform, connecting HTB Academy modules with HTB Labs machines.

## Deployment
The website can be previewed on https://htb-universe.nontasbak.com

## Tech Stack

- **Language:** TypeScript
- **Frontend:** React, Vite, React Router, Tailwind CSS
- **UI Components:** Shadcn UI with Base UI
- **Backend:** Express
- **Authentication:** Better-Auth
- **Database:** MySQL
- **Monorepo:** better-t-stack

## Prerequisites

- **Node.js** (v20 or higher)
- **MySQL** (v8.0 or higher)

### 1. Install Dependencies

```bash
cd stack
npm install
cd ..
```

### 2. Setup MySQL User (if needed)

If you don't have a MySQL user set up yet, run:

```bash
sudo mysql < database/create-user.sql
```

This creates a user `db_admin` with password `admin_pass`.

### 3. Import Database Dump

```bash
mysql -u db_admin -p < database/htb-data-dump.sql
```

Enter the password when prompted: `admin_pass`

### 4. Configure Environment Variables

**Backend:** Copy and configure `stack/apps/server/.env`:

```bash
cp stack/apps/server/.env.example stack/apps/server/.env
```

The default values should work.

**Frontend:** Copy and configure `stack/apps/web/.env`:

```bash
cp stack/apps/web/.env.example stack/apps/web/.env
```

The default values should work here as well.

### 5. Run the Application

```bash
cd stack
npm run dev
```

This starts:
- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:5173

> [!NOTE] 
> The website can also be previewed on https://htb-universe.nontasbak.com

## Test Accounts

You can log in with these pre-made accounts:

**Simple User:**
- Email: `test@test.com`
- Password: `12341234`

**Admin User:**
- Email: `admin@admin.com`
- Password: `admin1234`

## Database Schema & Authentication

There are 16 application-specific tables. Since the application uses Better-Auth for authentication, it automatically creates 4 extra tables:

- **`user`** - Authentication records (Better-Auth managed)
- **`account`** - OAuth provider accounts
- **`session`** - User sessions
- **`verification`** - Email verification tokens
