import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="space-y-6 bg-surface border border-border rounded-3xl p-8 sm:p-12 shadow-sm animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text">Privacy Policy</h1>
              <p className="text-xs text-text-secondary">Aminoid AI Platform — Multi-Tenant Autonomous Growth Engine</p>
            </div>
          </div>

          <p className="text-xs text-text-muted">Last updated: October 14, 2026</p>

          <div className="space-y-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
            <h2 className="text-base font-bold text-text pt-2">1. Information We Collect</h2>
            <p>We may collect account details, business profile information, content you provide, and information needed to connect social media accounts.</p>

            <h2 className="text-base font-bold text-text pt-2">2. How We Use Information</h2>
            <p>We use this information to generate and schedule social media content, publish posts when authorized, manage connected accounts, and provide platform analytics.</p>

            <h2 className="text-base font-bold text-text pt-2">3. Social Media Accounts</h2>
            <p>When you connect a social media account, we process the permissions and account information you authorize. We use access tokens only to provide the requested integrations and protect them using appropriate security measures.</p>

            <h2 className="text-base font-bold text-text pt-2">4. Sharing and Security</h2>
            <p>We do not sell personal information. Information may be processed by service providers needed to operate the platform. We use reasonable safeguards to protect information.</p>

            <h2 className="text-base font-bold text-text pt-2">5. Data Retention and Deletion</h2>
            <p>You may request deletion of your account and associated data by contacting the platform administrator at admin@socialai.com. We will review and process requests subject to applicable legal requirements.</p>

            <h2 className="text-base font-bold text-text pt-2">6. Your Choices</h2>
            <p>You can disconnect social media accounts and stop granting permissions through the relevant social media platform settings.</p>

            <h2 className="text-base font-bold text-text pt-2">7. Contact</h2>
            <p>For privacy questions or data deletion requests, contact: admin@socialai.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}