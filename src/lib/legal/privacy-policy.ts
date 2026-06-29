import { LegalDocument } from './types'

// Transcribed verbatim from "IILM_Connect_Privacy_and_Terms.docx" — Part A.
// Do not paraphrase, shorten, or otherwise alter this wording.
export const PRIVACY_POLICY: LegalDocument = {
  partLabel: 'PART A — PRIVACY POLICY',
  title: 'Privacy Policy',
  intro: [
    {
      type: 'paragraph',
      text:
        'This Privacy Policy explains how IILM Connect ("we", "us", "the Platform") collects, uses, stores, shares, and protects your personal information when you access or use our campus application. By creating an account or using any feature of IILM Connect, you confirm that you have read and agree to this Policy.',
    },
  ],
  sections: [
    {
      id: 'who-we-are',
      number: '1',
      heading: 'Who We Are',
      blocks: [
        {
          type: 'paragraph',
          text:
            'IILM Connect is a digital campus platform exclusively for students, faculty, and staff of IILM University, Gurugram. Access is restricted to verified holders of an @iilm.edu institutional email address. The Platform is operated under the authority of IILM University and is governed by Indian law.',
        },
      ],
    },
    {
      id: 'information-we-collect',
      number: '2',
      heading: 'Information We Collect',
      subsections: [
        {
          id: 'information-you-provide-directly',
          heading: '2.1 Information You Provide Directly',
          blocks: [
            {
              type: 'list',
              items: [
                'Account details: full name, username, profile photograph',
                'Academic information: branch/programme, year, roll number',
                'Hostel and contact information: hostel name, phone number',
                'Content you create: posts, confessions, poll responses, comments, messages',
                'Files you upload: notes, study materials, marketplace listing photos',
                'Dating profile details (if you opt in): bio, interests, photographs',
              ],
            },
          ],
        },
        {
          id: 'information-collected-automatically',
          heading: '2.2 Information Collected Automatically',
          blocks: [
            {
              type: 'list',
              items: [
                'Device type, operating system, and browser information',
                'IP address and approximate location (city level)',
                'Usage patterns: pages visited, features used, time spent',
                'Log data: error reports, timestamps, session identifiers',
              ],
            },
          ],
        },
        {
          id: 'information-from-third-parties',
          heading: '2.3 Information from Third Parties',
          blocks: [
            {
              type: 'list',
              items: [
                'Authentication data from Supabase (our database and auth provider)',
                'File metadata from Supabase Storage when you upload documents or images',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'how-we-use-your-information',
      number: '3',
      heading: 'How We Use Your Information',
      blocks: [
        { type: 'paragraph', text: 'We use your personal data for the following purposes:' },
        {
          type: 'list',
          items: [
            'To create and manage your IILM Connect account',
            'To verify your institutional identity via your @iilm.edu email',
            'To display your profile to other verified IILM students',
            'To enable social features: friends, messaging, posts, communities, and clubs',
            'To power campus utilities: notes library, marketplace, lost & found, events',
            'To facilitate career features: internship listings, placement records, mentorship',
            'To personalise your feed and content recommendations',
            'To send important notifications about your account and campus updates',
            'To maintain the security and integrity of the Platform',
            'To comply with applicable legal obligations',
          ],
        },
      ],
    },
    {
      id: 'legal-basis-for-processing',
      number: '4',
      heading: 'Legal Basis for Processing',
      blocks: [
        {
          type: 'paragraph',
          text:
            'Where the Information Technology Act, 2000 and applicable Indian data protection legislation applies, we rely on the following legal bases:',
        },
        {
          type: 'list',
          items: [
            'Consent — for optional features such as the Dating module, marketing communications, and sharing of sensitive personal data',
            'Contract performance — to provide the core campus platform services you sign up for',
            'Legitimate interests — for platform security, fraud prevention, and product improvement',
            'Legal obligation — where we are required to retain or share data under Indian law',
          ],
        },
      ],
    },
    {
      id: 'data-sharing',
      number: '5',
      heading: 'Data Sharing',
      subsections: [
        {
          id: 'within-the-platform',
          heading: '5.1 Within the Platform',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Your name, profile photo, branch, year, and posts are visible to other verified @iilm.edu users. Anonymous confessions do not reveal your identity. You control the visibility of your dating profile.',
            },
          ],
        },
        {
          id: 'service-providers',
          heading: '5.2 Service Providers',
          blocks: [
            {
              type: 'paragraph',
              text:
                'We share data with carefully selected third-party processors who help us operate the Platform, including Supabase (database, authentication, file storage) and Vercel (application hosting). These providers are contractually bound to process your data only as instructed.',
            },
          ],
        },
        {
          id: 'iilm-university-administration',
          heading: '5.3 IILM University Administration',
          blocks: [
            {
              type: 'paragraph',
              text:
                'We may share anonymised, aggregated usage statistics with IILM University administration for institutional planning. We will only share individually identifiable information with university authorities if required for disciplinary proceedings, legal compliance, or where you have given explicit consent.',
            },
          ],
        },
        {
          id: 'law-enforcement',
          heading: '5.4 Law Enforcement',
          blocks: [
            {
              type: 'paragraph',
              text:
                'We may disclose personal data if required to do so by a court order, government authority, or applicable law, or where we believe disclosure is necessary to protect the safety of any person.',
            },
          ],
        },
        {
          id: 'what-we-never-do',
          heading: '5.5 What We Never Do',
          blocks: [
            {
              type: 'list',
              items: [
                'We do not sell your personal data to any third party',
                'We do not share your data with advertisers or advertising networks',
                'We do not use your data to build commercial advertising profiles',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'data-retention',
      number: '6',
      heading: 'Data Retention',
      blocks: [
        {
          type: 'paragraph',
          text:
            'We retain your data for as long as your account is active or as required to provide services. Specific retention periods:',
        },
        {
          type: 'table',
          rows: [
            { label: 'Account data', value: 'Retained for the duration of your account, deleted within 30 days of account closure' },
            { label: 'Messages', value: 'Retained for 12 months from the date of the conversation' },
            { label: 'Posts & comments', value: 'Retained until deleted by you or a moderator' },
            { label: 'Uploaded files', value: 'Retained until you delete them or your account is closed' },
            { label: 'Anonymous confessions', value: 'No link to your identity is retained after posting' },
            { label: 'Usage logs', value: 'Retained for 90 days for security and debugging purposes' },
          ],
        },
      ],
    },
    {
      id: 'your-rights',
      number: '7',
      heading: 'Your Rights',
      blocks: [
        {
          type: 'paragraph',
          text: 'As a user of IILM Connect you have the following rights with respect to your personal data:',
        },
        {
          type: 'list',
          items: [
            'Right to access: request a copy of the data we hold about you',
            'Right to rectification: correct inaccurate or incomplete data',
            'Right to erasure: request deletion of your account and associated data',
            'Right to restriction: ask us to limit how we process your data in certain circumstances',
            'Right to portability: receive your data in a machine-readable format',
            'Right to withdraw consent: withdraw consent at any time for consent-based processing (e.g., the Dating feature)',
          ],
        },
        {
          type: 'paragraph',
          text: 'To exercise any of these rights, please contact us at connect@iilm.edu. We will respond within 30 days.',
        },
      ],
    },
    {
      id: 'data-security',
      number: '8',
      heading: 'Data Security',
      blocks: [
        {
          type: 'paragraph',
          text: 'We implement industry-standard technical and organisational measures to protect your data, including:',
        },
        {
          type: 'list',
          items: [
            'All data transmitted between your device and our servers is encrypted using TLS 1.2 or higher',
            'Passwords and authentication tokens are never stored in plaintext',
            'Access to production databases is restricted to authorised personnel only',
            'Regular security reviews and vulnerability assessments are conducted',
            'Supabase Row Level Security (RLS) policies ensure users can only access their own data',
          ],
        },
        {
          type: 'paragraph',
          text:
            'Despite these measures, no transmission over the internet is 100% secure. You use the Platform at your own risk and are responsible for maintaining the confidentiality of your login credentials.',
        },
      ],
    },
    {
      id: 'cookies-and-tracking',
      number: '9',
      heading: 'Cookies and Tracking',
      blocks: [
        {
          type: 'paragraph',
          text:
            'IILM Connect uses session cookies and local storage to maintain your logged-in state and remember your preferences. We do not use third-party advertising cookies. You can clear cookies through your browser settings, but doing so may log you out of the Platform.',
        },
      ],
    },
    {
      id: 'childrens-privacy',
      number: '10',
      heading: "Children's Privacy",
      blocks: [
        {
          type: 'paragraph',
          text:
            'IILM Connect is intended for students aged 18 and above. We do not knowingly collect data from individuals under 18. If you believe a minor has registered on the Platform, please contact us immediately at connect@iilm.edu.',
        },
      ],
    },
    {
      id: 'changes-to-this-policy',
      number: '11',
      heading: 'Changes to This Policy',
      blocks: [
        {
          type: 'paragraph',
          text:
            'We may update this Privacy Policy from time to time. We will notify you of material changes via an in-app notification and by updating the Effective Date at the top of this document. Your continued use of the Platform after changes become effective constitutes your acceptance of the revised Policy.',
        },
      ],
    },
  ],
}
