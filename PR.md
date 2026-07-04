# Pull Request: Ticket Filtering and SLA Status Indicator

This PR implements two major enhancements to the DeskLine application: ticket list filtering and an SLA status indicator.

## What Changed

### 1. Ticket List Filtering
- **Backend**:
  - Exposed `GET /users` endpoint in [users.routes.ts](file:///Users/janinduhemachandra/Desktop/se/api/src/users/users.routes.ts) to list all agents alphabetically.
  - Added query validation schema `listTicketsQuerySchema` in [tickets.schema.ts](file:///Users/janinduhemachandra/Desktop/se/api/src/tickets/tickets.schema.ts) to parse and cast status, `assigneeId` (preprocessed for `null`), and `assigneeName`.
  - Refactored `listTickets()` in [tickets.repository.ts](file:///Users/janinduhemachandra/Desktop/se/api/src/tickets/tickets.repository.ts) to build dynamic query parameters and replace the slow N+1 query loop with an optimized single JOIN query.
- **Frontend**:
  - Added Status and Assignee dropdown filters to the [TicketList.tsx](file:///Users/janinduhemachandra/Desktop/se/web/src/TicketList.tsx) component.
  - Configured Vite proxy to forward `/users` requests to the backend server.
  - Handled combined filters and provided a "Clear Filters" button in the UI.

### 2. SLA Status Indicator
- **Backend**:
  - Extended the ticket mapping logic in [mappers.ts](file:///Users/janinduhemachandra/Desktop/se/api/src/mappers.ts) to compute `slaStatus` (`'ok' | 'breached' | null`).
  - Marked resolved tickets based on resolution time, and active tickets based on current time elapsed since creation.
  - Set `slaStatus` to `null` for closed tickets that do not have a resolution timestamp.
- **Frontend**:
  - Added an "SLA Status" column in [TicketList.tsx](file:///Users/janinduhemachandra/Desktop/se/web/src/TicketList.tsx).
  - Surface status as soft green ("Within SLA"), red ("Breached"), or dash (`—`) badges. Added styling to [styles.css](file:///Users/janinduhemachandra/Desktop/se/web/src/styles.css).

---

## How to Review

### 1. Automated Tests
Run the Vitest test suite on the backend to verify correctness of filtering logic, combined queries, alphabetical user sorting, and SLA resolution checks:
```bash
npm test
```
*(All 15 tests should pass successfully)*

### 2. Manual Walkthrough
1. Run the database container: `docker compose up -d`
2. Seed the data: `npm run seed`
3. Launch local servers:
   - Backend: `npm run dev:api`
   - Frontend: `npm run dev:web`
4. Open the browser at `http://localhost:5173/` and verify:
   - The **SLA Status** column correctly shows green, red, or dash badges.
   - The **Status** filter isolates tickets by status.
   - The **Assignee** filter dropdown populates agent names and filters correctly (including "Unassigned").
   - Combining both filters functions properly.
