// Résumé content per discovery zone. Rendered as trusted local HTML.
// `icon` refers to the Rally Roadbook sprite (src/icons.js); `ui` is the
// zone's harmonized paper-palette accent used by panel stamps and tags
// (the brighter `color` stays reserved for the 3D beacon in the world).

import { icon } from './icons.js';

export const CV_ZONES = [
  {
    id: 'about',
    title: 'About Me',
    short: 'About',
    icon: 'id-card',
    color: '#f7a325',
    ui: '#d99a34',
    hint: 'Grass plains — right where you start',
    html: `
      <div class="panel-stamp" style="--zone-c:#d99a34">${icon('id-card')}</div>
      <div class="panel-tag">BIODATA</div>
      <h2>Ihsan Fajari</h2>
      <p class="meta" style="--zone-c:#d99a34">Associate Production Director · Bandung, Indonesia</p>
      <p>Associate Production Director with <b>6+ years</b> of end-to-end product and project
      delivery experience across game, enterprise tech, and health-tech.</p>
      <ul>
        <li>Proven track record managing <b>B2B enterprise clients</b> — including Astra Group and a Telkom Indonesia subsidiary — from presales and scoping through launch and post-delivery evaluation.</li>
        <li>Technical foundation in <b>Computer Science</b> with hands-on web development background, enabling deep collaboration with engineering teams.</li>
        <li>Active practitioner of <b>AI-augmented workflows</b> in production environments.</li>
      </ul>
      <hr/>
      <p>${icon('truck', 'icon icon-inline')} <b>Keep exploring!</b> Four more waypoints are hidden in the forest, the desert,
      the snowy peaks and the beach.</p>
    `,
  },
  {
    id: 'experience',
    title: 'Work Experience',
    short: 'Experience',
    icon: 'mountain',
    color: '#3ddc84',
    ui: '#4b7a55',
    hint: 'Deep in the western forest',
    html: `
      <div class="panel-stamp" style="--zone-c:#4b7a55">${icon('mountain')}</div>
      <div class="panel-tag">WORK EXPERIENCE</div>
      <h2>Work Experience</h2>

      <h3>Associate Production Director</h3>
      <p class="meta" style="--zone-c:#4b7a55">Agate Indonesia · Bandung · Early 2025 – Present</p>
      <ul>
        <li>Promoted from Project Manager to own delivery across Agate's full B2B enterprise portfolio — budget, timeline and quality across concurrent engagements at the division level, not one project at a time.</li>
        <li>Drive adoption of AI-augmented workflows across creative and development teams, cutting production iteration time.</li>
        <li>Set delivery standards and escalation processes at the division level; manage resourcing and workload balance across simultaneous projects.</li>
        <li>Built internal programs to protect team health and retention.</li>
        <li><b>Key delivery — Grab, Magical Airport Experience:</b> led a minigame capturing the chaos of pre-flight prep, produced through a full AI-augmented art, design and development pipeline — a showcase of the division's AI-adoption push.</li>
      </ul>

      <h3>Project Manager</h3>
      <p class="meta" style="--zone-c:#4b7a55">Agate Indonesia · Bandung · Jan 2021 – Early 2025</p>
      <ul>
        <li>Owned end-to-end client relationships from presales through delivery: solution scoping, proposal detailing, pricing strategy and timeline negotiation with enterprise stakeholders.</li>
        <li>Main point of contact for enterprise clients including Astra Group — translating business requirements into scoped deliverables and managing expectations through the project lifecycle.</li>
        <li>Delivered projects on agreed budget, timeline and quality; key deliveries include Astra Virtue, Venhall, the Lenovo Personality Quiz microsite and Health Heroes: Nutrihunt.</li>
      </ul>

      <h3>Founder &amp; Project Manager</h3>
      <p class="meta" style="--zone-c:#4b7a55">Kahfi Code · Bandung · Dec 2019 – Present</p>
      <ul>
        <li>Run an independent product &amp; software consultancy — own the full delivery lifecycle: discovery, scoping, work breakdown, timeline, budget and client acceptance.</li>
        <li>Primary bridge between client stakeholders and dev teams — business requirements → technical specs.</li>
        <li>Deliveries: Finnet CPMS Dashboard, ProtonMedika Teleconsultation, RKCTOYS company profile (2021) and an NSF employee-assurance system for Indofood CBP.</li>
      </ul>

      <h3>Web Developer</h3>
      <p class="meta" style="--zone-c:#4b7a55">PT. Arindo Pratama · Bandung · Aug 2019 – Aug 2020</p>
      <ul>
        <li>Built a grocery e-commerce platform affiliated with the West Java provincial government, plus a PPOB payment system (PLN token, BPJS, mobile credit).</li>
      </ul>

      <h3>Software Developer Intern</h3>
      <p class="meta" style="--zone-c:#4b7a55">PT. Finnet Indonesia · Jakarta · Jul – Aug 2018</p>
      <ul>
        <li>Developed an EMVCo-compliant QR Code payment feature; researched Flutter for cross-platform apps.</li>
      </ul>

      <h3>General Manager</h3>
      <p class="meta" style="--zone-c:#4b7a55">Unpar Radio Station · Bandung · Jun 2017 – May 2018</p>
      <ul>
        <li>Led station operations and a cross-functional team of student volunteers across production, broadcasting and editorial.</li>
      </ul>
    `,
  },
  {
    id: 'projects',
    title: 'Featured Projects',
    short: 'Projects',
    icon: 'dunes',
    color: '#ff7847',
    ui: '#c8492e',
    hint: 'Out east, among the dunes',
    html: `
      <div class="panel-stamp" style="--zone-c:#c8492e">${icon('dunes')}</div>
      <div class="panel-tag">FEATURED PROJECTS</div>
      <h2>Featured Projects</h2>

      <h3>Grab — Magical Airport Experience</h3>
      <p class="meta" style="--zone-c:#c8492e">AI-Augmented Minigame</p>
      <p>Minigame for <b>Grab</b> capturing the chaos of pre-flight preparation to spotlight the pain point and position
      Grab's product as the fix. Produced end-to-end through a full <b>AI-augmented pipeline</b> across art, design and
      development — one of the clearest showcases of the division's AI-adoption push.</p>

      <h3>Astra Virtue</h3>
      <p class="meta" style="--zone-c:#c8492e">Feb 2024 – Dec 2024 · Unity Metaverse</p>
      <p>Metaverse-based recruitment platform for <b>Astra Group</b> (Indonesia's largest conglomerate, 200+ subsidiaries).
      Led end-to-end redevelopment; two-way real-time communication between candidates and recruiters; grew from an annual
      job fair into permanent multi-event infrastructure.</p>

      <h3>Lenovo Personality Quiz</h3>
      <p class="meta" style="--zone-c:#c8492e">Interactive Microsite</p>
      <p>Standalone interactive microsite for <b>Lenovo</b> built around a personality quiz — video content, face tracking
      and voice recognition guide users through an immersive journey that lands on a personalized device recommendation.</p>

      <h3>Finnet CPMS Dashboard</h3>
      <p class="meta" style="--zone-c:#c8492e">Aug 2023 – Jan 2024 · Data Visualization</p>
      <p>Enterprise marketing-intelligence dashboard for <b>Finnet</b> (Telkom Indonesia subsidiary): 5 core modules,
      10 development phases in 6 months, role-based access control, phased delivery for early adoption.</p>

      <h3>Venhall — Virtual Exhibition Hall</h3>
      <p class="meta" style="--zone-c:#c8492e">Jan 2021 – Present · Metaverse</p>
      <p>Led evolution from a web virtual exhibition into a full Metaverse experience — customizable avatars, real-time
      chat &amp; calls, booth exploration, mini-games, in-event purchasing. Adopted by enterprise event organizers and PDGI.</p>

      <h3>ProtonMedika Teleconsultation</h3>
      <p class="meta" style="--zone-c:#c8492e">Health-tech</p>
      <p>Online fertility consultation platform: doctor booking, appointment management, e-learning modules and doctor profiles.</p>

      <h3>Health Heroes: Nutrihunt</h3>
      <p class="meta" style="--zone-c:#c8492e">EdTech Mobile</p>
      <p>Mobile app that lets students scan product barcodes for nutritional information — delivered on time, within scope.</p>
    `,
  },
  {
    id: 'skills',
    title: 'Skills',
    short: 'Skills',
    icon: 'peaks',
    color: '#6cc6ff',
    ui: '#3c7c88',
    hint: 'Climb the snowy peaks up north',
    html: `
      <div class="panel-stamp" style="--zone-c:#3c7c88">${icon('peaks')}</div>
      <div class="panel-tag">SKILLS</div>
      <h2>Skills</h2>

      <div class="skill-group">
        <b>Product &amp; Project Management</b>
        <div class="tags">
          <span>Jira</span><span>Notion</span><span>Trello</span><span>Ms. Project</span>
          <span>Agile / Scrum</span><span>Requirements Gathering</span><span>Stakeholder Management</span>
          <span>Roadmap Planning</span><span>Presales &amp; Proposal</span><span>Pricing &amp; Timeline Estimation</span>
          <span>UAT Facilitation</span>
        </div>
      </div>

      <div class="skill-group">
        <b>AI &amp; Productivity</b>
        <div class="tags">
          <span>Claude</span><span>GPT</span><span>Gemini</span><span>AI-augmented workflow design</span>
        </div>
      </div>

      <div class="skill-group">
        <b>Technical</b>
        <div class="tags">
          <span>JavaScript</span><span>HTML</span><span>CSS</span><span>PHP</span><span>Java</span>
          <span>MySQL</span><span>Laravel</span><span>CodeIgniter</span><span>Bootstrap</span>
        </div>
      </div>

      <div class="skill-group">
        <b>Communication &amp; Collaboration</b>
        <div class="tags">
          <span>Ms. Teams</span><span>Slack</span><span>Discord</span><span>Ms. Office</span>
          <span>English (Professional)</span><span>Indonesian (Native)</span><span>Sundanese (Native)</span>
        </div>
      </div>
    `,
  },
  {
    id: 'education',
    title: 'Education & Contact',
    short: 'Education',
    icon: 'palm',
    color: '#ffd166',
    ui: '#c98a2e',
    hint: 'On the southern beach, by the palms',
    html: `
      <div class="panel-stamp" style="--zone-c:#c98a2e">${icon('palm')}</div>
      <div class="panel-tag">EDUCATION &amp; CONTACT</div>
      <h2>Education &amp; Contact</h2>

      <h3>Bachelor of Computer Science</h3>
      <p class="meta" style="--zone-c:#c98a2e">Universitas Katolik Parahyangan (UNPAR) · Bandung · 2014 – 2019</p>

      <h3>Senior High School</h3>
      <p class="meta" style="--zone-c:#c98a2e">SMAN 2 Tasikmalaya · 2011 – 2014</p>

      <hr/>
      <h3>Get in touch</h3>
      <div data-contact-slot></div>
    `,
  },
];

// Direct contact details (email / phone / PDF résumé) are an end-game reward:
// they render into [data-contact-slot] only once every achievement is earned.
export const CONTACT_PUBLIC_HTML = `
  <div class="contact-links">
    <a href="https://www.linkedin.com/in/ihsanfajari" target="_blank" rel="noopener">${icon('briefcase')} LinkedIn / ihsanfajari</a>
    <a href="https://github.com/IhsanFajari14018" target="_blank" rel="noopener">${icon('code')} GitHub / IhsanFajari14018</a>
  </div>
`;

export const CONTACT_LOCKED_HTML = (unlocked, total) => `
  ${CONTACT_PUBLIC_HTML}
  <div class="contact-locked">
    <p>${icon('lock', 'icon icon-inline')} <b>Exclusive access.</b> My email, phone number and PDF résumé are reserved
    for true explorers — earn <b>all ${total} achievements</b> to unlock them
    (${unlocked}/${total} so far). Check the trophy menu and keep driving!</p>
  </div>
`;

export const CONTACT_UNLOCKED_HTML = `
  <div class="contact-links">
    <a class="primary" href="mailto:ihsan.fajari@gmail.com">${icon('mail')} ihsan.fajari@gmail.com</a>
    <a href="https://wa.me/6282240270827" target="_blank" rel="noopener">${icon('chat')} +62 822-4027-0827</a>
    <a href="https://www.linkedin.com/in/ihsanfajari" target="_blank" rel="noopener">${icon('briefcase')} LinkedIn / ihsanfajari</a>
    <a href="https://github.com/IhsanFajari14018" target="_blank" rel="noopener">${icon('code')} GitHub / IhsanFajari14018</a>
    <a href="/Resume-Ihsan-Fajari.pdf" download>${icon('download')} Download PDF résumé</a>
  </div>
  <p class="contact-reward">${icon('trophy', 'icon icon-inline')} You earned every achievement — this is the full-access pass. Let's talk!</p>
`;
