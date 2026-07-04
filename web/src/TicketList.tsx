import { useEffect, useState } from 'react';
import { request } from './api';
import type { Ticket, User } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch users for the assignee dropdown filter
  useEffect(() => {
    request<User[]>('/users')
      .then(setUsers)
      .catch((err: Error) => console.error('Failed to load users:', err));
  }, []);

  // Fetch tickets when statusFilter or assigneeFilter change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) {
      params.append('status', statusFilter);
    }
    if (assigneeFilter) {
      if (assigneeFilter === 'null') {
        params.append('assigneeId', 'null');
      } else {
        params.append('assigneeName', assigneeFilter);
      }
    }

    const queryStr = params.toString();
    const url = queryStr ? `/tickets?${queryStr}` : '/tickets';

    request<Ticket[]>(url)
      .then(setTickets)
      .catch((err: Error) => setError(err.message));
  }, [statusFilter, assigneeFilter]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setAssigneeFilter('');
  };

  if (error) return <p className="error">{error}</p>;
  if (!tickets) return <p className="muted">Loading tickets…</p>;

  return (
    <div>
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="assignee-filter">Assignee</label>
          <select
            id="assignee-filter"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="">All Assignees</option>
            <option value="null">Unassigned</option>
            {users?.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {(statusFilter !== '' || assigneeFilter !== '') && (
          <button className="btn-clear" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      <table className="ticket-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Status</th>
            <th>SLA Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Comments</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <a href={`#/tickets/${ticket.id}`}>{ticket.subject}</a>
              </td>
              <td>
                <span className={`badge status-${ticket.status}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </td>
              <td>
                {ticket.slaStatus ? (
                  <span className={`badge sla-${ticket.slaStatus}`}>
                    {ticket.slaStatus === 'breached' ? 'Breached' : 'Within SLA'}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td>{ticket.priority}</td>
              <td>{ticket.assigneeName ?? '—'}</td>
              <td>{ticket.commentCount}</td>
              <td>{formatDate(ticket.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
