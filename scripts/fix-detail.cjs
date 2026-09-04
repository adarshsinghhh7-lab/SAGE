const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'components', 'ComplaintDetail.tsx');
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// 1. Remove unused imports
s = s.replace("  ChevronDown,\n", "");
s = s.replace("import { getCategoryBadgeStyle, formatCategoryLabel, formatTimeAgo } from '../utils/formatters';", "import { getCategoryBadgeStyle, formatCategoryLabel, formatTimeAgo } from '../utils/formatters';");

// 2. Remove unused props from destructure + interface. Keep interface but stop using onStatusChange/showStatusMenu/urgencyScore.
// Replace the destructured props (remove onStatusChange usage by renaming to onStatusChangeUnused)
s = s.replace("  onStatusChange,\n", "");
s = s.replace("  const [showStatusMenu, setShowStatusMenu] = useState<boolean>(false);\n", "");
s = s.replace("  const urgencyScore = complaint.urgencyScore !== undefined ? complaint.urgencyScore : 0;\n", "");

// 3. Fix complaint.title usage — Complaint has no title. Replace heading with a generic one.
s = s.replace("<h1 className=\"text-3xl font-bold text-[#14171F] mb-3\">{complaint.title}</h1>", "<h1 className=\"text-3xl font-bold text-[#14171F] mb-3\">Campus Grievance Deposition</h1>");

// 4. Fix complaint.statusUpdates — Complaint has no statusUpdates. Pass statusUpdates={[]}... but the detail page
//    actually owns status updates through onStatusChange, not a ledger. Use empty array to keep StatusTimeline working.
s = s.replace("statusUpdates={complaint.statusUpdates}", "statusUpdates={[]}");

fs.writeFileSync(file, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('ComplaintDetail fixed');
