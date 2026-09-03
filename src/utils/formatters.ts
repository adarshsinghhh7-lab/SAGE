export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function formatCategoryLabel(category: string): string {
  const norm = (category || '').toLowerCase().replace('/', '_');
  switch (norm) {
    case 'infrastructure': return 'Infrastructure';
    case 'mess':
    case 'mess_food': return 'Mess/Food';
    case 'harassment': return 'Harassment';
    case 'wifi':
    case 'wifi_internet': return 'WiFi/Internet';
    case 'hygiene': return 'Hygiene';
    case 'other':
    default: return 'Other';
  }
}

export function formatStatusLabel(status: string): string {
  const norm = (status || '').toLowerCase().replace(' ', '_');
  switch (norm) {
    case 'submitted': return 'Submitted';
    case 'under_review': return 'Under Review';
    case 'resolved': return 'Resolved';
    default: return status || 'Submitted';
  }
}

export function getCategoryBadgeStyle(category: string): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  const norm = (category || '').toLowerCase().replace('/', '_');
  switch (norm) {
    case 'infrastructure':
      return {
        bg: 'bg-sky-100',
        text: 'text-sky-900',
        border: 'border-sky-400/50',
        indicator: 'bg-sky-500',
      };
    case 'mess':
    case 'mess_food':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-900',
        border: 'border-amber-400/50',
        indicator: 'bg-amber-500',
      };
    case 'harassment':
      return {
        bg: 'bg-rose-100',
        text: 'text-rose-900',
        border: 'border-rose-400/50',
        indicator: 'bg-rose-500',
      };
    case 'wifi':
    case 'wifi_internet':
      return {
        bg: 'bg-violet-100',
        text: 'text-violet-900',
        border: 'border-violet-400/50',
        indicator: 'bg-violet-500',
      };
    case 'hygiene':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-900',
        border: 'border-emerald-400/50',
        indicator: 'bg-emerald-500',
      };
    case 'other':
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-400/50',
        indicator: 'bg-slate-500',
      };
  }
}

/**
 * Badge style for the AI-Flagged Urgent indicator.
 * Distinct purple/violet palette so it is visually separate from the
 * red "High Priority" (upvote-based) badge.
 */
export function getAiFlaggedBadgeStyle(): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  return {
    bg: 'bg-violet-100',
    text: 'text-violet-950',
    border: 'border-violet-600',
    indicator: 'bg-violet-600 animate-pulse',
  };
}

/**
 * Badge style for the upvote-based High Priority indicator.
 * Red palette — visually distinct from the purple AI-Flagged badge.
 */
export function getHighPriorityBadgeStyle(): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  return {
    bg: 'bg-red-100',
    text: 'text-red-950',
    border: 'border-red-600',
    indicator: 'bg-red-600 animate-pulse',
  };
}

export function getStatusBadgeStyle(status: string, urgency?: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const normStatus = (status || '').toLowerCase().replace(' ', '_');
  const isUrgent = urgency === 'Urgent' || urgency === 'urgent';

  if (isUrgent && normStatus !== 'resolved') {
    return {
      bg: 'bg-gradient-to-r from-red-50 to-rose-100',
      text: 'text-red-900',
      border: 'border-red-400',
      dot: 'bg-red-500 animate-pulse',
    };
  }

  switch (normStatus) {
    case 'submitted':
      return {
        bg: 'bg-gradient-to-r from-slate-50 to-blue-50',
        text: 'text-slate-800',
        border: 'border-slate-300',
        dot: 'bg-slate-500',
      };
    case 'under_review':
      return {
        bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
        text: 'text-amber-900',
        border: 'border-amber-400',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'resolved':
      return {
        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
        text: 'text-emerald-900',
        border: 'border-emerald-400',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        bg: 'bg-gradient-to-r from-slate-50 to-gray-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        dot: 'bg-slate-500',
      };
  }
}

export function generateComplaintId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SAGE-${randomNum}`;
}
