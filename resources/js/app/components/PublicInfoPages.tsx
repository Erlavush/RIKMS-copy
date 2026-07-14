import type { ReactNode } from "react";
import { Building2, CircleHelp, FileLock2, Mail, Scale, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { useBootstrap } from "../hooks/useBootstrap";

function InfoPage({
    eyebrow,
    title,
    description,
    icon,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <div>
            <header className="bg-gradient-to-br from-[#1E3A8A] to-[#2D4BA0] text-white">
                <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                        {icon}
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-200">
                        {eyebrow}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
                    <p className="mt-4 max-w-3xl leading-7 text-blue-100">{description}</p>
                </div>
            </header>
            <div className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6 sm:py-14">
                <div className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
                    {children}
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600">{children}</div>
        </section>
    );
}

export function HelpPage() {
    return (
        <InfoPage
            eyebrow="User guide"
            title="Help using RIKMS"
            description="Find research, understand access controls, and use the appropriate workspace without exposing restricted records."
            icon={<CircleHelp className="h-6 w-6" aria-hidden="true" />}
        >
            <Section title="Find published research">
                <p>
                    Start in{" "}
                    <Link className="font-semibold text-[#1E3A8A] hover:underline" to="/browse">
                        Browse research
                    </Link>
                    . Search by title or a publicly shared metadata field, then narrow results by agency,
                    category, year, or Sustainable Development Goal. RIKMS never searches a private field for
                    public users.
                </p>
            </Section>
            <Section title="Open or request a document">
                <p>
                    Each record explains its access policy. Public files can be downloaded immediately.
                    External sources open through the repository. A request-controlled file requires your
                    contact details and research purpose; the contributing agency reviews that request and may
                    issue a limited, expiring download link.
                </p>
                <p>
                    Embargoed material becomes publicly available only after its release date.
                    Administrator-only records cannot be requested from the public site.
                </p>
            </Section>
            <Section title="Agency and system workspaces">
                <p>
                    Authorized agency staff use the{" "}
                    <Link className="font-semibold text-[#1E3A8A] hover:underline" to="/login">
                        agency portal
                    </Link>{" "}
                    to create drafts, review extracted metadata, submit records, manage access requests, and
                    view their agency activity. Platform administrators use a separate secured administration
                    workspace.
                </p>
            </Section>
            <Section title="Still need help?">
                <p>
                    For questions about a particular study, contact the agency shown on that research record.
                    For a platform problem, use the support address on the{" "}
                    <Link className="font-semibold text-[#1E3A8A] hover:underline" to="/contact">
                        contact page
                    </Link>
                    . Never send passwords, access links, or sensitive research files by ordinary email.
                </p>
            </Section>
        </InfoPage>
    );
}

export function ContactPage() {
    const { data } = useBootstrap();
    const supportEmail = data?.platform?.supportEmail;

    return (
        <InfoPage
            eyebrow="Support"
            title="Contact RIKMS"
            description="Choose the contact that owns the information or service you need so your request reaches the right team."
            icon={<Mail className="h-6 w-6" aria-hidden="true" />}
        >
            <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-xl border border-gray-200 p-5">
                    <Building2 className="h-6 w-6 text-[#1E3A8A]" aria-hidden="true" />
                    <h2 className="mt-4 text-lg font-bold text-slate-900">Research and access questions</h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                        Contact the contributing agency listed on the research record. Agencies own their
                        submissions, decide controlled-access requests, and can clarify citation or content
                        questions.
                    </p>
                    <Link
                        to="/agencies"
                        className="mt-4 inline-flex font-semibold text-[#1E3A8A] hover:underline"
                    >
                        View participating agencies
                    </Link>
                </section>
                <section className="rounded-xl border border-gray-200 p-5">
                    <ShieldCheck className="h-6 w-6 text-[#1E3A8A]" aria-hidden="true" />
                    <h2 className="mt-4 text-lg font-bold text-slate-900">Platform support</h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                        Report sign-in, availability, or platform-security problems to the configured system
                        support contact. Include the page, time, and a non-sensitive description of what
                        happened.
                    </p>
                    {supportEmail ? (
                        <a
                            href={`mailto:${supportEmail}`}
                            className="mt-4 inline-flex items-center gap-2 font-semibold text-[#1E3A8A] hover:underline"
                        >
                            <Mail className="h-4 w-4" aria-hidden="true" /> {supportEmail}
                        </a>
                    ) : (
                        <p className="mt-4 text-sm font-semibold text-amber-700">
                            No platform support email is currently published. Ask a participating agency to
                            route the issue to the RIKMS system owner.
                        </p>
                    )}
                </section>
            </div>
            <Section title="Security and privacy reports">
                <p>
                    Do not include credentials, raw access tokens, or confidential documents in an initial
                    report. Describe the affected account or record without sharing restricted content; the
                    system owner can arrange a safer follow-up channel when necessary.
                </p>
            </Section>
        </InfoPage>
    );
}

export function PrivacyPage() {
    const { data } = useBootstrap();
    const supportEmail = data?.platform?.supportEmail;

    return (
        <InfoPage
            eyebrow="Data protection"
            title="Privacy notice"
            description="This notice explains the personal information RIKMS handles and the controls used to protect research-access and administrator activity."
            icon={<FileLock2 className="h-6 w-6" aria-hidden="true" />}
        >
            <Section title="Information RIKMS handles">
                <p>
                    Public browsing does not require an account. When you request controlled access, RIKMS
                    records the name, email address, organization, purpose, decision, and related
                    security/audit information needed to process the request. Administrator accounts include
                    identity, agency assignment, role, authentication events, and actions performed in the
                    system.
                </p>
            </Section>
            <Section title="Why it is used">
                <p>
                    Information is used to authenticate authorized staff, enforce agency and role boundaries,
                    review research submissions, decide access requests, deliver limited download grants, send
                    operational notifications, investigate abuse, and maintain accountable audit records. It
                    is not used by this application for advertising or sale.
                </p>
            </Section>
            <Section title="Who can see it">
                <p>
                    Access-request details are limited to authorized administrators for the contributing
                    agency and platform administrators. Public visitors see only published records and
                    metadata fields deliberately marked public. Service operators may access logs or backups
                    only as required to operate, secure, or recover the platform.
                </p>
            </Section>
            <Section title="Retention, security, and your choices">
                <p>
                    Records are retained according to the responsible organization&apos;s approved records and
                    privacy schedule. RIKMS uses private file storage, server-side authorization, encrypted
                    sessions in deployment, audit trails, expiring access links, and security headers; no
                    online system can promise absolute security. Avoid submitting unnecessary sensitive
                    information in free-text fields.
                </p>
                <p>
                    Contact the contributing agency about access-request data tied to its record. For platform
                    account or privacy questions
                    {supportEmail ? (
                        <>
                            , email{" "}
                            <a
                                className="font-semibold text-[#1E3A8A] hover:underline"
                                href={`mailto:${supportEmail}`}
                            >
                                {supportEmail}
                            </a>
                        </>
                    ) : (
                        ", contact the RIKMS system owner through a participating agency"
                    )}
                    . Requests remain subject to applicable records, security, and legal obligations.
                </p>
            </Section>
        </InfoPage>
    );
}

export function TermsPage() {
    return (
        <InfoPage
            eyebrow="Responsible use"
            title="Terms of use"
            description="These operational terms protect the repository, its contributors, and people requesting controlled research access."
            icon={<Scale className="h-6 w-6" aria-hidden="true" />}
        >
            <Section title="Permitted use">
                <p>
                    You may browse published metadata and use accessible research for lawful research,
                    education, policy, and other authorized purposes. Follow the citation, attribution,
                    copyright, confidentiality, and reuse conditions supplied by the contributing agency or
                    source publication.
                </p>
            </Section>
            <Section title="Controlled access">
                <p>
                    Provide accurate information and a truthful purpose when requesting a restricted file. An
                    approval applies only to the named recipient and purpose. Do not share, automate, resell,
                    or attempt to extend an expiring download link, and do not redistribute restricted content
                    without written authorization.
                </p>
            </Section>
            <Section title="Account responsibilities">
                <p>
                    Authorized administrators must protect credentials, use only their assigned role and
                    agency scope, verify AI-assisted metadata before saving it, and never use the interface to
                    bypass review or publish unapproved material. Activity may be audited to protect
                    repository integrity.
                </p>
            </Section>
            <Section title="Prohibited activity">
                <p>
                    Do not probe or evade access controls, upload malicious or unlawful material, impersonate
                    another requester, overload the service, scrape restricted information, tamper with
                    records, or interfere with another user. Access may be revoked while suspected abuse is
                    investigated.
                </p>
            </Section>
            <Section title="Content and service availability">
                <p>
                    Contributing agencies remain responsible for their research records and access decisions.
                    RIKMS may correct, reject, archive, or temporarily withhold records to address quality,
                    rights, privacy, or security concerns. Availability may be interrupted for maintenance or
                    incident response.
                </p>
                <p>
                    If these terms conflict with a record-specific license, access agreement, or applicable
                    requirement, the more specific obligation governs that use. Continued use after a
                    published update means you accept the updated operational terms.
                </p>
            </Section>
            <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                Looking for a record?{" "}
                <Link className="font-semibold hover:underline" to="/browse">
                    <Search className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    Browse published research
                </Link>
                .
            </p>
        </InfoPage>
    );
}
