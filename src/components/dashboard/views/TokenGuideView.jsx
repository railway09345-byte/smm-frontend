import React, { useState } from 'react';
import {
  Key,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';
import { useToast } from '../../common/Toast';

export function TokenGuideView({ onNavigate }) {
  const { showToast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const PLATFORMS = [
    {
      id: 'instagram',
      name: 'Instagram',
      subtitle: 'Professional & Creator Accounts',
      color: '#E1306C',
      tag: 'IG',
      gradient: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      badge: 'Meta Graph API',
      officialWebsites: [
        { label: 'Meta for Developers', url: 'https://developers.facebook.com/' },
        { label: 'Graph API Explorer', url: 'https://developers.facebook.com/tools/explorer/' }
      ],
      requiredPermissions: [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts'
      ],
      steps: [
        {
          num: '1',
          title: 'Switch to a Professional Account',
          desc: 'Log in to Instagram and switch your account to a Professional (Business or Creator) account via Settings & Privacy → Account Type and Tools.'
        },
        {
          num: '2',
          title: 'Link Instagram to a Facebook Page',
          desc: 'Open your Facebook Page settings (or Instagram Account Settings → Linked Accounts) and connect your Instagram account to a Facebook Page you manage as an Admin.'
        },
        {
          num: '3',
          title: 'Open Meta for Developers',
          desc: 'Visit developers.facebook.com and sign in with the Facebook account that has Admin permissions on your linked Facebook Page.'
        },
        {
          num: '4',
          title: 'Create or Select a Developer App',
          desc: 'Click "My Apps" → "Create App". Select "Other" as the use case, pick "Business" as the app type, enter your App Name, and click "Create App".'
        },
        {
          num: '5',
          title: 'Configure Instagram Graph API Integration',
          desc: 'From your App Dashboard, scroll down to "Add products to your app" and set up "Instagram Graph API" (and "Facebook Login for Business").'
        },
        {
          num: '6',
          title: 'Open Graph API Explorer',
          desc: 'Navigate to developers.facebook.com/tools/explorer/ and select your newly created app in the "Meta App" dropdown on the top right.'
        },
        {
          num: '7',
          title: 'Select Required Permissions',
          desc: 'Under "User or Page", select "User Token". In the Permissions section, add the required scopes:',
          code: 'instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement, pages_manage_posts'
        },
        {
          num: '8',
          title: 'Generate & Authorize Access Token',
          desc: 'Click "Generate Access Token". In the authorization popup, log in, select your linked Facebook Page and Instagram Professional account, and grant all requested permissions.'
        },
        {
          num: '9',
          title: 'Retrieve Account Info & Copy Token',
          desc: 'In the Graph API Explorer query bar, submit the query below. Copy the resulting access_token for testing.',
          code: 'GET me/accounts?fields=name,access_token,instagram_business_account{id,username}'
        },
        {
          num: '10',
          title: 'Production OAuth Flow & Token Expiration',
          desc: 'Explorer tokens are short-lived (1–2 hours). For production, exchange it for a 60-day long-lived token via endpoint or use the official 1-Click OAuth flow in our platform:',
          code: 'GET https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}'
        }
      ]
    },
    {
      id: 'youtube',
      name: 'YouTube',
      subtitle: 'YouTube Channels & Shorts',
      color: '#FF0000',
      tag: 'YT',
      gradient: 'linear-gradient(135deg, #FF0000 0%, #b00000 100%)',
      badge: 'Google Data API v3',
      officialWebsites: [
        { label: 'Google Cloud Console', url: 'https://console.cloud.google.com/' },
        { label: 'YouTube Data API v3 Documentation', url: 'https://developers.google.com/youtube/v3' },
        { label: 'OAuth 2.0 Playground', url: 'https://developers.google.com/oauthplayground/' }
      ],
      requiredPermissions: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ],
      steps: [
        {
          num: '1',
          title: 'Open Google Cloud Console',
          desc: 'Navigate to console.cloud.google.com and sign in with the Google account managing your YouTube channel. Create or select a project.'
        },
        {
          num: '2',
          title: 'Navigate to Library',
          desc: 'In the navigation menu on the left, go to APIs & Services → Library.'
        },
        {
          num: '3',
          title: 'Enable YouTube Data API v3',
          desc: 'Search for "YouTube Data API v3", click on it in the results, and click the "Enable" button.'
        },
        {
          num: '4',
          title: 'Configure OAuth Consent Screen',
          desc: 'Go to APIs & Services → OAuth consent screen. Select "External", enter your App Name and emails. Under "Scopes", add "https://www.googleapis.com/auth/youtube.upload". Under "Test users", add your channel email.'
        },
        {
          num: '5',
          title: 'Create OAuth 2.0 Credentials',
          desc: 'Go to APIs & Services → Credentials. Click "Create Credentials" → "OAuth client ID". Select "Web application". Add your authorized redirect URIs:',
          code: 'http://localhost:3000/dashboard\nhttps://developers.google.com/oauthplayground'
        },
        {
          num: '6',
          title: 'Open OAuth 2.0 Playground',
          desc: 'Go to developers.google.com/oauthplayground/. Click the gear (Settings) icon in the top right, check "Use your own OAuth credentials", and paste your Client ID and Client Secret.'
        },
        {
          num: '7',
          title: 'Select YouTube Upload Scope',
          desc: 'In the Step 1 panel on the left, scroll to YouTube Data API v3 or input the exact upload scope:',
          code: 'https://www.googleapis.com/auth/youtube.upload'
        },
        {
          num: '8',
          title: 'Authorize Google Account',
          desc: 'Click "Authorize APIs", select your Google Account and YouTube channel, review permissions, and click "Continue / Allow".'
        },
        {
          num: '9',
          title: 'Exchange Authorization Code for Tokens',
          desc: 'In Step 2 of the Playground, click "Exchange authorization code for tokens". Both the Access Token and Refresh Token will be generated.'
        },
        {
          num: '10',
          title: 'Securely Store Refresh Token for Background Publishing',
          desc: 'Google Access Tokens expire in 1 hour (3600 seconds). The Refresh Token is permanent. Paste both the Access Token and Refresh Token into Connected Socials to allow automated background publishing.'
        }
      ]
    },
    {
      id: 'facebook',
      name: 'Facebook',
      subtitle: 'Facebook Pages & Feeds',
      color: '#1877F2',
      tag: 'FB',
      gradient: 'linear-gradient(135deg, #1877F2 0%, #0d5bbd 100%)',
      badge: 'Facebook Graph API v19+',
      officialWebsites: [
        { label: 'Meta for Developers', url: 'https://developers.facebook.com/' },
        { label: 'Graph API Explorer', url: 'https://developers.facebook.com/tools/explorer/' }
      ],
      requiredPermissions: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts'
      ],
      steps: [
        {
          num: '1',
          title: 'Open Meta for Developers',
          desc: 'Navigate to developers.facebook.com and sign in with the Facebook account that is an Admin of your Facebook Page.'
        },
        {
          num: '2',
          title: 'Create or Select a Developer App',
          desc: 'Go to "My Apps" → "Create App". Select "Other" → "Business", enter your App Name, and click "Create App".'
        },
        {
          num: '3',
          title: 'Configure Facebook Login for Business',
          desc: 'In the App Dashboard under "Add products to your app", click Set Up on "Facebook Login for Business". Add your redirect URIs in Settings.'
        },
        {
          num: '4',
          title: 'Open Graph API Explorer',
          desc: 'Go to developers.facebook.com/tools/explorer/.'
        },
        {
          num: '5',
          title: 'Select Your Developer App',
          desc: 'In the top-right header, ensure the "Meta App" dropdown is set to your developer application.'
        },
        {
          num: '6',
          title: 'Generate User Token with Page Permissions',
          desc: 'Under "User or Page", choose "User Token". Under Permissions, add pages_show_list, pages_read_engagement, and pages_manage_posts. Click "Generate Access Token".'
        },
        {
          num: '7',
          title: 'Authorize Permissions and Select Page',
          desc: 'Complete the Meta authorization popup. Ensure you select the Facebook Page you manage and grant all requested Page permissions.'
        },
        {
          num: '8',
          title: 'Retrieve Page ID & Page Access Token',
          desc: 'In the Graph API Explorer query bar, run the query below. It will list your Facebook Pages with their numeric ID and specific Page Access Token:',
          code: 'GET me/accounts?fields=id,name,access_token'
        },
        {
          num: '9',
          title: 'User Token vs. Page Access Token (Important)',
          desc: 'Meta has deprecated posting to personal profiles ((#200) publish_actions deprecated). You MUST use the Page Access Token retrieved in Step 8 to publish to Facebook Pages.'
        },
        {
          num: '10',
          title: 'Production OAuth Flow',
          desc: 'In production, direct Page Admins through official Meta OAuth with your App ID. Use fb_exchange_token to obtain permanent, non-expiring Page Access Tokens.',
          code: 'https://www.facebook.com/v19.0/dialog/oauth?client_id={APP_ID}&redirect_uri={REDIRECT_URI}&scope=pages_show_list,pages_read_engagement,pages_manage_posts&response_type=code'
        }
      ]
    }
  ];

  const displayedPlatforms = selectedPlatform === 'all'
    ? PLATFORMS
    : PLATFORMS.filter(p => p.id === selectedPlatform);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <DashboardPageHeader
        badge="Official Integration Docs"
        badgeType="indigo"
        badgeIcon={BookOpen}
        title="Social Media Access Token Guide"
        description="Comprehensive, step-by-step instructions for obtaining verified API access tokens from official developer portals for Instagram, YouTube, and Facebook."
      >
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('social-accounts')}
          className="btn btn--primary flex items-center gap-2 text-xs font-bold px-4 py-2"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Connect Social Accounts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </DashboardPageHeader>

      {/* Security Notice Banner */}
      <div className="p-4 rounded-2xl bg-surface-raised border border-border flex items-start gap-3.5 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-xs sm:text-sm font-bold text-text block">
            Security & Credential Safety
          </strong>
          <p className="text-xs text-text-secondary leading-relaxed">
            All access tokens and refresh tokens entered in this platform are encrypted at rest using industry-standard <strong>AES-256 encryption</strong> before storing in MySQL. We never store social media passwords.
          </p>
        </div>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        <button
          type="button"
          onClick={() => setSelectedPlatform('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedPlatform === 'all'
              ? 'bg-primary text-primary-on shadow-xs'
              : 'bg-surface text-text-secondary hover:text-text hover:bg-surface-selected border border-border'
          }`}
        >
          All Platforms (4)
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPlatform(p.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedPlatform === p.id
                ? 'bg-primary text-primary-on shadow-xs'
                : 'bg-surface text-text-secondary hover:text-text hover:bg-surface-selected border border-border'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Platform Guide Cards */}
      <div className="space-y-8">
        {displayedPlatforms.map((platform) => (
          <SpotlightCard
            key={platform.id}
            className="p-6 sm:p-7 rounded-2xl bg-surface border border-border shadow-xs space-y-6"
          >
            {/* Platform Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0"
                  style={{ background: platform.gradient }}
                >
                  {platform.tag}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-text tracking-tight">
                      {platform.name}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-selected text-text-secondary border border-border">
                      {platform.badge}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted font-medium">
                    {platform.subtitle}
                  </p>
                </div>
              </div>

              {/* Official Website Links */}
              <div className="flex items-center gap-2 flex-wrap">
                {platform.officialWebsites.map((site) => (
                  <a
                    key={site.url}
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface text-primary border border-border hover:bg-surface-selected transition-all shadow-2xs"
                  >
                    <span>{site.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ))}
              </div>
            </div>

            {/* Required Permissions Pillbox */}
            <div className="p-3.5 rounded-xl bg-surface-selected border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  <span>Required API Scopes / Permissions:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(platform.requiredPermissions.join(','), `perms_${platform.id}`)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  {copiedKey === `perms_${platform.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Scopes</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {platform.requiredPermissions.map((perm) => (
                  <code
                    key={perm}
                    className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-surface-raised border border-border text-primary"
                  >
                    {perm}
                  </code>
                ))}
              </div>
            </div>

            {/* Numbered Steps */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Step-by-Step Instructions
              </h3>
              <div className="space-y-3">
                {platform.steps.map((st) => (
                  <div
                    key={st.num}
                    className="p-3.5 sm:p-4 rounded-xl border border-border bg-surface hover:border-primary/40 transition-all space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-xs"
                        style={{ background: platform.color }}
                      >
                        {st.num}
                      </span>
                      <div className="space-y-1 flex-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-bold text-text dark:text-white block">
                          {st.title}
                        </strong>
                        <p className="text-xs text-text-secondary dark:text-text-muted leading-relaxed font-normal">
                          {st.desc}
                        </p>
                      </div>
                    </div>

                    {st.code && (
                      <div className="mt-2 ml-9 relative group">
                        <pre className="p-2.5 rounded-lg bg-surface-raised text-text text-[11px] font-mono overflow-x-auto border border-border">
                          <code>{st.code}</code>
                        </pre>
                        <button
                          type="button"
                          onClick={() => handleCopy(st.code, `${platform.id}_${st.num}`)}
                          className="absolute top-2 right-2 px-2 py-1 rounded bg-surface/90 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                          title="Copy to clipboard"
                        >
                          {copiedKey === `${platform.id}_${st.num}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-border">
              <span className="text-xs text-text-muted font-medium">
                Ready to link your {platform.name} channel?
              </span>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('social-accounts')}
                className="btn btn--sm btn--primary inline-flex items-center gap-1.5 text-xs font-bold"
                style={{ background: platform.gradient, color: '#ffffff' }}
              >
                <span>Connect {platform.name} Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
