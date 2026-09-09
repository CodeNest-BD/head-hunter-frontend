import type { LegalSection } from "@/components/landing/LegalPage";

export const TERMS_UPDATED = "September 7, 2026";

export const TERMS_INTRO: readonly string[] = [
  "Welcome to **Head-Hunters.com** (“Head-Hunters”, “Platform”, “we”, “us”, or “our”). These Terms of Service (“Terms”) govern your access to and use of the Head-Hunters.com website, marketplace, recruiting platform, services, and related features.",
  "By creating an account, posting a job, accepting or working on a job, submitting or reviewing a candidate, communicating through the Platform, paying or receiving fees, or otherwise using Head-Hunters.com, you agree to be bound by these Terms.",
  "If you do not agree to these Terms, you may not use the Platform.",
];

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: "the-platform",
    number: "1",
    title: "The Head-Hunters.com Platform",
    blocks: [
      "Head-Hunters.com operates a marketplace designed to connect companies seeking candidates (“Companies”, “Employers”, or “Clients”) with independent recruiters and recruiting professionals (“Recruiters”).",
      "Head-Hunters.com provides the technology and marketplace through which Companies and Recruiters may identify opportunities, exchange candidate information, communicate, and facilitate recruiting engagements.",
      "Unless expressly stated otherwise, **Head-Hunters.com is not the employer of any candidate, is not the employer or agent of any Recruiter, and does not guarantee the performance of any Company, Recruiter, candidate, or employee.**",
      "Recruiters using the Platform operate independently and are not employees, partners, joint venturers, representatives, or agents of Head-Hunters.com.",
    ],
  },
  {
    id: "accurate-information",
    number: "2",
    title: "Account Eligibility and Accurate Information",
    blocks: [
      "Users must provide accurate, complete, current, and truthful information when creating an account and while using the Platform.",
      "Companies agree that information they provide regarding their organization, employment opportunities, compensation, job responsibilities, qualifications, hiring requirements, recruiting fees, and other material information will be accurate to the best of their knowledge.",
      "Recruiters agree that information regarding their identity, professional background, qualifications, experience, candidate relationships, candidate submissions, and other representations made through the Platform will be accurate and truthful.",
      "Users may not impersonate another individual or organization, misrepresent their identity or authority, create accounts using false information, knowingly submit fraudulent information, or materially misrepresent a candidate, job opportunity, Company, or recruiting engagement.",
      "Head-Hunters.com may suspend or terminate accounts that contain false, misleading, fraudulent, or materially inaccurate information.",
    ],
  },
  {
    id: "company-responsibilities",
    number: "3",
    title: "Company Responsibilities",
    blocks: [
      "Companies are responsible for the accuracy and legality of their job postings and hiring activities.",
      "Companies are responsible for independently evaluating candidates and making their own hiring decisions. This includes conducting interviews, reference checks, background checks, credential verification, employment eligibility verification, and any other due diligence the Company considers appropriate or that applicable law requires.",
      "A Company’s decision to interview, hire, employ, compensate, supervise, retain, discipline, or terminate a candidate is solely the Company’s responsibility.",
    ],
  },
  {
    id: "recruiter-responsibilities",
    number: "4",
    title: "Recruiter Responsibilities",
    blocks: [
      "Recruiters are responsible for conducting their recruiting activities professionally and in accordance with applicable laws.",
      "Recruiters may only submit candidates whom they have a legitimate basis to represent or refer for the applicable opportunity.",
      "Recruiters must make reasonable efforts to ensure that material candidate information submitted through the Platform is accurate and must not knowingly falsify, materially alter, or misrepresent a candidate’s qualifications, employment history, compensation expectations, experience, credentials, interest, or availability.",
      "Recruiters are responsible for complying with applicable privacy, data protection, employment, recruiting, and anti-discrimination laws.",
    ],
  },
  {
    id: "candidate-submissions",
    number: "5",
    title: "Candidate Submissions and Ownership",
    blocks: [
      "Candidate introductions and submissions made through Head-Hunters.com are considered Platform-generated recruiting transactions for purposes of these Terms.",
      "A Company may not use candidate information obtained through Head-Hunters.com to avoid a recruiting fee or other Platform obligation.",
      "If a candidate is introduced or submitted through Head-Hunters.com and the Company subsequently hires, engages, contracts with, or otherwise employs that candidate, the transaction may remain subject to the applicable recruiting fee and Platform fees even if the Company and candidate later communicate outside the Platform.",
      "The Platform's records, including candidate submission timestamps and related activity, may be used in determining when and through whom a candidate was introduced.",
      "If a Company claims it had a documented pre-existing relationship with a submitted candidate, Head-Hunters.com may require reasonable evidence demonstrating that the Company was already actively engaged with that candidate before the Platform submission.",
    ],
  },
  {
    id: "non-circumvention",
    number: "6",
    title: "Non-Circumvention and Candidate Theft",
    blocks: [
      {
        strong:
          "Companies and Recruiters expressly agree not to circumvent Head-Hunters.com for the purpose of avoiding recruiting fees, Platform fees, payment obligations, or other charges associated with a transaction originating through the Platform.",
      },
      "Prohibited circumvention includes, without limitation:",
      {
        list: [
          "Moving a recruiting engagement or candidate transaction off-platform to avoid fees;",
          "Directly hiring or engaging a candidate introduced through Head-Hunters.com without reporting the hire as required;",
          "A Recruiter directing a Company to pay the Recruiter outside Head-Hunters.com for a Platform-originated placement;",
          "A Company offering or making direct payment to a Recruiter to avoid Platform charges;",
          "Concealing, delaying, mischaracterizing, or failing to report a hire or engagement;",
          "Creating a separate agreement designed to avoid Head-Hunters.com fees;",
          "Using candidate contact information obtained through the Platform to complete a hiring transaction outside the Platform for the purpose of avoiding fees; or",
          "Assisting another person or entity in circumventing the Platform.",
        ],
      },
      "Unauthorized use of a candidate introduction to intentionally avoid an applicable recruiting fee may be treated by Head-Hunters.com as **candidate theft or fee circumvention** for purposes of enforcement under these Terms.",
      "If Head-Hunters.com reasonably determines that circumvention has occurred, the responsible user remains liable for all fees that would otherwise have been payable through the Platform, together with any other remedies available under these Terms or applicable law.",
      "Head-Hunters.com may suspend or permanently terminate users who engage in attempted or completed circumvention.",
      "The obligations contained in this Section survive termination or closure of a user's account with respect to candidate introductions and transactions originating before termination.",
    ],
  },
  {
    id: "fees",
    number: "7",
    title: "Fees and Payment Obligations",
    blocks: [
      "Companies and Recruiters agree to pay all fees, commissions, subscription charges, transaction fees, recruiting fees, or other amounts that are disclosed and accepted in connection with their use of Head-Hunters.com.",
      "Before participating in a recruiting engagement, users are responsible for reviewing the applicable fee structure.",
      "By posting or accepting an opportunity, submitting a candidate, hiring a candidate, authorizing a transaction, purchasing a subscription, or otherwise participating in a transaction for which fees are disclosed, the user agrees to the applicable fees and payment terms.",
      "Users authorize Head-Hunters.com and its payment-processing providers to process applicable charges using the payment method provided by the user.",
      "Users may not use chargebacks, payment disputes, off-platform payments, or other payment mechanisms in bad faith to avoid legitimate fees owed under these Terms.",
      "Head-Hunters.com may withhold amounts otherwise payable, suspend accounts, restrict Platform access, or pursue collection of unpaid amounts where permitted by applicable law.",
      "Any applicable taxes arising from a user's activities are the responsibility of the party legally obligated to pay them.",
    ],
  },
  {
    id: "placement-fees",
    number: "8",
    title: "Placement Fees",
    blocks: [
      "The recruiting fee associated with an opportunity will be disclosed through the Platform or otherwise agreed upon before a qualifying placement.",
      "Companies are responsible for promptly and accurately reporting candidate hires and providing information reasonably necessary to calculate and process applicable fees.",
      "Recruiters are responsible for accurately reporting information relevant to their placement and payment.",
      "A user's obligation to pay an earned fee is not eliminated merely because communications, interviews, negotiations, onboarding, or other activities occur outside Head-Hunters.com after the initial Platform introduction.",
    ],
  },
  {
    id: "guarantee",
    number: "9",
    title: "30-Day Placement Guarantee",
    blocks: [
      "Certain qualifying placements may be covered by a **30-day guarantee**, subject to the specific conditions displayed by Head-Hunters.com for the applicable transaction.",
      "Unless different terms are expressly provided for a particular placement, the guarantee period begins on the candidate's first day of employment and expires after thirty (30) calendar days.",
      "Any request under the guarantee must comply with the applicable guarantee requirements and must be submitted within the required period.",
      {
        strong:
          "After expiration of the applicable 30-day guarantee period, the placement is considered final and Head-Hunters.com has no obligation to provide a refund, credit, replacement candidate, reimbursement, or other compensation because the candidate subsequently resigns, is terminated, fails to perform, does not meet expectations, or otherwise does not remain employed.",
      },
      "Head-Hunters.com is not responsible for predicting or guaranteeing a candidate's future performance, conduct, attendance, productivity, compatibility, retention, honesty, or continued employment.",
    ],
  },
  {
    id: "no-candidate-guarantee",
    number: "10",
    title: "No Guarantee of Candidate Performance",
    blocks: [
      "Head-Hunters.com facilitates introductions between independent parties. We do not independently guarantee statements made by candidates, Recruiters, or Companies.",
      {
        strong:
          "Head-Hunters.com makes no representation, warranty, or guarantee regarding the quality, suitability, qualifications, performance, behavior, reliability, productivity, background, retention, or future conduct of any candidate.",
      },
      "Companies are solely responsible for deciding whether a candidate is suitable for employment.",
      "Except for any specific written guarantee expressly provided through the Platform, Companies assume the risks associated with their hiring decisions.",
      "To the fullest extent permitted by applicable law, Head-Hunters.com will not be responsible for losses, damages, costs, lost revenue, lost productivity, replacement costs, business interruption, or other consequences resulting from a candidate's actions, performance, resignation, termination, misconduct, failure to perform, or inability to satisfy the Company's expectations.",
    ],
  },
  {
    id: "no-placement-guarantee",
    number: "11",
    title: "No Guarantee of Placement or Results",
    blocks: [
      "Head-Hunters.com does not guarantee that:",
      {
        list: [
          "A Company will receive a particular number or quality of candidates;",
          "A Recruiter will successfully place a candidate;",
          "A candidate will accept an offer;",
          "A Company will complete a hire;",
          "A Recruiter will earn a particular amount;",
          "A job posting will produce specific results; or",
          "Use of the Platform will result in employment, placement, revenue, or other business outcomes.",
        ],
      },
    ],
  },
  {
    id: "independent-relationships",
    number: "12",
    title: "Independent Relationships",
    blocks: [
      "Recruiters are independent users of the Platform and are not employees or agents of Head-Hunters.com.",
      "Companies and Recruiters are responsible for their own conduct, representations, tax obligations, licensing requirements, insurance, legal compliance, and business activities.",
      "Nothing in these Terms creates an employment relationship, partnership, franchise, fiduciary relationship, agency, or joint venture between Head-Hunters.com and a Recruiter, Company, or candidate.",
    ],
  },
  {
    id: "communications",
    number: "13",
    title: "User Communications and Dealings",
    blocks: [
      "Users are responsible for their communications and interactions with other Platform users.",
      "Head-Hunters.com may provide communication, recordkeeping, payment, reporting, and dispute-management tools but is not a party to the underlying employment relationship between a Company and a candidate.",
      "Users should exercise reasonable judgment and conduct appropriate due diligence before entering into any employment, recruiting, or business relationship.",
    ],
  },
  {
    id: "confidentiality",
    number: "14",
    title: "Confidentiality and Candidate Information",
    blocks: [
      "Candidate resumes, contact information, compensation information, employment history, and other candidate data obtained through Head-Hunters.com may only be used for legitimate recruiting and hiring purposes.",
      "Companies may not sell, publish, distribute, or use candidate information for unrelated commercial purposes.",
      "Users must handle personal information in accordance with applicable privacy and data protection laws.",
    ],
  },
  {
    id: "prohibited-conduct",
    number: "15",
    title: "Prohibited Conduct",
    blocks: [
      "Users may not use Head-Hunters.com to commit fraud; provide knowingly false information; unlawfully discriminate; harass other users; scrape or harvest Platform data without authorization; introduce malware or malicious code; interfere with Platform operations; obtain unauthorized access to another user's account; misuse confidential candidate information; manipulate Platform transactions; circumvent fees; or otherwise use the Platform for unlawful or fraudulent purposes.",
      "Head-Hunters.com may investigate suspected violations and restrict, suspend, or terminate accounts when reasonably necessary to protect the Platform, its users, or its legitimate business interests.",
    ],
  },
  {
    id: "disputes",
    number: "16",
    title: "Disputes Between Users",
    blocks: [
      "Companies, Recruiters, and candidates are responsible for resolving disputes arising from their direct relationships.",
      "Head-Hunters.com may, but is not obligated to, assist with disputes involving candidate ownership, placement fees, payment obligations, guarantees, or Platform transactions.",
      "Users agree to reasonably cooperate with investigations into suspected fraud, fee avoidance, candidate ownership disputes, payment disputes, or violations of these Terms and to provide reasonably requested documentation.",
      "Any determination made by Head-Hunters.com regarding internal Platform privileges, account access, or Platform records does not prevent either party from exercising legal rights otherwise available to it.",
    ],
  },
  {
    id: "availability",
    number: "17",
    title: "Platform Availability",
    blocks: [
      "Head-Hunters.com may modify, suspend, discontinue, restrict, or replace any feature or portion of the Platform at any time.",
      "We do not guarantee uninterrupted, error-free, or continuously available access to the Platform.",
      "Scheduled maintenance, technical failures, third-party services, internet outages, security events, or other circumstances may temporarily affect availability.",
    ],
  },
  {
    id: "third-party",
    number: "18",
    title: "Third-Party Services",
    blocks: [
      "Head-Hunters.com may use third-party providers for payment processing, identity verification, communications, hosting, analytics, background services, or other functionality.",
      "Your use of certain third-party services may also be subject to the terms and privacy policies of those providers.",
      "Head-Hunters.com is not responsible for acts or omissions of independent third-party providers except to the extent required by applicable law.",
    ],
  },
  {
    id: "liability",
    number: "19",
    title: "Limitation of Liability",
    blocks: [
      {
        strong:
          "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HEAD-HUNTERS.COM AND ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATES, CONTRACTORS, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO USE OF THE PLATFORM, A RECRUITING TRANSACTION, A CANDIDATE, A COMPANY, OR A RECRUITER.",
      },
      "This includes, without limitation, losses arising from candidate performance or misconduct, employee turnover, hiring decisions, inaccurate user information, lost profits, lost business opportunities, lost productivity, reputational harm, or interactions between Platform users.",
      {
        strong:
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, HEAD-HUNTERS.COM'S AGGREGATE LIABILITY ARISING FROM OR RELATING TO THE PLATFORM OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT OF PLATFORM FEES PAID DIRECTLY TO HEAD-HUNTERS.COM BY THE USER DURING THE SIX MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM OR (B) $100.",
      },
      "Some jurisdictions do not permit certain exclusions or limitations of liability, so portions of this Section may not apply where prohibited by law.",
    ],
  },
  {
    id: "warranties",
    number: "20",
    title: "Disclaimer of Warranties",
    blocks: [
      "THE PLATFORM IS PROVIDED ON AN **“AS IS” AND “AS AVAILABLE”** BASIS TO THE MAXIMUM EXTENT PERMITTED BY LAW.",
      "Head-Hunters.com disclaims warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, reliability, and suitability.",
      "Head-Hunters.com does not warrant that information supplied by Companies, Recruiters, or candidates is accurate, complete, or current.",
      "Nothing in these Terms excludes warranties or rights that cannot legally be excluded.",
    ],
  },
  {
    id: "indemnification",
    number: "21",
    title: "Indemnification",
    blocks: [
      "To the extent permitted by applicable law, users agree to defend, indemnify, and hold harmless Head-Hunters.com and its owners, affiliates, officers, directors, employees, agents, and contractors from claims, liabilities, losses, damages, judgments, penalties, costs, and reasonable attorneys' fees arising from or related to:",
      {
        list: [
          "The user's violation of these Terms;",
          "The user's violation of applicable law;",
          "False, inaccurate, fraudulent, or misleading information provided by the user;",
          "The user's hiring, recruiting, employment, or business activities;",
          "The user's misuse of candidate or Company information;",
          "The user's infringement of another person's rights; or",
          "The user's circumvention or attempted circumvention of Platform fees.",
        ],
      },
    ],
  },
  {
    id: "suspension",
    number: "22",
    title: "Account Suspension and Termination",
    blocks: [
      "Head-Hunters.com may suspend, restrict, or terminate an account for violations of these Terms, fraud, abusive conduct, fee circumvention, nonpayment, security concerns, unlawful activity, or conduct that creates material risk for the Platform or its users.",
      "Termination does not eliminate obligations incurred before termination.",
      "Payment obligations, confidentiality obligations, candidate-introduction protections, non-circumvention obligations, limitations of liability, indemnification obligations, and other provisions that by their nature should survive termination will remain effective after an account is closed.",
    ],
  },
  {
    id: "changes",
    number: "23",
    title: "Changes to These Terms",
    blocks: [
      {
        strong:
          "Head-Hunters.com reserves the right to modify, amend, replace, or update these Terms at any time.",
      },
      "When changes are made, we may update the “Last Updated” date and, when required by applicable law, provide additional notice.",
      {
        strong:
          "Your continued access to or use of Head-Hunters.com after revised Terms become effective constitutes your acceptance of the revised Terms, to the extent permitted by applicable law.",
      },
      "If you do not agree with updated Terms, you must discontinue use of the Platform.",
      "Material changes will apply prospectively to the extent required by applicable law.",
    ],
  },
  {
    id: "electronic",
    number: "24",
    title: "Electronic Communications and Agreement",
    blocks: [
      "By using Head-Hunters.com, you consent to receive agreements, disclosures, notices, transaction information, and other communications electronically where permitted by law.",
      "Clicking buttons such as “I Agree”, “Accept”, “Post Job”, “Submit Candidate”, “Accept Job”, “Confirm Hire”, “Pay”, or similar affirmative actions may constitute your electronic acceptance of the applicable terms, fees, or transaction.",
      "Electronic records maintained by Head-Hunters.com may be used as evidence of Platform activity and transactions to the extent permitted by applicable law.",
    ],
  },
  {
    id: "governing-law",
    number: "25",
    title: "Governing Law",
    blocks: [
      "These Terms and disputes arising from them will be governed by the laws of the **State of Florida**, without regard to its conflict-of-law principles, except where applicable law requires otherwise.",
      {
        strong:
          "[Attorney Review: Insert appropriate venue, jurisdiction, arbitration, class-action waiver, and dispute-resolution provisions before publication.]",
      },
    ],
  },
  {
    id: "severability",
    number: "26",
    title: "Severability",
    blocks: [
      "If any provision of these Terms is determined to be invalid, illegal, or unenforceable, that provision will be enforced to the maximum extent legally permissible, and the remaining provisions will remain in full force and effect.",
    ],
  },
  {
    id: "no-waiver",
    number: "27",
    title: "No Waiver",
    blocks: [
      "Failure by Head-Hunters.com to enforce a provision of these Terms does not constitute a waiver of that provision or our right to enforce it later.",
    ],
  },
  {
    id: "entire-agreement",
    number: "28",
    title: "Entire Agreement",
    blocks: [
      "These Terms, together with the Head-Hunters.com Privacy Policy, applicable fee terms, guarantee terms, and any additional terms expressly incorporated into a transaction, constitute the agreement between the user and Head-Hunters.com concerning use of the Platform.",
      "If transaction-specific terms expressly conflict with these Terms, the transaction-specific terms will control with respect to that transaction.",
    ],
  },
  {
    id: "contact",
    number: "29",
    title: "Contact",
    blocks: [
      "Questions regarding these Terms of Service may be directed to:",
      // One block, two lines: the source reads this as an address, not as two
      // paragraphs a blank line apart.
      "**Head-Hunters.com**\nEmail: info@head-hunters.com",
      {
        strong:
          "BY CREATING AN ACCOUNT OR USING HEAD-HUNTERS.COM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO THESE TERMS OF SERVICE.",
      },
    ],
  },
];
