import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '../components/dashboard/DashboardTopbar';
import { DashboardModals } from '../components/dashboard/DashboardModals';
import { motion, AnimatePresence } from 'framer-motion';

// View Components
import { OverviewView } from '../components/dashboard/views/OverviewView';
import { BrandProfileView } from '../components/dashboard/views/BrandProfileView';
import { SocialAccountsView } from '../components/dashboard/views/SocialAccountsView';
import { ContentGoalsView } from '../components/dashboard/views/ContentGoalsView';
import { AIPlannerView } from '../components/dashboard/views/AIPlannerView';
import { GeminiAIStudioView } from '../components/dashboard/views/GeminiAIStudioView';
import { AutonomousPipelineHub } from '../components/dashboard/views/AutonomousPipelineHub';
import { ContentStudioView } from '../components/dashboard/views/ContentStudioView';
import { QualityCheckView } from '../components/dashboard/views/QualityCheckView';
import { ApprovalQueueView } from '../components/dashboard/views/ApprovalQueueView';
import { PublishingSchedulerView } from '../components/dashboard/views/PublishingSchedulerView';
import { AnalyticsInsightsView } from '../components/dashboard/views/AnalyticsInsightsView';
import { AIOptimizationView } from '../components/dashboard/views/AIOptimizationView';
import { MembershipBillingView } from '../components/dashboard/views/MembershipBillingView';
import { SecurityPermissionsView } from '../components/dashboard/views/SecurityPermissionsView';
import { SettingsTeamView } from '../components/dashboard/views/SettingsTeamView';
import { SocialIntegrationsAdminView } from '../components/dashboard/views/SocialIntegrationsAdminView';
import { AdminMultiBusinessView } from '../components/dashboard/views/AdminMultiBusinessView';
import { MediaLibraryView } from '../components/dashboard/views/MediaLibraryView';
import { SchedulingSettingsView } from '../components/dashboard/views/SchedulingSettingsView';
import { TokenGuideView } from '../components/dashboard/views/TokenGuideView';

const VIEW_TITLES = {
  'overview': 'Overview',
  'brand-profile': 'Brand Profile',
  'social-accounts': 'Social Accounts',
  'token-guide': 'Access Token Guide',
  'content-goals': 'Content Goals & Audience',
  'autonomous-pipeline': 'Autonomous AI Pipeline & Scheduler',
  'gemini-studio': 'Google Gemini AI Studio',
  'ai-planner': 'AI Content Planner',
  'content-studio': 'Content Studio & Composer',
  'media-library': 'Media Library',
  'media-collections': 'Media Collections',
  'scheduled-posts': 'Scheduled Posts',
  'published-posts': 'Published Posts',
  'failed-posts': 'Failed Posts',
  'scheduling-settings': 'Scheduling Settings',
  'quality-check': 'Quality Check',
  'approval-queue': 'Approval Queue',
  'content-calendar': 'Content Calendar',
  'publishing-automation': 'Publishing Automation',
  'publishing-scheduler': 'Publishing & Scheduler',
  'analytics-insights': 'Analytics & Insights',
  'ai-optimization': 'AI Optimization',
  'admin-social-integrations': 'Social Media API Integrations',
  'multi-business': 'Multi-Business & Brand Management',
  'membership-billing': 'Membership & Billing',
  'security-permissions': 'Security & Permissions',
  'settings-team': 'Settings & Team'
};

export function DashboardPage() {
  const { view: pathView } = useParams();          // /dashboard/:view
  const [searchParams] = useSearchParams();          // /dashboard?view=xxx
  const navigate = useNavigate();

  const hasInvalidPathView = Boolean(pathView && !VIEW_TITLES[pathView]);
  const queryView = searchParams.get('view');
  const hasInvalidQueryView = Boolean(!pathView && queryView && !VIEW_TITLES[queryView]);

  // Path param wins over query param; if OAuth code is returning, route to social-accounts
  const hasOAuthCallback = Boolean(searchParams.get('code'));
  const resolvedView = hasOAuthCallback ? 'social-accounts' : (pathView || searchParams.get('view') || 'overview');
  // Normalize: only use known views, else fall back to overview
  const initialView = VIEW_TITLES[resolvedView] ? resolvedView : 'overview';

  const [activeView, setActiveView] = useState(initialView);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keep active view in sync when the URL changes (back/forward, direct navigation)
  useEffect(() => {
    if (hasInvalidPathView || hasInvalidQueryView) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const incoming = hasOAuthCallback ? 'social-accounts' : (pathView || searchParams.get('view') || 'overview');
    if (incoming === 'quality-check') {
      navigate('/dashboard/autonomous-pipeline', { replace: true });
      return;
    }
    if (incoming === 'create-post') {
      navigate('/dashboard/content-studio', { replace: true });
      return;
    }
    const normalized = VIEW_TITLES[incoming] ? incoming : 'overview';
    if (normalized !== activeView) {
      setActiveView(normalized);
    }
  }, [pathView, searchParams, hasInvalidPathView, hasInvalidQueryView, hasOAuthCallback, navigate]);

  const handleViewChange = (newView) => {
    setActiveView(newView);
    // Navigate with clean path URL (e.g. /dashboard/social-accounts)
    // This also keeps browser history so Back button works correctly
    if (newView === 'overview') {
      navigate('/dashboard', { replace: false });
    } else {
      navigate(`/dashboard/${newView}`, { replace: false });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const authState = useAuth() || {};
  const membership = authState.membership || { status: 'Active', plan: 'Pro Growth Plan', price: '$79 / month' };
  const updateMembership = authState.updateMembership || (() => {});
  const {
    contentItems,
    campaigns,
    isAutomationActive,
    toggleAutomation,
    saveContentItem,
    approveItem,
    rejectItem,
    requestChanges,
    scheduleItem,
    publishItem,
    cancelSchedule,
    deleteItem,
    generateDailyBatch,
    createCampaign
  } = useContent();

  // Studio Active Item
  const [studioItemId, setStudioItemId] = useState(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('id');
      const fromStorage = localStorage.getItem('sacp_active_studio_item');
      return fromUrl || fromStorage || 'post-1';
    } catch {
      return 'post-1';
    }
  });

  // When content items load, ensure studioItemId points to a valid item
  useEffect(() => {
    if (contentItems.length > 0) {
      const savedStorage = localStorage.getItem('sacp_active_studio_item');
      const hasCurrent = contentItems.some((i) => String(i.id) === String(studioItemId));
      if (!hasCurrent) {
        const match = contentItems.find((i) => String(i.id) === String(savedStorage));
        setStudioItemId(match ? match.id : contentItems[0].id);
      }
    }
  }, [contentItems, studioItemId]);

  // Modals State
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [editModalItem, setEditModalItem] = useState(null);
  const [scheduleModalItem, setScheduleModalItem] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, id: null, type: 'reject', notes: '' });
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [videoPlayerItem, setVideoPlayerItem] = useState(null);
  const [imageViewItem, setImageViewItem] = useState(null);
  const [selectedStudioMedia, setSelectedStudioMedia] = useState(null);
  const [selectedCollectionForLibrary, setSelectedCollectionForLibrary] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);


  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pendingCount = useMemo(() => (contentItems || []).filter((i) => i?.status === 'awaiting' || i?.status === 'changes_requested').length, [contentItems]);
  const approvedCount = useMemo(() => (contentItems || []).filter((i) => i?.status === 'approved').length, [contentItems]);
  const scheduledCount = useMemo(() => (contentItems || []).filter((i) => i?.status === 'scheduled').length, [contentItems]);
  const publishedCount = useMemo(() => (contentItems || []).filter((i) => i?.status === 'published').length, [contentItems]);

  const handleEditStudioItem = (id) => {
    setStudioItemId(id);
    handleViewChange('content-studio');
  };

  // Planner copy edits stay in the Planner view. The shared modal persists
  // through ContentContext without navigating to Content Studio.
  const handleEditPlannerItem = (id) => {
    const item = contentItems.find((entry) => entry.id === id);
    if (item) setEditModalItem(item);
  };

  const isOverview = activeView === 'overview';

  return (
    <div
      className="dashboard-layout relative min-h-screen bg-bg text-text font-sans selection:bg-primary/20 selection:text-primary flex flex-col w-full max-w-[100vw] transition-colors duration-200"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw'
      }}
    >
      {/* Global Ambient Emerald Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-primary/10 via-accent/5 to-transparent blur-[140px]" />
        <div className="absolute top-[20%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-primary/8 via-accent/8 to-transparent blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-t from-border/30 to-transparent blur-[120px]" />
      </div>

      {/* 1. ON-DEMAND SLIDE-OVER DRAWER SIDEBAR */}
      <DashboardSidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="relative z-10 flex flex-col min-w-0 w-full overflow-x-hidden min-h-screen">
        {/* Global Dashboard Topbar with Shifting Dropdown across ALL views */}
        <DashboardTopbar
          activeView={activeView}
          activeTitle={VIEW_TITLES[activeView] || 'Overview'}
          onViewChange={handleViewChange}
          pendingCount={pendingCount}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onCreatePost={() => handleViewChange('content-studio')}
        />

        {/* Expired Membership Warning (Demo state) */}
        {membership?.status === 'Expired' && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex justify-between items-center text-rose-800 text-xs sm:text-sm flex-wrap gap-2">
            <span>Membership is simulated as Expired. Automated generation paused.</span>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-xs"
              onClick={() => updateMembership && updateMembership('Active', 'Pro Growth Plan', '$79 / month')}
            >
              Renew Plan ($79/mo)
            </button>
          </div>
        )}

        {/* View Workspace */}
        <main className="relative z-10 flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 md:px-8 py-6 space-y-6 pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.165, 0.84, 0.44, 1] }}
              className="w-full space-y-6"
            >
            {activeView === 'overview' && (
            <OverviewView
              contentItems={contentItems}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              scheduledCount={scheduledCount}
              publishedCount={publishedCount}
              isAutomationActive={isAutomationActive}
              toggleAutomation={toggleAutomation}
              generateDailyBatch={generateDailyBatch}
              onNavigate={handleViewChange}
              onPreviewItem={setPreviewModalItem}
              onEditStudioItem={handleEditStudioItem}
              onOpenCampaignModal={() => setCampaignModalOpen(true)}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          )}

          {activeView === 'brand-profile' && (
            <BrandProfileView generateDailyBatch={generateDailyBatch} />
          )}

          {activeView === 'social-accounts' && <SocialAccountsView onNavigate={handleViewChange} />}

          {activeView === 'content-goals' && <ContentGoalsView />}

          {activeView === 'autonomous-pipeline' && (
            <AutonomousPipelineHub onNavigate={handleViewChange} />
          )}

          {activeView === 'gemini-studio' && (
            <GeminiAIStudioView
              onNavigate={handleViewChange}
              setStudioItemId={setStudioItemId}
            />
          )}

          {activeView === 'ai-planner' && (
            <AIPlannerView
              contentItems={contentItems}
              generateDailyBatch={generateDailyBatch}
              approveItem={approveItem}
              onPreviewItem={setPreviewModalItem}
              onEditStudioItem={handleEditPlannerItem}
              onScheduleItem={setScheduleModalItem}
              onFeedback={(id, type) => setFeedbackModal({ isOpen: true, id, type, notes: '' })}
              onCancelSchedule={cancelSchedule}
              onNavigate={handleViewChange}
            />
          )}

          {activeView === 'content-studio' && (
            <ContentStudioView
              studioItemId={studioItemId}
              setStudioItemId={setStudioItemId}
              onNavigate={handleViewChange}
              selectedMediaAsset={selectedStudioMedia}
              onClearSelectedMedia={() => setSelectedStudioMedia(null)}
              initialTab="compose"
            />
          )}

          {(activeView === 'media-library' || activeView === 'media-collections') && (
            <MediaLibraryView
              onNavigate={handleViewChange}
              onSelectMediaForStudio={(asset) => setSelectedStudioMedia(asset)}
              onCreatePostWithMedia={(asset) => {
                setSelectedStudioMedia(asset);
                handleViewChange('content-studio');
              }}
              initialCollectionId={selectedCollectionForLibrary}
              initialTab={activeView === 'media-collections' ? 'collections' : 'assets'}
            />
          )}

          {activeView === 'scheduling-settings' && (
            <SchedulingSettingsView
              onNavigate={handleViewChange}
            />
          )}

          {activeView === 'quality-check' && (
            <AutonomousPipelineHub
              onNavigate={handleViewChange}
            />
          )}

          {activeView === 'approval-queue' && (
            <ApprovalQueueView
              contentItems={contentItems}
              approveItem={approveItem}
              publishItem={publishItem}
              onPreviewItem={setPreviewModalItem}
              onEditStudioItem={handleEditStudioItem}
              onScheduleItem={setScheduleModalItem}
              onFeedback={(id, type) => setFeedbackModal({ isOpen: true, id, type, notes: '' })}
              onCancelSchedule={cancelSchedule}
              deleteItem={deleteItem}
            />
          )}

          {(activeView === 'publishing-scheduler' || activeView === 'content-calendar' || activeView === 'scheduled-posts' || activeView === 'published-posts' || activeView === 'failed-posts') && (
            <PublishingSchedulerView
              contentItems={contentItems}
              publishItem={publishItem}
              onScheduleItem={setScheduleModalItem}
              onCancelSchedule={cancelSchedule}
              onNavigate={handleViewChange}
              initialSubView={
                activeView === 'content-calendar'
                  ? 'calendar'
                  : (['scheduled-posts', 'published-posts', 'failed-posts'].includes(activeView)
                    ? 'posts-table'
                    : 'queue')
              }
            />
          )}

          {activeView === 'publishing-automation' && (
            <AutonomousPipelineHub onNavigate={handleViewChange} />
          )}

          {activeView === 'analytics-insights' && (
            <AnalyticsInsightsView
              contentItems={contentItems}
              onPreviewItem={setPreviewModalItem}
            />
          )}

          {activeView === 'ai-optimization' && <AIOptimizationView />}

          {activeView === 'admin-social-integrations' && (
            <SocialIntegrationsAdminView onNavigate={handleViewChange} />
          )}

          {activeView === 'multi-business' && <AdminMultiBusinessView />}

          {activeView === 'membership-billing' && <MembershipBillingView />}

          {activeView === 'security-permissions' && <SecurityPermissionsView />}

          {activeView === 'settings-team' && (
            <SettingsTeamView onOpenInviteModal={() => setInviteModalOpen(true)} />
          )}

          {activeView === 'token-guide' && (
            <TokenGuideView onNavigate={handleViewChange} />
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. ALL WORKFLOW MODALS */}
      <DashboardModals
        previewModalItem={previewModalItem}
        setPreviewModalItem={setPreviewModalItem}
        editModalItem={editModalItem}
        setEditModalItem={setEditModalItem}
        scheduleModalItem={scheduleModalItem}
        setScheduleModalItem={setScheduleModalItem}
        feedbackModal={feedbackModal}
        setFeedbackModal={setFeedbackModal}
        campaignModalOpen={campaignModalOpen}
        setCampaignModalOpen={setCampaignModalOpen}
        videoPlayerItem={videoPlayerItem}
        setVideoPlayerItem={setVideoPlayerItem}
        imageViewItem={imageViewItem}
        setImageViewItem={setImageViewItem}
        inviteModalOpen={inviteModalOpen}
        setInviteModalOpen={setInviteModalOpen}
        searchModalOpen={searchModalOpen}
        setSearchModalOpen={setSearchModalOpen}
        notificationsOpen={notificationsOpen}
        setNotificationsOpen={setNotificationsOpen}
        contentItems={contentItems}
        saveContentItem={saveContentItem}
        approveItem={approveItem}
        rejectItem={rejectItem}
        requestChanges={requestChanges}
        scheduleItem={scheduleItem}
        publishItem={publishItem}
        cancelSchedule={cancelSchedule}
        createCampaign={createCampaign}
        onNavigate={handleViewChange}
      />
    </div>
  );
}
