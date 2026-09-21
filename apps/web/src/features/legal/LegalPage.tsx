import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

type LegalPageProps = {
  type: 'privacy' | 'terms';
};

const company = {
  name: 'MetaBull Universe',
  email: 'metabulluniverse@gmail.com',
  address: 'Plot No. 25, 3rd Floor, Sector C, Indrapuri, Bhopal, Madhya Pradesh, India'
};

const privacySections = [
  {
    title: 'Information we collect',
    body: (
      <>
        <p>We collect account and workspace information that authorized users provide, including names, business email addresses, roles, client and vendor records, and financial operations data entered into ADS Control.</p>
        <p>When an authorized user connects Meta or Facebook, we may receive the user&apos;s Meta identifier and name, granted access permissions, business portfolios, ad account identifiers and names, account status, currency, timezone, balance, spend cap, campaigns, and advertising performance data such as spend, impressions, and clicks. We also store connection and synchronization timestamps.</p>
      </>
    )
  },
  {
    title: 'How we use information',
    body: <p>We use this information to authenticate users, connect authorized Meta assets, synchronize advertising data, monitor account health, reconcile advertising funds, generate internal reports, investigate operational issues, and protect the security and integrity of the service.</p>
  },
  {
    title: 'Meta platform data',
    body: <p>Meta platform data is used only to provide the features requested by the connecting user and their organization. ADS Control does not sell Meta platform data or use it to build advertising profiles for unrelated purposes. Access is limited to authorized workspace users according to their role.</p>
  },
  {
    title: 'Sharing and service providers',
    body: <p>We may share information with infrastructure, database, hosting, security, and technical service providers only where needed to operate ADS Control. We may also disclose information when required by law, to protect legal rights, or during a business reorganization subject to appropriate safeguards. We do not sell personal information.</p>
  },
  {
    title: 'Storage, security, and retention',
    body: <p>We apply access controls, role-based permissions, audit records, and reasonable administrative and technical safeguards. No system is completely secure. We retain information while the organization&apos;s account or Meta connection remains active and as needed for operational, legal, accounting, fraud-prevention, and audit obligations. Data that is no longer required is deleted or de-identified.</p>
  },
  {
    title: 'Data deletion and disconnection',
    body: (
      <>
        <p>You can remove ADS Control&apos;s access from your Facebook or Meta Business settings. To request deletion of data associated with your Meta connection, email <a href={`mailto:${company.email}?subject=ADS Control data deletion request`} className="text-[#0064e0] underline underline-offset-2">{company.email}</a> with the subject “ADS Control data deletion request”. Include the connected profile name, Meta user ID if available, organization name, and a contact email.</p>
        <p>We will verify the request, disconnect the relevant integration, and delete or de-identify associated personal and Meta platform data unless retention is required by law, security, accounting, or an active dispute. We will confirm completion or explain any lawful retention requirement.</p>
      </>
    )
  },
  {
    title: 'Your choices and rights',
    body: <p>Depending on applicable law, you may request access, correction, deletion, restriction, or a copy of your personal information. You may withdraw a Meta connection at any time, although this will stop connected features and future synchronization.</p>
  },
  {
    title: 'Changes to this policy',
    body: <p>We may update this policy when the service, legal requirements, or data practices change. The revised date will appear at the top of this page. Material changes will be communicated through the service or an appropriate contact channel.</p>
  }
];

const termsSections = [
  {
    title: 'Using ADS Control',
    body: <p>ADS Control is an internal advertising operations and financial management service provided by {company.name}. You may use it only if you are authorized by the organization that owns the workspace and can form a binding agreement under applicable law.</p>
  },
  {
    title: 'Accounts and access',
    body: <p>You are responsible for accurate account information, protecting your credentials, and activity performed through your account. Do not share access outside your organization or attempt to bypass role restrictions. Notify us promptly if you suspect unauthorized access.</p>
  },
  {
    title: 'Meta and third-party services',
    body: <p>Connecting Meta assets authorizes ADS Control to access approved data and perform requested synchronization. Your use of Meta products remains subject to Meta&apos;s own terms and policies. Third-party availability, permissions, tokens, APIs, and data may change or become unavailable, and we do not control those services.</p>
  },
  {
    title: 'Financial and advertising information',
    body: <p>ADS Control supports operational tracking and reconciliation. It is not a bank, payment processor, accounting firm, legal adviser, or tax adviser. Balances, allocations, alerts, and reports should be reviewed against primary records before financial, legal, or advertising decisions are made.</p>
  },
  {
    title: 'Acceptable use',
    body: <p>You must not misuse the service, access data without authorization, introduce malicious code, disrupt system operation, scrape or reverse engineer protected parts of the service, violate applicable advertising or privacy laws, or use connected data for an unrelated or unlawful purpose.</p>
  },
  {
    title: 'Your data and permissions',
    body: <p>You retain rights in information you submit. You grant us the limited permission needed to host, process, synchronize, display, secure, and back up that information to operate ADS Control. You confirm that you have the authority and lawful basis to provide and process the data you connect or upload.</p>
  },
  {
    title: 'Service availability',
    body: <p>We work to keep ADS Control accurate and available, but the service is provided on an “as available” basis. Maintenance, outages, API limits, connection expiry, upstream errors, or incomplete source data may delay or affect results. Features may be changed to improve security, reliability, or compliance.</p>
  },
  {
    title: 'Suspension and termination',
    body: <p>Access may be suspended or terminated for security risks, unlawful activity, policy violations, non-payment where applicable, or loss of organizational authorization. On termination, access ends and data is handled according to our Privacy Policy and applicable retention obligations.</p>
  },
  {
    title: 'Liability and governing law',
    body: <p>To the extent permitted by law, {company.name} is not liable for indirect, incidental, special, consequential, or lost-profit damages arising from the service or third-party platforms. These terms are governed by the laws of India, and disputes are subject to the competent courts in Bhopal, Madhya Pradesh.</p>
  },
  {
    title: 'Changes to these terms',
    body: <p>We may update these terms to reflect service, legal, or operational changes. Continued use after an update takes effect means you accept the revised terms. Material changes will be communicated through the service or an appropriate contact channel.</p>
  }
];

export const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const isPrivacy = type === 'privacy';
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-[#1c1e21]">
      <header className="sticky top-0 z-10 border-b border-[#e4e7eb] bg-white">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#0064e0]">
            <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#0064e0] text-xs font-bold text-white">M</span>
            ADS Control
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#1c1e21]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)] md:py-14">
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#0064e0]" />
            Legal
          </div>
          <nav className="mt-4 flex gap-2 md:flex-col" aria-label="Legal pages">
            <Link to="/privacy" className={`rounded-[5px] px-3 py-2 text-sm ${isPrivacy ? 'bg-[#e7f3ff] font-semibold text-[#0064e0]' : 'text-[#475569] hover:bg-white'}`}>Privacy Policy</Link>
            <Link to="/terms" className={`rounded-[5px] px-3 py-2 text-sm ${!isPrivacy ? 'bg-[#e7f3ff] font-semibold text-[#0064e0]' : 'text-[#475569] hover:bg-white'}`}>Terms of Service</Link>
          </nav>
        </aside>

        <article className="min-w-0 rounded-[5px] border border-[#e4e7eb] bg-white px-5 py-7 sm:px-9 sm:py-9">
          <header className="border-b border-[#e4e7eb] pb-7">
            <h1 className="text-2xl font-semibold text-[#101214] sm:text-3xl">{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
            <p className="mt-2 text-sm text-[#5d6c7b]">Effective and last updated: September 18, 2026</p>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#334155]">
              {isPrivacy
                ? `This policy explains how ${company.name} collects, uses, stores, and protects information when authorized users use ADS Control or connect Meta services.`
                : `These terms govern authorized access to and use of ADS Control, including its Meta advertising and financial operations features.`}
            </p>
          </header>

          <div className="space-y-8 py-8">
            {sections.map((section) => (
              <section key={section.title} id={section.title === 'Data deletion and disconnection' ? 'data-deletion' : undefined} className="scroll-mt-20">
                <h2 className="text-base font-semibold text-[#101214]">{section.title}</h2>
                <div className="mt-2 space-y-3 text-sm leading-6 text-[#475569]">{section.body}</div>
              </section>
            ))}
          </div>

          <footer className="border-t border-[#e4e7eb] pt-7 text-sm leading-6 text-[#475569]">
            <h2 className="font-semibold text-[#101214]">Contact</h2>
            <p className="mt-2">{company.name}<br />{company.address}</p>
            <a href={`mailto:${company.email}`} className="mt-1 inline-block text-[#0064e0] underline underline-offset-2">{company.email}</a>
          </footer>
        </article>
      </main>
    </div>
  );
};
