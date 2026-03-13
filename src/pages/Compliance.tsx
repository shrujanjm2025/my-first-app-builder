import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircle, XCircle, Lock, Shield, FileText, Eye, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ComplianceStatus {
  dataProcessing: boolean;
  privacyPolicy: boolean;
  explicitConsent: boolean;
  dataMinimization: boolean;
  userRights: boolean;
  dataRetention: boolean;
  timestamp: string;
}

const COMPLIANCE_SECTIONS = [
  {
    id: "overview",
    title: "DPDP Act 2023 - FiscalBehavioral Finance Platform",
    content: `
Our platform operates under India's Digital Personal Data Protection (DPDP) Act, 2023. This document outlines how WealthOS collects, processes, and protects your financial data.

**Effective Date**: ${new Date().toLocaleDateString()}
**Last Updated**: ${new Date().toLocaleDateString()}
**Data Protection Officer**: compliance@fiscalbehavioralfinance.com
    `
  },
  {
    id: "data-collection",
    title: "Data Collection & Purpose",
    content: `
WealthOS collects the following Personal Data (as defined under DPDP Act):

**Category 1: Authentication & Identity**
- Email address (for account creation & communication)
- Full name (for personalization & transaction statements)
- Password (hashed & encrypted, never stored in plain text)
- Phone number (optional, for 2FA)

**Category 2: Financial Data**
- Income sources & amounts (salary, freelance, investments)
- Expense transactions (date, amount, category)
- Bank account details (name, type, balance summaries)
- Loan information (amount, EMI, interest rate)
- Credit score & credit history indicators
- Investment portfolio data (mutual funds, FDs, RDs, stocks)
- Insurance policy information

**Category 3: Behavioral & Usage Data**
- Login timestamps & frequency
- Feature usage patterns (for gamification)
- Budget preferences & spending patterns
- Financial goals & progress tracking
- Device information (IP, browser, OS)

**Legal Basis for Processing**:
1. User Consent - Explicit opt-in for each data category
2. Contract Performance - Required to provide financial management services
3. Legal Obligation - RBI/SEBI compliance & anti-money laundering (AML)
4. Legitimate Interest - Platform improvement & fraud prevention
    `
  },
  {
    id: "user-rights",
    title: "Your Rights Under DPDP Act",
    content: `
**Right to Access (Section 8)**
- You can request a copy of all your personal data
- Requests processed within 30 days
- Available in machine-readable format (CSV, JSON)

**Right to Correction (Section 8)**
- Update inaccurate or incomplete information
- Submit corrections through Settings > Data Management
- Changes reflected within 7 days

**Right to Erasure (Right to be Forgotten) (Section 9)**
- Request deletion of personal data (except where legally required)
- Financial transaction records retained for 7 years (RBI requirement)
- Authentication data retained for 3 years (fraud prevention)
- Anonymized behavioral data retained indefinitely

**Right to Data Portability (Section 8)**
- Export all transaction data in CSV/JSON format
- Bank account & investment information included
- Request through Settings > Data Export

**Right to Restrict Processing (Section 8)**
- Temporarily restrict data use while disputes are resolved
- Account functionality may be limited

**Right to Object (Section 8)**
- Object to marketing communications (opt-out from Settings)
- Object to profiling & automated decision-making

**Grievance Redressal (Section 18)**
- File complaints with our Data Protection Officer
- Email: compliance@fiscalbehavioralfinance.com
- Response within 30 days
- Escalate to DPDP Board if unsatisfied
    `
  },
  {
    id: "data-security",
    title: "Data Security & Encryption",
    content: `
**Technical Safeguards**:
- End-to-end encryption for sensitive data in transit (TLS 1.3)
- AES-256 encryption for data at rest
- Passwords hashed with bcrypt (salt rounds: 12)
- Regular security audits by certified vendors
- Penetration testing quarterly

**Organizational Safeguards**:
- Role-based access control (RBAC) for employee access
- Principle of least privilege implemented
- Data access logs maintained for 90 days
- Mandatory data protection training for all staff
- Non-disclosure agreements signed by all employees

**Third-Party Security**:
- Supabase (Database) - SOC 2 Type II certified
- AWS (Infrastructure) - ISO 27001 certified
- Third-party vendors bound by Data Processing Agreements

**Data Breach Protocol**:
- Incident response team available 24/7
- Breaches reported to affected users within 72 hours
- Notification to DPDP Board if high-risk data involved
- Post-incident security audit mandatory
    `
  },
  {
    id: "data-retention",
    title: "Data Retention & Deletion Policy",
    content: `
**Retention Schedule**:

Financial Transaction Records:
- Active period: Indefinite (user property)
- After account closure: 7 years (RBI requirement)
- Rationale: Tax documentation & regulatory compliance

Credit Score & Credit History:
- Active period: Until account closure
- After closure: 5 years (CIBIL reporting period)
- Rationale: Regulatory requirement under Credit Information Companies (Regulation) Act

Bank & Loan Information:
- Active period: Until account closure
- After closure: 7 years
- Rationale: RBI guidelines & dispute resolution

User Authentication Data:
- Login records: 90 days
- Password history: 12 months
- 2FA records: Until disabled
- Rationale: Security & fraud prevention

Behavioral & Usage Data:
- Raw interaction logs: 90 days
- Aggregated analytics: 3 years
- Session cookies: Deleted upon logout
- Rationale: Platform improvement & legal holds

Marketing Communications:
- Email preferences: Until opt-out
- Marketing history: 2 years
- Rationale: Legitimate business interests

**Automatic Deletion**:
- Inactive accounts (no login for 2 years): Flagged for deletion notice
- Deletion notice sent 30 days before permanent deletion
- User can restore within 30-day window
- After 30 days: Irreversible deletion from all systems except legal holds
    `
  },
  {
    id: "international-transfers",
    title: "Data Localization & Cross-Border Transfers",
    content: `
**India-First Policy**:
- Primary data storage: India (AWS Mumbai Region)
- Backup location: India (AWS Delhi Region)
- No automatic transfer of data outside India

**Exception Cases** (with explicit user consent):
- Cloud backup to AWS US-East-1 (encrypted)
- Analytics processing via AWS US regions
- Customer support access from EU (GDPR compliant)

**Personal Data Export**:
- Users can export and transfer data to other providers
- WealthOS will not prevent or delay lawful data requests

**RBI Compliance**:
- Adheres to RBI Master Direction on Data Localization (April 2018)
- Core banking data retained within India
- Payments processed through RBI-regulated channels only
    `
  },
  {
    id: "automated-decisions",
    title: "Automated Decision-Making & Profiling",
    content: `
**Profiling Activities**:

1. **Expense Categorization**:
   - ML model analyzes transaction descriptions
   - Auto-assigns expense categories (Groceries, Transport, etc.)
   - User can override classifications
   - No automated credit/loan decisions made

2. **Savings Rate Calculation**:
   - Algorithm computes 50/30/20 budget allocation
   - Based on disclosed monthly salary
   - Personalized but non-binding recommendations

3. **Credit Score Analysis**:
   - Uses user-provided credit score (self-reported)
   - Generates risk insights for loan refinancing
   - NO credit decisions made by platform
   - NO credit score modification without consent

4. **Spending Pattern Detection**:
   - Identifies unusual transaction patterns
   - Triggers alerts for budget overruns
   - Fraud detection system (disabled by default)
   - User can enable in Settings

5. **Goal Recommendation**:
   - Algorithm suggests savings goals based on income
   - Ranked by feasibility & impact
   - Entirely optional & user-driven

**Right to Human Review**:
- Request manual review of any automated categorization
- Escalation process available for disputes
- No significant decision made without human oversight
- Contact: compliance@fiscalbehavioralfinance.com

**Opt-Out Options**:
- Disable automated categorization (use manual entry)
- Disable fraud detection alerts
- Disable personalized recommendations
- Maintain full platform functionality in manual mode
    `
  },
  {
    id: "employee-privacy",
    title: "Employee & Third-Party Data",
    content: `
**Employee Data Processing**:
- Minimal personal data collected (name, email, role)
- Access to production data restricted & logged
- Background checks conducted pre-employment
- Confidentiality agreements signed
- Data deleted 1 year after employment termination

**Third-Party Processors**:

1. **Supabase (Database Provider)**
   - Location: US & EU regions (with India option)
   - DPA Signed: Yes
   - Sub-processors: AWS, DigitalOcean
   - Data: All user data & transactions

2. **Vercel (Hosting & Deployment)**
   - Location: Global CDN with US primary
   - DPA Signed: Yes
   - Data: Platform code & non-sensitive metadata

3. **Payment Processors** (if future integration)
   - Stripe/RazorPay for payment collection
   - PCI-DSS Level 1 certified
   - No payment data stored on WealthOS

4. **Email Service**
   - SendGrid for email communications
   - DPA Signed: Yes
   - Data: User email address & notification preferences

**Vendor Assessment**:
- All vendors assessed against DPDP compliance requirements
- Annual security audits required
- Immediate notification of data breaches mandatory
- Right to audit vendor security practices
    `
  },
  {
    id: "legal-holds",
    title: "Legal Holds & Law Enforcement",
    content: `
**Government Requests**:
- Data provided only with valid legal order (subpoena, warrant)
- Minimal data disclosed (only what legally required)
- User notified of disclosure (except where prohibited by law)
- Request evaluation within 10 business days

**RBI/SEBI Requests**:
- Immediate compliance with regulatory requests
- User notified post-disclosure where feasible
- No advance notice if prohibited by regulation

**Tax & AML Compliance**:
- Financial transaction records maintained for tax authorities
- AML screening implemented for high-value transactions
- Suspicious Activity Reports (SARs) filed as required
- User anonymized in such reports

**Litigation Holds**:
- Data preserved during legal proceedings
- Retained beyond normal deletion schedule
- Access restricted to legal teams only

**Emergency Disclosure**:
- Imminent threat to public safety: May disclose without consent
- Examples: Suicidal ideation, fraud ring, criminal activity
- Disclosure documented & reported to compliance officer
    `
  },
  {
    id: "children-minors",
    title: "Children & Minors Protection",
    content: `
**Age Eligibility**:
- Minimum age: 18 years (legal majority in India)
- Parental consent required for ages 13-18
- No data collection for users under 13

**Minor Account Features** (Ages 13-18 with Parental Consent):
- Limited transaction tracking (no sensitive data)
- Educational features (financial literacy)
- Parental dashboard for monitoring
- Restricted to family member transactions only

**Parental Consent Process**:
1. Minor provides email during signup
2. WealthOS sends consent form to parent
3. Parent must verify via email & digital signature
4. Consent logged & stored indefinitely
5. Either party can revoke consent (account deleted)

**Data Protection for Minors**:
- Stricter access controls
- Enhanced encryption
- No profiling or behavioral tracking
- No personalized advertising
- Automatic data deletion on age milestone (18 years)
- Transferred to standard account with parental notice
    `
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    content: `
**Q: How long is my data stored?**
A: Active account: indefinite. After closure: 7 years for tax/RBI compliance. Behavioral data: 3 years. See "Data Retention Policy" section above.

**Q: Can I export my financial data?**
A: Yes! Go to Settings > Data Export. You'll receive a CSV file with all transactions, goals, budgets within 7 days.

**Q: Is my data shared with third parties?**
A: Only with data processors (Supabase, Vercel) under strict Data Processing Agreements. Never sold to marketers or advertisers.

**Q: How do I delete my account?**
A: Settings > Account > Delete Account. Data retained for 7 years per RBI rules, then permanently deleted.

**Q: Can I opt-out of behavioral tracking?**
A: Yes. Go to Settings > Privacy > Disable Analytics & Profiling. Gamification features will be limited.

**Q: What about credit score?**
A: You provide your own credit score (self-reported). We do NOT access CIBIL or credit bureaus. We do NOT modify your credit score.

**Q: Is my data encrypted?**
A: Yes. AES-256 at rest, TLS 1.3 in transit. Passwords hashed with bcrypt. All financial data encrypted end-to-end.

**Q: Do I have to provide all data?**
A: No. Required fields: email, name, monthly salary. Everything else is optional and can be deleted later.

**Q: How are disputes resolved?**
A: Contact compliance@fiscalbehavioralfinance.com. Response within 30 days. Escalate to DPDP Board if unsatisfied.

**Q: What about data breaches?**
A: We notify you within 72 hours. Mitigation steps provided. Incident reported to DPDP Board. Annual breach audit mandatory.
    `
  }
];

export default function Compliance() {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
  const [consents, setConsents] = useState<ComplianceStatus>({
    dataProcessing: false,
    privacyPolicy: false,
    explicitConsent: false,
    dataMinimization: false,
    userRights: false,
    dataRetention: false,
    timestamp: ""
  });
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadConsents();
  }, [user]);

  const loadConsents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("users_financial_profile")
      .select("compliance_consents")
      .eq("id", user.id)
      .single();

    if (data?.compliance_consents) {
      setConsents(data.compliance_consents);
    }
  };

  const updateConsent = async (field: keyof ComplianceStatus, value: boolean) => {
    if (!user) return;

    const updated = { ...consents, [field]: value, timestamp: new Date().toISOString() };
    setConsents(updated);

    const { error } = await supabase
      .from("users_financial_profile")
      .update({ compliance_consents: updated })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save consent");
      setConsents(consents);
    } else {
      toast.success("Consent saved");
    }
  };

  const allConsentsGiven = 
    consents.dataProcessing && 
    consents.privacyPolicy && 
    consents.explicitConsent && 
    consents.dataMinimization && 
    consents.userRights && 
    consents.dataRetention;

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-5">
        {!showPrintView && (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-heading text-xl font-extrabold mb-1">Data Privacy & DPDP Compliance</h2>
                <p className="text-[13px] text-muted-foreground">India DPDP Act 2023 compliance documentation</p>
              </div>
              <button onClick={() => setShowPrintView(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-heading font-bold text-muted-foreground hover:bg-secondary transition-all">
                <Download className="h-4 w-4" /> Print PDF
              </button>
            </div>

            {/* Consent Status */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-sm font-bold">Explicit Consent</h3>
              </div>
              <div className="space-y-3">
                {[
                  { key: "dataProcessing", label: "I consent to personal data processing for service provision" },
                  { key: "privacyPolicy", label: "I have read and accepted the Privacy Policy" },
                  { key: "explicitConsent", label: "I explicitly consent to data collection as per DPDP Act, Section 7" },
                  { key: "dataMinimization", label: "I understand data minimization principles" },
                  { key: "userRights", label: "I acknowledge my rights under DPDP Act (access, correction, erasure, etc.)" },
                  { key: "dataRetention", label: "I accept the data retention policy (7 years for transactions, 3 years for behavioral data)" }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consents[item.key as keyof ComplianceStatus] as boolean}
                      onChange={e => updateConsent(item.key as keyof ComplianceStatus, e.target.checked)}
                      className="w-5 h-5 rounded-md"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl flex items-center gap-2"
                style={{ background: allConsentsGiven ? "hsl(var(--primary)/0.1)" : "hsl(var(--warning)/0.1)" }}>
                {allConsentsGiven ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-primary font-semibold">All consents given - Your data is protected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))] flex-shrink-0" />
                    <span className="text-sm text-[hsl(var(--warning))] font-semibold">{6 - Object.values(consents).filter((v: any) => v === true).length} consents pending</span>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Compliance Documentation */}
        <div className="space-y-3">
          {COMPLIANCE_SECTIONS.map(section => (
            <div key={section.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <h3 className="font-heading font-bold text-sm">{section.title}</h3>
                </div>
                <div className={`transition-transform ${expandedSection === section.id ? "rotate-180" : ""}`}>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
              {expandedSection === section.id && (
                <div className="px-6 pb-6 border-t border-border text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center text-xs text-muted-foreground">
          <p className="mb-2">Last Updated: {new Date().toLocaleDateString()} | DPDP Act 2023 Compliant</p>
          <p>For inquiries: <span className="font-semibold text-foreground">compliance@fiscalbehavioralfinance.com</span></p>
        </div>
      </div>
    </DashboardLayout>
  );
}
