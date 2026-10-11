// All site content lives here: text, images and links.
// For a work item, add `img: 'assets/xxx.jpg'` to show a real image instead of the gradient.

export const profile = {
  nameEn: 'RUIZE NIE',
  role: 'Senior iOS / Mobile Engineer',
  // No email on purpose: visitors reach out via LinkedIn or the contact form.
  linkedin: 'https://www.linkedin.com/in/ruizenie',
  avatarStyle: 'photo', // 'cartoon' (drawn in textures.js) or 'photo' (uses `avatar` below)
  avatar: 'assets/avatar.jpg',
  fields: [
    ['NAME', 'Ruize Nie'],
    ['ROLE', 'Senior iOS Engineer'],
    ['COMPANY', 'IBM Canada'],
    ['EDUCATION', 'Dalhousie University'],
    ['DEGREE', 'Master of Computer Science'],
    ['LINKEDIN', 'in/ruizenie', 'https://www.linkedin.com/in/ruizenie'],
  ],
  bio: 'Senior iOS engineer with 5+ years shipping consumer apps for travel and banking — Air Canada’s Day-of-Travel experiences and PNC’s secure sign-in. I build the mobile moments that have to work the first time.',
  tags: ['Swift & SwiftUI', 'Mobile Architecture', 'Secure Auth', 'AI-Assisted Dev'],
};

// `stat` is the one number on the card front; the first `core` stack items are highlighted as daily drivers.
export const skills = [
  {
    no: '01', tag: 'NATIVE iOS', title: 'iOS Engineering',
    desc: 'Consumer iOS apps used by millions: boarding passes, travel timelines and biometric sign-in.',
    stat: ['Millions', 'of travellers served'],
    stack: ['Swift', 'SwiftUI', 'UIKit', 'Combine', 'PassKit', 'Apple Wallet', 'Face ID / Touch ID', 'REST', 'GraphQL', 'Push'],
    core: 3,
    proof: 'Air Canada · PNC · IBM',
    color: '#d4ff3a', ink: '#141414',
  },
  {
    no: '02', tag: 'BUILT TO LAST', title: 'Architecture',
    desc: 'Modular, testable mobile architecture that cut Air Canada’s travel-timeline time-to-content by 20%.',
    stat: ['−20%', 'time-to-content'],
    stack: ['MVVM', 'Dependency Injection', 'Modular design', 'Unit tests', 'UI tests', 'TDD', 'CI/CD', 'Instruments', 'Monitoring'],
    core: 3,
    proof: 'Air Canada · Day of Travel',
    color: '#ffffff', ink: '#141414',
  },
  {
    no: '03', tag: 'CROSS-PLATFORM', title: 'Flutter & Firebase',
    desc: 'One Flutter codebase for iOS and web, backed by Firestore, Cloud Functions and push notifications.',
    stat: ['2', 'platforms, one codebase'],
    stack: ['Flutter', 'Dart', 'Provider', 'GetX', 'Firestore', 'Security Rules', 'Cloud Functions', 'Node.js', 'FCM'],
    core: 2,
    proof: 'Marine Thinking',
    color: '#ff9f43', ink: '#141414',
  },
  {
    no: '04', tag: 'AI-ASSISTED DEV', title: 'AI Workflow',
    desc: 'AI coding agents in day-to-day delivery to prototype, refactor and write tests faster, with every change reviewed like any other code.',
    stat: ['3', 'AI tools in my workflow'],
    stack: ['Claude Code', 'Cursor', 'GitHub Copilot', 'Prompting', 'Refactoring', 'Test generation', 'Code review'],
    core: 3,
    proof: 'IBM Consulting',
    color: '#c9a7ff', ink: '#141414',
  },
  {
    no: '05', tag: 'LEAD · MENTOR · TEACH', title: 'Leadership',
    desc: 'Mobile lead on Air Canada; taught Swift and Flutter to 1,000+ learners and 13K YouTube subscribers.',
    stat: ['13.1K', 'YouTube subscribers'],
    stack: ['Technical discovery', 'Design reviews', 'Code reviews', 'Mentoring', 'Udemy', 'imooc', 'YouTube', 'Curriculum design', 'Video production'],
    core: 3,
    proof: '1,000+ learners · 850 on Udemy',
    color: '#2840e8', ink: '#ffffff',
  },
];

// Each category opens its own page layout (see src/workpage.js):
//   scatter  — prints tossed on a table (apps)        magazine — giant word with a turning page (courses)
//   player   — channel + video player (youtube)       wall     — curved wall of tiles (projects)
export const workCategories = [
  {
    id: 'apps', en: 'APPS', sub: 'Shipped iOS · used by millions', short: 'APPS', color: '#d4ff3a', ink: '#2840e8',
    layout: 'scatter',
    note: 'Public App Store screens of apps I built features for.',
    items: [
      { img: 'assets/aircanada-app-8.jpg', title: 'Travel Timeline', sub: 'Air Canada · the Day-of-Travel journey I owned' },
      { img: 'assets/aircanada-app-5.jpg', title: 'Mobile Boarding Pass', sub: 'Air Canada · PassKit & Apple Wallet' },
      { img: 'assets/pnc-app-5.jpg', title: 'Security & Sign-in', sub: 'PNC Mobile · Face ID / Touch ID, OTP & recovery' },
      { img: 'assets/aircanada-app-3.jpg', title: 'Flight Status', sub: 'Air Canada app' },
      { img: 'assets/pnc-app-1.jpg', title: 'Accounts Home', sub: 'PNC Mobile Banking' },
      { img: 'assets/aircanada-app-7.jpg', title: 'Live Activities', sub: 'Air Canada app' },
    ],
  },
  {
    id: 'courses', en: 'COURSES', sub: 'Teaching mobile development', short: 'COURSES', color: '#2840e8', ink: '#d4ff3a',
    layout: 'magazine',
    items: [
      {
        platform: 'imooc', title: 'Swift & SwiftUI', kicker: 'iOS course', years: '2024 – 2025', color: '#ff5fa2',
        stats: [['20h', 'of video'], ['19', 'modules'], ['200+', 'learners']],
        points: ['Swift fundamentals and a first Todo app', 'SwiftUI state, data flow, MVC / MVVM', 'Capstone: a social-matching app with photos, matching and chat', 'Exercises and interview prep'],
      },
      {
        platform: 'udemy', title: 'Dart, Flutter & GetX', kicker: 'Cross-platform course', years: '2022 – 2023', color: '#a435f0',
        stats: [['26h', 'of video'], ['850', 'learners'], ['4.2★', '100+ ratings']],
        points: ['Dart from zero', 'Flutter widgets, layout and navigation', 'State management with GetX', 'Sample apps built step by step'],
      },
    ],
  },
  {
    id: 'youtube', en: 'YOUTUBE', sub: 'Fullstack School', short: 'YOUTUBE', color: '#151515', ink: '#ff4d4d',
    layout: 'player',
    channel: {
      name: 'Fullstack School', url: 'https://www.youtube.com/@fullstackschool7177', years: '2021 – 2022',
      stats: [['13.1K', 'subscribers'], ['90', 'videos'], ['86K', 'views on the top video']],
    },
    // YouTube video ids, most watched first: shown as cover strips, each cover links to its video
    items: [
      'CBiXxOQSK5o', 'L6bxpjsaNfU', '4q_inOhnos8', 'vIIBp6xJJeA', 'LfabDPFhegc', 'UqZWfAWoeGQ',
      '7RnYcmmg2-c', 'ZQCBcqOu9Jw', 'YtiftyEohes', 'C0OmRRnRnjE', '-0efgUGogYA', 'oPrkIzFMjDU',
      'w-Zwz1DuePo', 't_i5_QHalvk', '-Fl-bRsD7bk', '0lPVZz14fqk', 'cTXab0meOKY', 'OwMnCaZJyP0',
      'Z5O9jVtafL8', 'mkIO5rQnzLI', 'C7KPX8sqlUU', '-ky5AnTV6Ig', 'i-ji06d9C9w', 'mPAKTZjQ3eY',
      '8D1UK3hq8U8', 'EdlkQltC9fI', 'e6EMROP2CDE', '5uFlee03cg8', '0OoUZIWMzaM', 'LSUO437nI7s',
      'RVDf53Jx0uY', '-kjaQXYGjtE', 'knsiDyrYU68', 'qEQ7KbLv9fo', '9fDleDYxRG8', 'sZNHAudkn5A',
    ],
  },
  {
    id: 'projects', en: 'PROJECTS', sub: 'Builds, awards & experiments', short: 'PROJECTS', color: '#f5f3ee', ink: '#141414',
    layout: 'orbit',
    // Tiles are gathered in workpage.js (site stills, code-drawn textures, app screens, notes);
    // each tile points at one of these projects for its detail card.
    projects: {
      locker: { title: '3D Locker Portfolio', sub: 'This site · Three.js & GSAP',
        body: 'Procedural Three.js models, GSAP camera moves and canvas-drawn textures: no 3D assets, everything in this locker is code, including most of the tiles in this sphere.' },
      apps: { title: 'Shipped iOS apps', sub: 'Air Canada · PNC · via IBM Consulting',
        body: 'Day-of-Travel journeys, mobile boarding passes and biometric sign-in, in apps used by millions. Public App Store screens.' },
      enterprise: { title: 'Enterprise Management', sub: 'Marine Thinking · iOS & Web',
        body: 'One Flutter codebase for iOS and the web, with Firestore secured by Security Rules and backend workflows moved into Node.js Cloud Functions with FCM push.' },
      flutter: { title: 'Flutter UI apps', sub: 'Built from scratch · Fullstack School',
        body: 'Fourteen Flutter apps built from scratch, step by step on camera: food delivery, task management, an online course app, e-commerce, chat, travel, house rent, a game store and more. The food delivery tutorial alone reached 86K views.' },
      hackathon: { title: 'Hackathon First Prize', sub: 'Bank & Insurance Hackathon · 2020',
        body: 'First place out of 14 teams at the 2020 Bank & Insurance Hackathon.' },
    },
    notes: [
      { project: 'hackathon', big: '1st', small: 'of 14 teams' },
      { project: 'hackathon', big: '2020', small: 'Bank & Insurance Hackathon' },
      { project: 'hackathon', big: '★', small: 'First prize' },
      { project: 'enterprise', big: '2→1', small: 'platforms → codebase' },
      { project: 'enterprise', big: 'Flutter', small: 'iOS & Web' },
      { project: 'enterprise', big: 'Firebase', small: 'Firestore · Functions · FCM' },
      { project: 'enterprise', logo: 'assets/marine-thinking-mark-white.png', small: 'Marine Thinking' },
      { project: 'locker', big: '0', small: '3D files used' },
      { project: 'locker', big: 'Three.js', small: 'procedural geometry' },
      { project: 'locker', big: 'GSAP', small: 'every camera move' },
      { project: 'apps', big: 'Swift', small: 'SwiftUI · UIKit' },
      { project: 'apps', big: '−20%', small: 'time-to-content' },
    ],
  },
];

// Work experience: each entry is a book on the top shelf (spine out). Clicking pulls it out and opens it.
export const experiences = [
  {
    id: 'marinethinking',
    company: 'Marine Thinking',
    via: 'Halifax, Nova Scotia · On-site',
    years: '2021',
    title: 'Mobile Developer',
    // blue cover with the logo's white mark; the original blue square logo on the pages
    book: { color: '#1758a8', accent: '#1758a8', logoSrc: 'assets/marine-thinking-logo.jpg', coverLogoSrc: 'assets/marine-thinking-mark-white.png', wordmark: true },
    roles: [
      ['Mobile Developer', 'Feb 2021 – Nov 2021'],
    ],
    facts: [
      ['PRODUCT', 'Enterprise management · iOS & Web'],
      ['TYPE', 'Permanent · Full-time'],
      ['STACK', 'Flutter · Firebase · Node.js'],
      ['FOCUS', 'Architecture · Data security'],
    ],
    highlights: [
      'Designed a modular Flutter architecture with Provider, GetX and dependency injection, shared across mobile and web.',
      'Implemented secure Firestore data workflows and Firebase Security Rules to control data access.',
      'Built Firebase Cloud Functions in Node.js to automate backend processes and end-to-end workflows.',
      'Delivered FCM push notifications and applied test-driven development to core business logic.',
    ],
    stack: 'Flutter · Dart · Provider · GetX · Firestore · Cloud Functions · FCM · Node.js · TDD',
    product: 'Straal app',
    feature: {
      title: 'Enterprise App',
      subtitle: 'Flutter · iOS & Web · Firebase',
      problem: 'A marine-tech team needed one product that worked on iOS and the web, kept company data secure, and automated the busywork behind it.',
      approach: 'Built a modular Flutter app shared across mobile and web, secured Firestore with Security Rules, and moved backend workflows into Node.js Cloud Functions with FCM push notifications.',
      metrics: [['2', 'platforms: iOS & Web'], ['1', 'shared Flutter codebase'], ['TDD', 'on core logic']],
    },
    // Straal is a Marine Thinking product, not one of my projects: shown for context only
    screensLabel: 'COMPANY PRODUCT',
    screensNote: 'Built by Marine Thinking — shown for context, not my project.',
    screens: [1, 2, 3, 4].map((n) => `assets/marine-app-${n}.jpg`),
    screensCredit: 'Screens: Straal by Marine Thinking (company product), App Store',
  },
  {
    id: 'ibm',
    company: 'IBM',
    via: 'IBM Consulting · Permanent · Hybrid',
    years: '2021 — 2026',
    title: 'Senior Mobile Engineer',
    // white cover with the blue IBM wordmark; `ink` is the cover/spine text colour
    book: { color: '#f4f4f4', ink: '#0f62fe', accent: '#0f62fe', logoSrc: 'assets/ibm-logo.svg', wordmark: true },
    roles: [
      ['Senior Mobile Engineer', 'Sep 2024 – Oct 2026'],
      ['Mobile Lead (iOS)', 'Sep 2022 – Aug 2024'],
      ['Junior iOS Developer', 'Dec 2021 – Aug 2022'],
    ],
    highlights: [
      'Grew from junior iOS contributor to mobile lead and senior engineer with end-to-end technical ownership.',
      'Led enterprise client engagements from discovery and solution design to release and production support.',
      'Turned business and security requirements into scalable mobile solutions with product, design, backend, security and QA.',
      'Raised quality through design and code reviews, mentoring, automated testing, CI/CD and production monitoring.',
    ],
    stack: 'Swift · SwiftUI · UIKit · Combine · CI/CD · Monitoring · AI-assisted development',
    product: 'IBM Consulting',
    feature: {
      title: 'Client Delivery',
      subtitle: 'Enterprise mobile · Travel & banking',
      problem: 'Enterprise clients need mobile teams that can take a feature from discovery to production — and keep it healthy for millions of users after launch.',
      approach: 'Led engagements end to end — technical discovery, solution design, implementation, testing, release and production support — while mentoring engineers and raising the bar with design reviews, CI/CD and monitoring.',
      metrics: [['~5 yrs', 'at IBM Consulting'], ['2', 'enterprise clients'], ['Lead', 'junior → mobile lead']],
      clients: ['aircanada', 'pnc'], // shown as client cards instead of screenshots
    },
  },  {
    id: 'aircanada',
    company: 'Air Canada',
    via: 'via IBM Canada · Contract',
    years: '2022 — 2026',
    title: 'Senior iOS Engineer',
    book: { color: '#141414', accent: '#ee3424', logoSrc: 'assets/aircanada-logo.png' },
    roles: [
      ['Senior iOS Engineer', 'Sep 2024 – Feb 2026'],
      ['Mobile Lead (iOS)', 'Sep 2022 – Aug 2024'],
      ['Junior iOS Developer', 'Jan 2022 – Aug 2022'],
    ],
    highlights: [
      'Owned the Day-of-Travel iOS domain for an app used by millions of travellers.',
      'Cut Travel-timeline time-to-content by 20% and improved crash-free sessions.',
      'Shipped mobile boarding passes with PassKit and Apple Wallet.',
      'Built baggage tracking with notification-driven status updates.',
      'Mentored engineers and led design reviews in the internal iOS guild.',
    ],
    stack: 'Swift · SwiftUI · UIKit · Combine · REST / GraphQL · PassKit · Push',
    product: 'Air Canada + Aeroplan app',
    // second spread: one featured project, told as problem → approach → impact
    feature: {
      title: 'Day-of-Travel',
      subtitle: 'Travel tab · Boarding pass · Baggage',
      problem: 'Travellers need the right information at the right moment — check-in, gate changes, boarding, bags — on a journey that changes in real time.',
      approach: 'Designed an event-driven journey timeline that pulls flight milestones and live status into one place, and rebuilt the Travel tab, boarding-pass and baggage modules as modular, testable Swift / SwiftUI components.',
      metrics: [['20%', 'faster time-to-content'], ['Millions', 'of travellers served'], ['3', 'core flows shipped']],
      screens: [7, 4], // indexes into `screens`: Journey timeline + boarding pass
    },
    // public App Store screenshots of the product (third spread)
    screens: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `assets/aircanada-app-${n}.jpg`),
    screensCredit: 'Screens: Air Canada + Aeroplan app, App Store',
  },
  {
    id: 'pnc',
    company: 'PNC',
    via: 'via IBM Canada · Contract · Remote',
    years: '2026',
    title: 'Senior iOS Engineer',
    book: { color: '#0b3a66', accent: '#f58025', logoSrc: 'assets/pnc-mark.svg' },
    roles: [
      ['Senior iOS Engineer', 'Feb 2026 – Jun 2026'],
    ],
    // extra key/value rows under the roles (fills the page when there is only one role)
    facts: [
      ['CLIENT', 'PNC Financial Services'],
      ['THROUGH', 'IBM Consulting'],
      ['FOCUS', 'Authentication & account security'],
      ['TEAMS', 'Security · Backend · Design · QA'],
    ],
    highlights: [
      'Implemented Face ID / Touch ID sign-in with LocalAuthentication — eligibility, opt-in, fallback and error states.',
      'Built Security Profile flows for password changes, credential validation and session-aware navigation.',
      'Delivered OTP verification: code entry, resend, expiry, invalid codes and recovery.',
      'Integrated auth flows with backend APIs alongside security, backend, design and QA teams.',
      'Raised release confidence with unit / UI tests, code reviews, CI and device coverage.',
    ],
    stack: 'Swift · LocalAuthentication · Face ID / Touch ID · REST APIs · Unit & UI tests · CI',
    product: 'PNC Mobile Banking app',
    feature: {
      title: 'Secure Sign-in',
      subtitle: 'Biometrics · OTP · Account recovery',
      problem: 'Banking customers expect sign-in to be instant and safe — and when something goes wrong, like a new device, a forgotten password or an expired code, recovery has to be just as secure.',
      approach: 'Built biometric sign-in on LocalAuthentication with clear opt-in and fallback paths, plus OTP verification and Security Profile flows that cover every edge case: resend, expiry, invalid codes and session-aware navigation.',
      metrics: [['4', 'auth flows shipped'], ['Face ID', '& Touch ID sign-in'], ['OTP', 'verify & recover']],
      screens: [4, 0], // Profile & Settings (security) + accounts home
    },
    screens: [1, 2, 3, 4, 5, 6].map((n) => `assets/pnc-app-${n}.jpg`),
    screensCredit: 'Screens: PNC Mobile Banking app, App Store',
  },
  {
    id: 'teaching',
    company: 'Teaching',
    via: 'imooc · Udemy · YouTube · Self-employed',
    years: '2021 — 2025',
    title: 'Instructor & Creator',
    // indigo cover with a drawn graduation-cap mark (no single company logo)
    book: { color: '#2b2a5e', accent: '#e0a800', logo: 'cap' },
    roles: [
      ['iOS Instructor · imooc', 'Mar 2024 – Feb 2025'],
      ['Mobile Instructor · Udemy', 'Feb 2022 – Jan 2023'],
      ['Content Creator · YouTube', 'Jun 2021 – May 2022'],
    ],
    highlights: [
      'Built and taught a 20-hour Swift & SwiftUI course on imooc for 200+ learners, ending in a production-style social app.',
      'Created a 26-hour Dart, Flutter & GetX course on Udemy: 850 learners, 4.2 / 5 from 100+ ratings.',
      'Grew the Fullstack School YouTube channel to 13.1K subscribers with 90 videos; the top Flutter tutorial reached 86K views.',
      'Owned every course end to end: curriculum, sample apps, recording, editing, publishing and learner support.',
    ],
    stack: 'Swift · SwiftUI · MVVM · Dart · Flutter · GetX · Curriculum design · Video production',
    product: 'Courses & tutorials',
    feature: {
      title: 'Swift Course',
      subtitle: 'imooc · 20 hours · 19 modules',
      problem: 'Beginners can learn Swift syntax anywhere, but few courses take them all the way to a real, production-style app.',
      approach: 'Designed a 19-module path from Swift fundamentals and a Todo app to SwiftUI state, data flow and MVC / MVVM, then built a full social-matching app with photos, matching and chat, plus exercises and interview prep.',
      metrics: [['1,000+', 'learners taught'], ['13.1K', 'YouTube subscribers'], ['4.2★', 'Udemy rating']],
      // platform cards (drawn marks), shown like the IBM client cards
      cards: [
        { platform: 'imooc', name: 'imooc', years: '2024 – 2025', line: 'Swift & SwiftUI · 200+ learners' },
        { platform: 'udemy', name: 'Udemy', years: '2022 – 2023', line: 'Flutter & GetX · 850 learners · 4.2★' },
        { platform: 'youtube', name: 'YouTube', years: '2021 – 2022', line: 'Fullstack School · 13.1K subscribers' },
      ],
    },
  },

];

// Every string drawn onto canvas textures, so the web fonts can be preloaded for exactly these glyphs.
export const fontText = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/·.@!&-',
  profile.role,
  ...profile.fields.flat(),
  ...workCategories.map((c) => c.sub),
  ...skills.flatMap((s) => [s.title, s.desc, s.tag, s.proof, ...s.stat, ...s.stack]),
  ...experiences.flatMap((e) => [e.company, e.via, e.title, ...e.roles.flat(), ...(e.facts ?? []).flat(), ...e.highlights, e.stack, ...Object.values(e.feature ?? {}).flat(2).filter((x) => typeof x !== 'object'), ...(e.feature?.cards ?? []).flatMap((c) => [c.name, c.years, c.line])]),
].join('');
