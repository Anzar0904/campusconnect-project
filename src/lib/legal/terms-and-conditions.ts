import { LegalDocument } from './types'

// Transcribed verbatim from "IILM_Connect_Privacy_and_Terms.docx" — Part B.
// Do not paraphrase, shorten, or otherwise alter this wording.
export const TERMS_AND_CONDITIONS: LegalDocument = {
  partLabel: 'PART B — TERMS AND CONDITIONS',
  title: 'Terms and Conditions',
  intro: [
    {
      type: 'paragraph',
      text:
        'These Terms and Conditions ("Terms") govern your use of IILM Connect. By registering or using the Platform in any way, you agree to be legally bound by these Terms. If you do not agree, do not use the Platform.',
    },
  ],
  sections: [
    {
      id: 'eligibility',
      number: '1',
      heading: 'Eligibility',
      blocks: [
        {
          type: 'paragraph',
          text: 'IILM Connect is an exclusive platform. To register and maintain an account, you must:',
        },
        {
          type: 'list',
          items: [
            'Be a currently enrolled student, faculty member, or staff of IILM University, Gurugram',
            'Hold a valid @iilm.edu institutional email address',
            'Be at least 18 years of age',
            'Not be banned or suspended from the Platform',
          ],
        },
        {
          type: 'paragraph',
          text:
            'IILM University reserves the right to verify eligibility at any time and to terminate accounts that no longer meet these criteria.',
        },
      ],
    },
    {
      id: 'account-responsibilities',
      number: '2',
      heading: 'Account Responsibilities',
      blocks: [
        {
          type: 'list',
          items: [
            'You are responsible for all activity that occurs under your account',
            'Keep your login credentials confidential. Do not share your magic link or session with anyone',
            'You must provide accurate and complete information when setting up your profile',
            'Notify us immediately at connect@iilm.edu if you suspect unauthorised access to your account',
            'You may not create more than one account or create an account on behalf of someone else',
          ],
        },
      ],
    },
    {
      id: 'acceptable-use',
      number: '3',
      heading: 'Acceptable Use',
      subsections: [
        {
          id: 'you-may',
          heading: '3.1 You May',
          blocks: [
            {
              type: 'list',
              items: [
                'Share academic notes, study materials, and educational resources in good faith',
                'Post content about campus life, events, clubs, and student activities',
                'Use the marketplace to buy and sell legitimate second-hand goods to fellow IILM students',
                'Participate in communities, clubs, and events within the Platform',
                'Send direct messages to friends who have accepted your connection request',
                'Report lost and found items on campus',
                'Submit anonymous confessions that are respectful and do not target specific individuals',
              ],
            },
          ],
        },
        {
          id: 'you-must-not',
          heading: '3.2 You Must Not',
          blocks: [
            {
              type: 'list',
              items: [
                'Post content that is abusive, threatening, defamatory, harassing, or discriminatory on the basis of gender, religion, caste, ethnicity, disability, or sexual orientation',
                "Share another person's personal information without their explicit consent (doxxing)",
                'Impersonate any IILM student, faculty member, or university official',
                'Upload or distribute copyrighted material without appropriate authorisation',
                'Use the Platform to solicit money, conduct commercial transactions outside the Marketplace feature, or operate a business',
                'Spread misinformation, fake news, or deliberately misleading content',
                'Post obscene, pornographic, or sexually explicit content',
                'Attempt to hack, reverse-engineer, or disrupt the Platform or its infrastructure',
                'Use automated bots, scrapers, or tools to extract data from the Platform',
                'Sell or offer for sale illegal goods, substances, or services through the Marketplace',
                'Use the Dating feature to harass, coerce, or manipulate other users',
                'Violate any applicable Indian law, including but not limited to the Information Technology Act, 2000, the Indian Penal Code, and the UGC regulations',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'content-ownership-and-licence',
      number: '4',
      heading: 'Content Ownership and Licence',
      blocks: [
        {
          type: 'paragraph',
          text:
            'You retain ownership of content you create and upload to IILM Connect. By posting content on the Platform, you grant IILM University and IILM Connect a non-exclusive, royalty-free, worldwide licence to host, display, reproduce, and distribute your content within the Platform for the purpose of operating the service.',
        },
        {
          type: 'paragraph',
          text:
            'You represent and warrant that you own or have the necessary rights to post any content you submit, and that your content does not infringe the intellectual property rights of any third party.',
        },
      ],
    },
    {
      id: 'moderation-and-enforcement',
      number: '5',
      heading: 'Moderation and Enforcement',
      subsections: [
        {
          id: 'reporting',
          heading: '5.1 Reporting',
          blocks: [
            {
              type: 'paragraph',
              text:
                'All users can report content or accounts that violate these Terms. Reports are reviewed by IILM Connect moderators, who may include IILM University staff.',
            },
          ],
        },
        {
          id: 'actions-we-may-take',
          heading: '5.2 Actions We May Take',
          blocks: [
            { type: 'paragraph', text: 'Depending on the severity and nature of a violation, we may:' },
            {
              type: 'list',
              items: [
                'Issue a warning to your account',
                'Remove or hide content that violates these Terms',
                'Temporarily suspend your account',
                'Permanently ban your account',
                'Refer serious violations to IILM University for disciplinary action under the Student Code of Conduct',
                'Report criminal activity to law enforcement authorities',
              ],
            },
          ],
        },
        {
          id: 'appeals',
          heading: '5.3 Appeals',
          blocks: [
            {
              type: 'paragraph',
              text:
                'If you believe a moderation action was taken in error, you may appeal by emailing connect@iilm.edu within 14 days of the action, with the subject line "Moderation Appeal". We will review your appeal and respond within 10 business days.',
            },
          ],
        },
      ],
    },
    {
      id: 'marketplace-rules',
      number: '6',
      heading: 'Marketplace Rules',
      blocks: [
        {
          type: 'list',
          items: [
            'The IILM Connect Marketplace is a peer-to-peer facilitation platform. We are not a party to any transaction between buyers and sellers',
            'You must only list items you legally own and have the right to sell',
            'Prohibited items include: illegal goods, prescription medications, weapons, alcohol, counterfeit or stolen goods, and any item prohibited on IILM campus',
            'All exchanges must take place in person on the IILM campus in a visible, public area',
            'IILM Connect accepts no liability for the quality, safety, legality, or delivery of items listed on the Marketplace',
            'Disputes between buyers and sellers are the responsibility of the parties involved. We are not an arbitrator',
          ],
        },
      ],
    },
    {
      id: 'dating-feature',
      number: '7',
      heading: 'Dating Feature',
      blocks: [
        {
          type: 'paragraph',
          text:
            'Access to the IILM Connect Dating feature ("Find My Person") is subject to the following additional conditions:',
        },
        {
          type: 'list',
          items: [
            'The Dating feature is available only to verified @iilm.edu users who are 18 years of age or older',
            'Participation is entirely voluntary. You may delete your dating profile at any time',
            'You must not use the Dating feature to harass, stalk, threaten, or coerce any user',
            'All interactions within the Dating feature must be consensual and respectful',
            'You must not solicit money or financial transactions through the Dating feature',
            'Sharing screenshots or recordings of private dating conversations without consent is a serious violation and may result in a permanent ban and referral to university authorities',
          ],
        },
        {
          type: 'paragraph',
          text: 'IILM Connect is not a matrimonial service and makes no representations regarding the suitability of matches.',
        },
      ],
    },
    {
      id: 'notes-library-and-academic-integrity',
      number: '8',
      heading: 'Notes Library and Academic Integrity',
      blocks: [
        { type: 'paragraph', text: 'The Notes Library is provided as a peer-learning resource. You agree that:' },
        {
          type: 'list',
          items: [
            "You will only upload notes and materials for which you hold the rights, or which are permitted to be shared under applicable copyright laws or your institution's policies",
            'You will not upload exam question papers or materials obtained through dishonest means',
            "Downloading and using notes from the Library must comply with IILM University's Academic Integrity Policy",
            'IILM Connect is not responsible for the accuracy or completeness of any materials uploaded by users',
          ],
        },
      ],
    },
    {
      id: 'limitation-of-liability',
      number: '9',
      heading: 'Limitation of Liability',
      blocks: [
        { type: 'paragraph', text: 'To the maximum extent permitted by applicable Indian law:' },
        {
          type: 'list',
          items: [
            'IILM Connect and IILM University are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform',
            'We do not guarantee that the Platform will be available at all times, error-free, or free from viruses or other harmful components',
            'We are not liable for any content posted by users, including defamatory, offensive, or inaccurate content',
            'Our total aggregate liability to you for any claim arising out of or in connection with the Platform shall not exceed the amount you paid us in the 12 months preceding the claim (which for a free service is nil)',
          ],
        },
      ],
    },
    {
      id: 'intellectual-property',
      number: '10',
      heading: 'Intellectual Property',
      blocks: [
        {
          type: 'paragraph',
          text:
            'The IILM Connect name, logo, design, and all original content created by our team are the intellectual property of IILM University. You may not use, reproduce, or distribute any of our intellectual property without prior written consent. The underlying software is built on open-source components which retain their respective licences.',
        },
      ],
    },
    {
      id: 'third-party-links-and-services',
      number: '11',
      heading: 'Third-Party Links and Services',
      blocks: [
        {
          type: 'paragraph',
          text:
            'IILM Connect may contain links to third-party websites or services (for example, external registration forms for events or internship portals). We are not responsible for the content, privacy practices, or reliability of any third-party service. Visiting third-party links is at your own risk.',
        },
      ],
    },
    {
      id: 'governing-law-and-dispute-resolution',
      number: '12',
      heading: 'Governing Law and Dispute Resolution',
      blocks: [
        {
          type: 'paragraph',
          text:
            'These Terms are governed by and construed in accordance with the laws of India. Any dispute arising from your use of IILM Connect shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts located in Gurugram, Haryana, India.',
        },
      ],
    },
    {
      id: 'changes-to-these-terms',
      number: '13',
      heading: 'Changes to These Terms',
      blocks: [
        {
          type: 'paragraph',
          text:
            'We reserve the right to update these Terms at any time. Material changes will be notified to you via an in-app alert at least 7 days before the change takes effect. Your continued use of the Platform after the effective date of revised Terms constitutes your acceptance.',
        },
      ],
    },
    {
      id: 'termination',
      number: '14',
      heading: 'Termination',
      blocks: [
        {
          type: 'paragraph',
          text:
            'You may close your account at any time through Settings. Upon termination, your access to the Platform ceases immediately. Data deletion will follow the retention periods described in Section 6 of the Privacy Policy. We may terminate or suspend your account immediately without notice if you breach these Terms.',
        },
      ],
    },
    {
      id: 'contact-us',
      number: '15',
      heading: 'Contact Us',
      blocks: [
        {
          type: 'paragraph',
          text:
            'For any questions, concerns, or requests relating to this Privacy Policy or these Terms, please contact:',
        },
        {
          type: 'table',
          rows: [
            { label: 'Email', value: 'connect@iilm.edu' },
            { label: 'Address', value: 'IILM University, 16, Knowledge Park II, Greater Noida / Gurugram Campus' },
            { label: 'Response', value: 'We aim to respond to all privacy and legal queries within 5 working days' },
          ],
        },
      ],
    },
  ],
}
