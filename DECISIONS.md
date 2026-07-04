# Decision Log

## Assumptions I made
- Created a `GET /users` endpoint to fetch agents for the assignee filter dropdown.
- Filter by "Unassigned" sends `assigneeId=null` to query `assignee_id is null`.
- Filter by specific agents uses name-based matching (`assigneeName`) instead of IDs.
- Set `slaStatus` to `null` for closed tickets that do not have a resolution time.

## Design decisions
- Optimized backend query to use `LEFT JOIN` and subqueries, removing N+1 loop queries.
- Used Zod `preprocess` to parse query strings (e.g. `'null'` mapped to `null`, numeric strings cast to numbers).
- Decided to compute SLA status on backend during DTO mapping rather than in SQL.
- Styled SLA indicators using soft green (Within SLA) and red (Breached) badges.

## Where I used AI
- Utilized AI to draft initial Zod schema validation and JSX selectors.

## Anything I noticed in the existing code
- The original repository performed query executions inside a loop for each ticket. Consolidated this into a single optimized database call.

## What I'd do with more time
- Add offset pagination to handle large datasets.
- Implement real-time status updates/caching.
- Add a warning if the ticket is about to breach the SLA