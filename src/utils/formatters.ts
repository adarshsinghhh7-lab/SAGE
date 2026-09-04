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

/**
 * Category tab colors — muted palette for folder-tab styling.
 * These differ from Tailwind defaults and are tuned for a kraft-paper surface.
 */
export function getCategoryTabColor(category: string): string {
  const norm = (category || '').toLowerCase().replace('/', '_');
  switch (norm) {
    case 'infrastructure': return '#5B7A8D';
    case 'mess':
    case 'mess_food': return '#8B7340';
    case 'harassment': return '#8B4050';
    case 'wifi':
    case 'wifi_internet': return '#5B6B8D';
    case 'hygiene': return '#5B7D5B';
    case 'other':
    default: return '#7D7568';
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
        bg: 'bg-[#5B7A8D]/15',
        text: 'text-[#5B7A8D]',
        border: 'border-[#5B7A8D]/40',
        indicator: 'bg-[#5B7A8D]',
      };
    case 'mess':
    case 'mess_food':
      return {
        bg: 'bg-[#8B7340]/15',
        text: 'text-[#8B7340]',
        border: 'border-[#8B7340]/40',
        indicator: 'bg-[#8B7340]',
      };
    case 'harassment':
      return {
        bg: 'bg-[#8B4050]/15',
        text: 'text-[#8B4050]',
        border: 'border-[#8B4050]/40',
        indicator: 'bg-[#8B4050]',
      };
    case 'wifi':
    case 'wifi_internet':
      return {
        bg: 'bg-[#5B6B8D]/15',
        text: 'text-[#5B6B8D]',
        border: 'border-[#5B6B8D]/40',
        indicator: 'bg-[#5B6B8D]',
      };
    case 'hygiene':
      return {
        bg: 'bg-[#5B7D5B]/15',
        text: 'text-[#5B7D5B]',
        border: 'border-[#5B7D5B]/40',
        indicator: 'bg-[#5B7D5B]',
      };
    case 'other':
    default:
      return {
        bg: 'bg-[#7D7568]/15',
        text: 'text-[#7D7568]',
        border: 'border-[#7D7568]/40',
        indicator: 'bg-[#7D7568]',
      };
  }
}

/**
 * Badge style for the AI-Flagged Urgent indicator.
 * Uses stamp-red for urgency.
 */
export function getAiFlaggedBadgeStyle(): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  return {
    bg: 'bg-[#A6352C]/10',
    text: 'text-[#A6352C]',
    border: 'border-[#A6352C]/60',
    indicator: 'bg-[#A6352C]',
  };
}

/**
 * Badge style for the upvote-based High Priority indicator.
 * Uses stamp-red for urgency.
 */
export function getHighPriorityBadgeStyle(): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  return {
    bg: 'bg-[#A6352C]/10',
    text: 'text-[#A6352C]',
    border: 'border-[#A6352C]/60',
    indicator: 'bg-[#A6352C]',
  };
}

/**
 * Status badge style — rubber-stamp treatment with case-file palette.
 * No gradient backgrounds. Flat, monochrome, bureaucratic.
 */
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
      bg: 'bg-[#A6352C]/10',
      text: 'text-[#A6352C]',
      border: 'border-[#A6352C]/60',
      dot: 'bg-[#A6352C]',
    };
  }

  switch (normStatus) {
    case 'submitted':
      return {
        bg: 'bg-[#5B6472]/10',
        text: 'text-[#5B6472]',
        border: 'border-[#5B6472]/40',
        dot: 'bg-[#5B6472]',
      };
    case 'under_review':
      return {
        bg: 'bg-[#B08D3E]/10',
        text: 'text-[#B08D3E]',
        border: 'border-[#B08D3E]/40',
        dot: 'bg-[#B08D3E]',
      };
    case 'resolved':
      return {
        bg: 'bg-[#5B7D5B]/10',
        text: 'text-[#5B7D5B]',
        border: 'border-[#5B7D5B]/40',
        dot: 'bg-[#5B7D5B]',
      };
    default:
      return {
        bg: 'bg-[#5B6472]/10',
        text: 'text-[#5B6472]',
        border: 'border-[#5B6472]/40',
        dot: 'bg-[#5B6472]',
      };
  }
}

export function generateComplaintId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SAGE-${randomNum}`;
}
