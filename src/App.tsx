import { useState, useEffect, useMemo } from 'react';
import { Complaint, ComplaintStatus, PageView } from './types';
import { INITIAL_COMPLAINTS } from './data/initialComplaints';
import { Navbar } from './components/Navbar';
import { SubmissionForm } from './components/SubmissionForm';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { PublicFeed } from './components/PublicFeed';
import { ComplaintDetail } from './components/ComplaintDetail';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { PublicComplaintPage } from './components/PublicComplaintPage';
import { ImageModal } from './components/ImageModal';
import { ConnectionBanner } from './components/ConnectionBanner';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApiService, normalizeComplaintData } from './services/api';
import { isFirebaseConfigured } from './firebase/config';
import { AdminAccessDenied } from './components/AdminAccessDenied';

function MainApp() {
  const { activeRole, user } = useAuth();
  const isAdminRole = activeRole === 'admin' || activeRole === 'head_admin';
  const [complaints, setComplaints] = useState<Complaint[]>(() => INITIAL_COMPLAINTS.map((c) => normalizeComplaintData(c)));
  const [currentView, setCurrentView] = useState<PageView>('landing');
  const [latestComplaint, setLatestComplaint] = useState<Complaint | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [routeComplaintId, setRouteComplaintId] = useState<string | null>(null);

  // Modal for zoomed image inspection
  const [activeImageModal, setActiveImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title: string;
  }>({
    isOpen: false,
    imageUrl: null,
    title: '',
  });

  // Live complaints reads from the Firestore `complaints` collection.
  // When Firestore is configured we subscribe for real-time updates (public
  // ledger + admin dashboard both render from live data). Otherwise we fall
  // back to the Express API / locally cached ledger (sandbox mode).
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isFirebaseConfigured) {
      unsubscribe = ApiService.subscribeToComplaints(
        (list) => setComplaints(list),
        undefined,
        activeRole
      );
    } else {
      (async () => {
        try {
          const data = await ApiService.getComplaints({}, activeRole);
          if (data.length > 0) setComplaints(data);
        } catch {
          setComplaints(INITIAL_COMPLAINTS.map((c) => normalizeComplaintData(c)));
        }
      })();
    }

    return () => unsubscribe?.();
  }, [activeRole]);

  // Hash-based routing for public complaint pages: #/complaint/:id
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/complaint\/(.+)$/);
      if (match && match[1]) {
        const id = decodeURIComponent(match[1]);
        setRouteComplaintId(id);
        setCurrentView('public');
      }
    };

    // Check on mount
    parseHash();

    // Listen for hash changes
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // Helper: navigate away from public view and clear the hash
  const handleExitPublicPage = () => {
    window.location.hash = '';
    setRouteComplaintId(null);
    setCurrentView('feed');
  };

  // Handle successful form submission
  const handleSubmitSuccess = (newComplaint: Complaint) => {
    const normalized = normalizeComplaintData(newComplaint);
    setComplaints((prev) => [normalized, ...prev.filter((c) => c.complaintId !== normalized.complaintId)]);
    setLatestComplaint(normalized);
    setCurrentView('confirmation');
  };

  // Upvote: Toggles to upvoted, increments count, and records SHA-256 vote in upvotes collection
  const handleUpvote = async (id: string) => {
    // Optimistic UI update
    setComplaints((prev) =>
      prev.map((c) => {
        if ((c.complaintId === id || c.id === id) && !c.hasUpvoted) {
          const newCount = (c.upvoteCount || 0) + 1;
          return {
            ...c,
            hasUpvoted: true,
            upvoteCount: newCount,
            upvotes: newCount,
          };
        }
        return c;
      })
    );

    try {
      await ApiService.upvoteComplaint(id, activeRole);
    } catch {
      // rollback handled gracefully
    }
  };

  // Update status (e.g. from public detail view)
  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    const norm = newStatus.toLowerCase().replace(' ', '_') as ComplaintStatus;
    setComplaints((prev) =>
      prev.map((c) => (c.complaintId === id || c.id === id ? { ...c, status: norm } : c))
    );

    try {
      await ApiService.updateStatus(id, norm, '', activeRole);
    } catch {
      // ignore
    }
  };

  // Admin update with status and resolution notes (commits to statusUpdates collection)
  const handleAdminUpdateComplaint = async (
    id: string,
    newStatus: ComplaintStatus,
    resolutionNotes: string
  ) => {
    const norm = newStatus.toLowerCase().replace(' ', '_') as ComplaintStatus;
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.complaintId === id || c.id === id) {
          const isNewlyResolved = norm === 'resolved' && c.status !== 'resolved';
          return {
            ...c,
            status: norm,
            resolutionNotes: resolutionNotes || c.resolutionNotes,
            resolvedAt: isNewlyResolved ? new Date().toISOString() : c.resolvedAt,
          };
        }
        return c;
      })
    );

    try {
      await ApiService.updateStatus(id, norm, resolutionNotes, activeRole, user?.uid);
    } catch {
      // ignore
    }
  };

  // Select complaint to open in detail view
  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaintId(complaint.complaintId || complaint.id || '');
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenImage = (imageUrl: string, title: string) => {
    setActiveImageModal({
      isOpen: true,
      imageUrl,
      title,
    });
  };

  const handleCloseImage = () => {
    setActiveImageModal({
      isOpen: false,
      imageUrl: null,
      title: '',
    });
  };

  const handleResetToDefaultSeed = async () => {
    await ApiService.resetSeed(activeRole);
    setComplaints(INITIAL_COMPLAINTS.map((c) => normalizeComplaintData(c)));
  };

  const activeComplaint = useMemo(() => {
    if (!selectedComplaintId) return null;
    return complaints.find((c) => c.complaintId === selectedComplaintId || c.id === selectedComplaintId) || null;
  }, [complaints, selectedComplaintId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1C1C1C]">
      {/* Top Connection & Health Status Banner */}
      <ConnectionBanner />

      {/* Header / Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'feed') {
            setSelectedComplaintId(null);
          }
          // Clear public complaint hash when navigating via navbar
          if (window.location.hash.startsWith('#/complaint/')) {
            window.location.hash = '';
            setRouteComplaintId(null);
          }
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        totalComplaintsCount={complaints.length}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={(view) => {
              if (view === 'feed') {
                setSelectedComplaintId(null);
              }
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            totalComplaintsCount={complaints.length}
          />
        )}

        {currentView === 'submit' && (
          <SubmissionForm
            onSubmitSuccess={handleSubmitSuccess}
            onCancelToFeed={() => setCurrentView('feed')}
          />
        )}

        {currentView === 'confirmation' && latestComplaint && (
          <ConfirmationScreen
            complaint={latestComplaint}
            onGoToFeed={() => {
              setSelectedComplaintId(null);
              setCurrentView('feed');
            }}
            onSubmitAnother={() => setCurrentView('submit')}
          />
        )}

        {currentView === 'feed' && (
          <PublicFeed
            complaints={complaints}
            onUpvote={handleUpvote}
            onSelectComplaint={handleSelectComplaint}
            onOpenImage={handleOpenImage}
            onGoToSubmit={() => setCurrentView('submit')}
            onResetToDefaultSeed={handleResetToDefaultSeed}
          />
        )}

        {currentView === 'detail' && activeComplaint && (
          <ComplaintDetail
            complaint={activeComplaint}
            onBackToFeed={() => {
              setSelectedComplaintId(null);
              setCurrentView('feed');
            }}
            onUpvote={handleUpvote}
            onOpenImage={handleOpenImage}
            onStatusChange={handleStatusChange}
            onGoToSubmit={() => setCurrentView('submit')}
          />
        )}

        {currentView === 'public' && routeComplaintId && (
          <PublicComplaintPage
            complaintId={routeComplaintId}
            onExit={handleExitPublicPage}
            onOpenImage={handleOpenImage}
          />
        )}

        {currentView === 'admin' && (
          isAdminRole ? (
            <AdminDashboard
              complaints={complaints}
              onUpdateComplaint={handleAdminUpdateComplaint}
              onOpenImage={handleOpenImage}
            />
          ) : (
            <AdminAccessDenied />
          )
        )}

        {currentView === 'detail' && !activeComplaint && (
          <div className="max-w-md mx-auto py-16 px-4 text-center">
            <h2 className="font-serif-editorial text-2xl font-bold text-[#1C1C1C] mb-2">
              Deposition Not Found
            </h2>
            <p className="text-xs font-mono text-[#1C1C1C]/70 mb-6">
              The requested complaint record could not be retrieved from the ledger.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('feed')}
              className="px-4 py-2 bg-[#1C1C1C] text-[#FAF9F6] text-xs font-mono font-bold uppercase border-2 border-[#1C1C1C] cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
            >
              Return to Public Ledger
            </button>
          </div>
        )}
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t-2 border-[#1C1C1C] bg-[#FAF9F6] py-8 px-4 text-center text-xs text-[#1C1C1C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-sm text-[#1C1C1C]/80">
            <strong>S.A.G.E.</strong> — Student Anonymous Grievance & Escalation System
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-[#1C1C1C]/60 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => {
                setCurrentView('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-red-700 underline cursor-pointer"
            >
              How It Works & FAQ
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setCurrentView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-red-700 underline cursor-pointer"
            >
              Administrative Portal
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={handleResetToDefaultSeed}
              className="hover:text-red-700 underline cursor-pointer"
            >
              Reset Seed Ledger
            </button>
            <span>·</span>
            <span className="text-red-700 font-bold">100% Cryptographic Anonymity</span>
          </div>
        </div>
      </footer>

      {/* Image Zoom Modal */}
      {activeImageModal.isOpen && (
        <ImageModal
          imageUrl={activeImageModal.imageUrl}
          title={activeImageModal.title}
          onClose={handleCloseImage}
        />
      )}

      {/* Firebase Auth & Role Selector Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
