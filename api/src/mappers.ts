export interface TicketRow {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: number | null;
  sla_hours: number;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
}

export interface CommentRow {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name: string;
  body: string;
  created_at: Date;
}

export interface TicketDto {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: number | null;
  assigneeName: string | null;
  slaHours: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  slaStatus: 'ok' | 'breached' | null;
}

export interface CommentDto {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export function toTicketDto(
  row: TicketRow,
  assigneeName: string | null,
  commentCount: number
): TicketDto {
  let slaStatus: 'ok' | 'breached' | null = null;
  if (!(row.status === 'closed' && row.resolved_at === null)) {
    const created = new Date(row.created_at);
    const resolved = row.resolved_at ? new Date(row.resolved_at) : new Date();
    const diffHours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    slaStatus = diffHours > row.sla_hours ? 'breached' : 'ok';
  }

  return {
    id: row.id,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    assigneeName,
    slaHours: row.sla_hours,
    commentCount,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    resolvedAt: row.resolved_at ? row.resolved_at.toISOString() : null,
    slaStatus,
  };
}

export function toCommentDto(row: CommentRow): CommentDto {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at.toISOString(),
  };
}
