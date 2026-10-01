# Smart Breakfast

## Overview
Smart Breakfast is a web application that enables office teams to organise and order breakfast collectively. It provides a shared ordering room where users can add their favourite items, see a live countdown, and a backend processes receipt entry and bill approval. The frontend is built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

## Main Features
- **User authentication** with token‑based (JWT) login and sign‑up.
- **Role‑based access** – `ADMIN` and `USER` dashboards.
- **Admin capabilities**:
  - Open and manually close breakfast rooms.
  - Manage restaurants and menus.
  - Enter paper receipts for closed rooms.
  - Approve final bills.
  - View and manage team accounts.
- **User capabilities**:
  - Browse available restaurants and menus.
  - Join an open breakfast room, add items to a cart.
  - Review and place an order before the room expires.
  - View personal bills and order history.
- **Real‑time countdown** for open rooms.
- Centralised API client handling auth headers and error mapping.
- UI built with Tailwind CSS utility classes.

## User Roles
| **ADMIN** | Office administrator who can create/open rooms, manage restaurant data, process receipts and approve bills. 
| **USER** | Regular employee who can join an open room, select items, view cart, place orders and view personal billing history. 

## Core Application Flow
1. **Authentication** – Users sign up or log in via `/authentication/signup` or `/authentication/login`. The forms use **react‑hook‑form** with **Zod** validation. Upon success the backend returns a JWT token and user info, which are stored in `localStorage` (`breakfast_token`, `breakfast_user`).
2. **Role redirect** – After authentication the client redirects to `/admin` for admins or `/user/dashboard` for regular users.
3. **Admin creates a room** – From the Admin Dashboard an admin clicks **Open Breakfast Room** (link to `/admin/open-new-room`). This creates a new room via the API and becomes visible to users.
4. **User browses rooms** – Users navigate to `/user/rooms` to see a list of live rooms. Selecting a room shows its details and menu.
5. **Selecting products** – Inside a room the user views the restaurant menu (`/user/restaurants/[restaurantId]`) and adds items to a cart (`/user/rooms/[roomId]/cart`).
6. **Review order** – The cart page displays selected items and a running total. The user confirms the order, which is submitted to the backend.
7. **Room closure** – When the countdown expires the room status changes to `CLOSED`; no further items can be added. Admins may also close a room manually from the Admin Dashboard.
8. **Receipt entry (admin)** – For a closed room the admin enters the paper receipt amount (`/admin/rooms/[roomId]/receipt`).
9. **Bill approval (admin)** – After a receipt is entered, the admin approves the final bill (`/admin/rooms/[roomId]/approval`).
10. **User billing** – Users can view their personal bill (`/user/my-bill`) and historical orders (`/user/my-orders`).

## Important Business Rules
- **Room lifecycle** – A room is created with an expiration time. Once the countdown reaches zero, the room becomes `CLOSED` and cannot accept new items.
- **Receipt handling** – An admin must provide a receipt total for a closed room before the bill can be approved.
- **Role‑based routing** – The API returns `role: "ADMIN" | "USER"`. The client stores this and redirects accordingly after login/sign‑up.
- **Auth persistence** – Tokens are stored in `localStorage`. The custom `apiRequest` helper automatically adds the `Authorization: Bearer <token>` header when `authRequired` is true.
- **Form validation** – All forms use Zod schemas (`features/auth/schemas/auth`) enforced client‑side via `react-hook-form`.

## Technology Stack
- **Framework**: Next.js 16 (App Router) – `next`
- **Language**: TypeScript 5 (strict mode, `noEmit` for type‑checking) – `typescript`
- **Styling**: Tailwind CSS v4 (integrated via PostCSS) – `tailwindcss`, `@tailwindcss/postcss`
- **State Management**: Redux Toolkit – `@reduxjs/toolkit`, `react-redux`
- **Form handling**: React Hook Form – `react-hook-form`, Zod – `zod`, resolver – `@hookform/resolvers`
- **Icons**: Feather icons via React‑Icons – `react-icons`
- **API client**: Custom `apiRequest` wrapper (`features/shared/api/client.ts`) handling JSON bodies, auth headers, and error mapping.
- **UI components**: Local component library under `components/` (Button, Input, Modal, StatCard, StatusChip, Skeleton, etc.)
- **Build tools**: Next.js default bundler (Turbopack)
- **Package manager**: npm (scripts in `package.json`)
