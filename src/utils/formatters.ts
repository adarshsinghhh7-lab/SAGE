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
        bg: 'bg-slate-100',
        text: 'text-slate-900',
        border: 'border-slate-900/30',
        indicator: 'bg-slate-900',
      };
    case 'mess':
    case 'mess_food':
      return {
        bg: 'bg-amber-50/80',
        text: 'text-amber-950',
        border: 'border-amber-900/30',
        indicator: 'bg-amber-800',
      };
    case 'harassment':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-300/40',
        indicator: 'bg-indigo-600',
      };
    case 'wifi':
    case 'wifi_internet':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-900',
        border: 'border-slate-900/30',
        indicator: 'bg-slate-700',
      };
    case 'hygiene':
      return {
        bg: 'bg-emerald-50/80',
        text: 'text-emerald-950',
        border: 'border-emerald-900/30',
        indicator: 'bg-emerald-800',
      };
    case 'other':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-800',
        border: 'border-slate-400',
        indicator: 'bg-slate-600',
      };
  }
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
      bg: 'bg-red-100',
      text: 'text-red-950',
      border: 'border-red-500',
      dot: 'bg-red-600 animate-pulse',
    };
  }

  switch (normStatus) {
    case 'submitted':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        dot: 'bg-slate-600',
      };
    case 'under_review':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-950',
        border: 'border-amber-400',
        dot: 'bg-amber-600 animate-pulse',
      };
    case 'resolved':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-950',
        border: 'border-emerald-500',
        dot: 'bg-emerald-700',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        dot: 'bg-slate-600',
      };
  }
}

export function generateComplaintId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SAGE-${randomNum}`;
}
