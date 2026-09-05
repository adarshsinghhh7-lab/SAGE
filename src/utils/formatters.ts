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
 * Category accent colors — a restrained, warm earth-and-stone set that stays
 * legible on the light ivory canvas and reads as one family, not six.
 */
export function getCategoryTabColor(category: string): string {
  const norm = (category || '').toLowerCase().replace('/', '_');
  switch (norm) {
    case 'infrastructure': return '#6F8A9C';
    case 'mess':
    case 'mess_food': return '#B3955B';
    case 'harassment': return '#B8776C';
    case 'wifi':
    case 'wifi_internet': return '#818AA8';
    case 'hygiene': return '#6F9C83';
    case 'other':
    default: return '#948B7D';
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
        bg: 'bg-[#6F8A9C]/12',
        text: 'text-[#6F8A9C]',
        border: 'border-[#6F8A9C]/35',
        indicator: 'bg-[#6F8A9C]',
      };
    case 'mess':
    case 'mess_food':
      return {
        bg: 'bg-[#B3955B]/12',
        text: 'text-[#9C7C43]',
        border: 'border-[#B3955B]/35',
        indicator: 'bg-[#B3955B]',
      };
    case 'harassment':
      return {
        bg: 'bg-[#B8776C]/12',
        text: 'text-[#A25648]',
        border: 'border-[#B8776C]/35',
        indicator: 'bg-[#B8776C]',
      };
    case 'wifi':
    case 'wifi_internet':
      return {
        bg: 'bg-[#818AA8]/12',
        text: 'text-[#6B7391]',
        border: 'border-[#818AA8]/35',
        indicator: 'bg-[#818AA8]',
      };
    case 'hygiene':
      return {
        bg: 'bg-[#6F9C83]/12',
        text: 'text-[#4F7C63]',
        border: 'border-[#6F9C83]/35',
        indicator: 'bg-[#6F9C83]',
      };
    case 'other':
    default:
      return {
        bg: 'bg-[#948B7D]/12',
        text: 'text-[#766E60]',
        border: 'border-[#948B7D]/35',
        indicator: 'bg-[#948B7D]',
      };
  }
}

/**
 * Badge style for the AI-Flagged Urgent indicator — soft clay wash.
 */
export function getAiFlaggedBadgeStyle(): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  return {
    bg: 'bg-[#BC6C56]/10',
    text: 'text-[#A2533F]',
    border: 'border-[#BC6C56]/50',
    indicator: 'bg-[#BC6C56]',
  };
}

/**
 * Badge style for the upvote-based High Priority indicator — soft clay wash.
 */
export function getHighPriorityBadgeStyle(): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  return {
    bg: 'bg-[#BC6C56]/10',
    text: 'text-[#A2533F]',
    border: 'border-[#BC6C56]/50',
    indicator: 'bg-[#BC6C56]',
  };
}

/**
 * Badge style for the Disputed (flagged by admin) indicator — amber/ochre wash.
 * Visually distinct from the clay-toned AI-Flagged and High Priority badges so
 * the Head Admin can immediately distinguish a department-admin dispute marking.
 */
export function getDisputedBadgeStyle(): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  return {
    bg: 'bg-[#B89B5E]/12',
    text: 'text-[#8C7422]',
    border: 'border-[#B89B5E]/50',
    indicator: 'bg-[#B89B5E]',
  };
}

/**
 * Status badge style — soft pill treatment on light surfaces.
 * Quiet tinted washes with a matching dot, tuned for the ivory canvas.
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
      bg: 'bg-[#BC6C56]/10',
      text: 'text-[#A2533F]',
      border: 'border-[#BC6C56]/50',
      dot: 'bg-[#BC6C56]',
    };
  }

  switch (normStatus) {
    case 'submitted':
      return {
        bg: 'bg-[#7A848D]/10',
        text: 'text-[#5C6470]',
        border: 'border-[#7A848D]/35',
        dot: 'bg-[#7A848D]',
      };
    case 'under_review':
      return {
        bg: 'bg-[#B3955B]/10',
        text: 'text-[#9C7C43]',
        border: 'border-[#B3955B]/35',
        dot: 'bg-[#B3955B]',
      };
    case 'resolved':
      return {
        bg: 'bg-[#5F7A66]/10',
        text: 'text-[#47604E]',
        border: 'border-[#5F7A66]/35',
        dot: 'bg-[#5F7A66]',
      };
    default:
      return {
        bg: 'bg-[#7A848D]/10',
        text: 'text-[#5C6470]',
        border: 'border-[#7A848D]/35',
        dot: 'bg-[#7A848D]',
      };
  }
}

export function generateComplaintId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SAGE-${randomNum}`;
}
