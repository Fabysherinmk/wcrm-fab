import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-6 py-12">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Back Button */}
        <div>
          <Link href="/">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white flex items-center gap-2 px-0 hover:bg-transparent"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
            <Shield className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Privacy Policy</h1>
            <p className="text-sm text-slate-400">Last updated: June 15, 2026</p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              Welcome to our Privacy Policy. This service ("the CRM Application") is hosted by the organization on their own infrastructure using a self-hostable template. We respect your privacy and are committed to protecting any personal data processed through our application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
            <p>
              When utilizing this CRM with the WhatsApp Business Platform, the application collects, stores, and processes the following types of information:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
              <li>Customer contact information (such as names, phone numbers, and optional email addresses).</li>
              <li>Chat history, message contents, and statuses (sent, delivered, read, etc.) of conversations with your phone number.</li>
              <li>Metadata from WhatsApp webhooks sent by Meta's servers.</li>
              <li>CRM user profiles (names, emails, and roles) of employees using the system.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. How Information is Used</h2>
            <p>
              We process the collected data solely to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
              <li>Provide the CRM platform's features, including shared inbox, contact management, sales pipeline, and message synchronization.</li>
              <li>Execute automated flows and message bots configured by system administrators.</li>
              <li>Log activities for audit and security tracking purposes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Data Sharing & Third-Party Services</h2>
            <p>
              Our application communicates directly with the **Meta WhatsApp Cloud API** to transmit messages. The data processed through WhatsApp is subject to Meta's privacy policies. We do not sell, rent, or trade your data or your customers' data to any third-party marketing services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Security</h2>
            <p>
              We use standard technical and organizational security controls, including database row-level security (RLS), access token encryption, and HTTPS network transmission, to protect your data from unauthorized access or alteration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">6. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The date of the last revision will be displayed at the top of this page.
            </p>
          </section>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full text-center border-t border-slate-800 pt-8 mt-12">
        <p className="text-xs text-slate-500">
          Powered by wacrm Template. All database data is owned and stored on the host's private infrastructure.
        </p>
      </div>
    </div>
  );
}
