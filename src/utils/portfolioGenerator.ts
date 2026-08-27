import JSZip from 'jszip';
import { GeneratedPortfolioData, PortfolioThemeId } from '../types';

export interface PortfolioFilesBundle {
  'index.html': string;
  'style.css': string;
  'script.js': string;
  'README.md': string;
}

export function generatePortfolioFiles(data: GeneratedPortfolioData): PortfolioFilesBundle {
  const theme = data.theme || 'modern-minimal';
  const name = data.hero.name || 'Student Engineer';
  const tagline = data.hero.tagline || 'Software Engineer';
  const bio = data.hero.bio || '';
  const location = data.hero.location || '';
  const avatarUrl = data.hero.avatarUrl || '';
  const aboutSummary = data.about?.summary || '';
  const edu = data.about?.education;
  const careerAspirations = data.about?.careerAspirations || '';
  const skills = data.skills || [];
  const projects = data.featuredProjects || [];
  const achievements = data.achievements || [];
  const careerGoals = data.careerGoals || [];
  const links = data.socialLinks || {};

  // 1. INDEX.HTML
  const indexHtml = `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(name)} | ${escapeHtml(tagline)}</title>
  <meta name="description" content="${escapeHtml(bio.slice(0, 160))}" />
  <link rel="stylesheet" href="style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
</head>
<body>
  <!-- Header / Navigation -->
  <header class="site-header">
    <div class="container nav-container">
      <a href="#hero" class="brand-logo">
        <span class="logo-badge">${escapeHtml(name.charAt(0))}</span>
        <span class="logo-text">${escapeHtml(name)}</span>
      </a>
      <nav class="nav-links" id="navLinks">
        <a href="#about" class="nav-item">About</a>
        <a href="#skills" class="nav-item">Skills</a>
        <a href="#projects" class="nav-item">Projects</a>
        ${achievements.length > 0 ? '<a href="#achievements" class="nav-item">Achievements</a>' : ''}
        ${careerGoals.length > 0 ? '<a href="#goals" class="nav-item">Goals</a>' : ''}
        <a href="#contact" class="btn btn-sm btn-primary">Contact</a>
      </nav>
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <main>
    <!-- Hero Section -->
    <section class="hero-section" id="hero">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="status-pill">
            <span class="status-dot"></span>
            <span>Available for Opportunities</span>
          </div>
          <h1 class="hero-title">${escapeHtml(name)}</h1>
          <p class="hero-tagline">${escapeHtml(tagline)}</p>
          <p class="hero-bio">${escapeHtml(bio)}</p>
          ${
            location
              ? `<div class="hero-meta"><span class="icon-location">📍</span> ${escapeHtml(location)}</div>`
              : ''
          }
          <div class="hero-cta-group">
            <a href="#projects" class="btn btn-primary">View Featured Projects</a>
            <a href="#contact" class="btn btn-outline">Get In Touch</a>
          </div>
          ${
            data.hero.availableForRoles && data.hero.availableForRoles.length > 0
              ? `
          <div class="roles-pill-group">
            <span class="roles-label">Targeting:</span>
            ${data.hero.availableForRoles
              .map((r) => `<span class="role-chip">${escapeHtml(r)}</span>`)
              .join('')}
          </div>`
              : ''
          }
        </div>
        <div class="hero-visual">
          <div class="avatar-card">
            ${
              avatarUrl
                ? `<img src="${avatarUrl}" alt="${escapeHtml(name)}" class="avatar-img" />`
                : `<div class="avatar-placeholder">${escapeHtml(
                    name
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  )}</div>`
            }
            <div class="avatar-badge">
              <span class="badge-icon">⚡</span>
              <div class="badge-text">
                <strong>Verified Digital Twin</strong>
                <small>Recruiter-Optimized</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About & Education Section -->
    <section class="section about-section" id="about">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">About & Academic Foundation</h2>
          <p class="section-subtitle">Engineering mindset and problem-solving trajectory</p>
        </div>
        <div class="about-grid">
          <div class="about-card">
            <h3 class="card-heading">Professional Narrative</h3>
            <p class="about-text">${escapeHtml(aboutSummary)}</p>
            ${
              careerAspirations
                ? `<div class="aspirations-box">
                    <strong>Career Aspirations:</strong>
                    <p>${escapeHtml(careerAspirations)}</p>
                   </div>`
                : ''
            }
          </div>
          ${
            edu && edu.university
              ? `
          <div class="education-card">
            <h3 class="card-heading">Academic Background</h3>
            <div class="edu-item">
              <div class="edu-icon">🎓</div>
              <div class="edu-info">
                <h4>${escapeHtml(edu.university)}</h4>
                <p class="edu-degree">${escapeHtml(edu.degree || 'B.Tech')}${
                  edu.branch ? ` in ${escapeHtml(edu.branch)}` : ''
                }</p>
                <div class="edu-timeline">
                  ${edu.year ? `<span>Year: ${escapeHtml(edu.year)}</span>` : ''}
                  ${
                    edu.graduationYear
                      ? `<span>Expected Grad: ${escapeHtml(edu.graduationYear)}</span>`
                      : ''
                  }
                </div>
              </div>
            </div>
          </div>`
              : ''
          }
        </div>
      </div>
    </section>

    <!-- Technical Skills Section -->
    <section class="section skills-section" id="skills">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Technical Expertise</h2>
          <p class="section-subtitle">Core engineering competencies and technology domains</p>
        </div>
        <div class="skills-grid">
          ${skills
            .map(
              (group) => `
          <div class="skill-category-card">
            <h3 class="skill-category-title">${escapeHtml(group.category)}</h3>
            <div class="skill-chips">
              ${group.items
                .map((skill) => `<span class="skill-chip">${escapeHtml(skill)}</span>`)
                .join('')}
            </div>
          </div>`
            )
            .join('')}
        </div>
      </div>
    </section>

    <!-- Featured Projects Section -->
    <section class="section projects-section" id="projects">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Featured Projects</h2>
          <p class="section-subtitle">End-to-end applications, system architectures, and engineering prototypes</p>
        </div>
        <div class="projects-grid">
          ${projects
            .map(
              (proj) => `
          <article class="project-card">
            <div class="project-header">
              <span class="project-role">${escapeHtml(proj.role || 'Lead Engineer')}</span>
              <h3 class="project-title">${escapeHtml(proj.title)}</h3>
            </div>
            <p class="project-desc">${escapeHtml(proj.description)}</p>
            ${
              proj.highlights && proj.highlights.length > 0
                ? `
            <ul class="project-highlights">
              ${proj.highlights
                .map((h) => `<li>${escapeHtml(h)}</li>`)
                .join('')}
            </ul>`
                : ''
            }
            <div class="project-tech-stack">
              ${proj.techStack
                .map((tech) => `<span class="tech-tag">${escapeHtml(tech)}</span>`)
                .join('')}
            </div>
            <div class="project-links">
              ${
                proj.githubUrl
                  ? `<a href="${proj.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                      Source Code
                     </a>`
                  : ''
              }
              ${
                proj.liveDemoUrl
                  ? `<a href="${proj.liveDemoUrl}" target="_blank" rel="noopener noreferrer" class="project-btn project-btn-primary">
                      Live Preview ↗
                     </a>`
                  : ''
              }
            </div>
          </article>`
            )
            .join('')}
        </div>
      </div>
    </section>

    <!-- Achievements & Certifications -->
    ${
      achievements.length > 0
        ? `
    <section class="section achievements-section" id="achievements">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Achievements & Certifications</h2>
          <p class="section-subtitle">Verified hackathons, recognitions, and professional credentials</p>
        </div>
        <div class="achievements-grid">
          ${achievements
            .map(
              (ach) => `
          <div class="achievement-card">
            <div class="achievement-icon">🏆</div>
            <div class="achievement-body">
              <h3 class="achievement-title">${escapeHtml(ach.title)}</h3>
              <div class="achievement-meta">
                <span class="achievement-issuer">${escapeHtml(ach.organization)}</span>
                ${ach.date ? `<span class="achievement-date">${escapeHtml(ach.date)}</span>` : ''}
              </div>
              <p class="achievement-desc">${escapeHtml(ach.description)}</p>
            </div>
          </div>`
            )
            .join('')}
        </div>
      </div>
    </section>`
        : ''
    }

    <!-- Career Goals -->
    ${
      careerGoals.length > 0
        ? `
    <section class="section goals-section" id="goals">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Career Milestones & Trajectory</h2>
          <p class="section-subtitle">Strategic career targets and desired engineering domains</p>
        </div>
        <div class="goals-grid">
          ${careerGoals
            .map(
              (g) => `
          <div class="goal-card">
            <div class="goal-header">
              <span class="goal-badge">Target Role</span>
              <h3 class="goal-title">${escapeHtml(g.targetRole)}</h3>
            </div>
            ${g.timeline ? `<p class="goal-timeline">⏱ <strong>Timeline:</strong> ${escapeHtml(g.timeline)}</p>` : ''}
            ${
              g.targetCompanies && g.targetCompanies.length > 0
                ? `
            <div class="target-companies">
              <strong>Target Organizations:</strong>
              <div class="company-chips">
                ${g.targetCompanies.map((c) => `<span class="company-chip">${escapeHtml(c)}</span>`).join('')}
              </div>
            </div>`
                : ''
            }
          </div>`
            )
            .join('')}
        </div>
      </div>
    </section>`
        : ''
    }

    <!-- Contact Section -->
    <section class="section contact-section" id="contact">
      <div class="container">
        <div class="contact-card">
          <div class="contact-header">
            <h2 class="contact-title">Let's Connect & Collaborate</h2>
            <p class="contact-subtitle">
              Open for full-time engineering roles, high-impact research, and technical internships.
            </p>
          </div>
          <div class="contact-links-grid">
            ${
              links.email
                ? `<a href="mailto:${links.email}" class="contact-link-card">
                    <span class="contact-icon">✉️</span>
                    <div class="contact-text">
                      <strong>Email</strong>
                      <span>${escapeHtml(links.email)}</span>
                    </div>
                   </a>`
                : ''
            }
            ${
              links.githubUrl
                ? `<a href="${links.githubUrl}" target="_blank" rel="noopener noreferrer" class="contact-link-card">
                    <span class="contact-icon">🐙</span>
                    <div class="contact-text">
                      <strong>GitHub</strong>
                      <span>${escapeHtml(links.githubUrl.replace('https://github.com/', ''))}</span>
                    </div>
                   </a>`
                : ''
            }
            ${
              links.linkedinUrl
                ? `<a href="${links.linkedinUrl}" target="_blank" rel="noopener noreferrer" class="contact-link-card">
                    <span class="contact-icon">💼</span>
                    <div class="contact-text">
                      <strong>LinkedIn</strong>
                      <span>Connect on LinkedIn</span>
                    </div>
                   </a>`
                : ''
            }
            ${
              links.phone
                ? `<a href="tel:${links.phone}" class="contact-link-card">
                    <span class="contact-icon">📞</span>
                    <div class="contact-text">
                      <strong>Phone</strong>
                      <span>${escapeHtml(links.phone)}</span>
                    </div>
                   </a>`
                : ''
            }
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container footer-content">
      <p>© ${new Date().getFullYear()} ${escapeHtml(name)}. Generated with <a href="#" class="twin-link">Student Digital Twin Career OS</a>.</p>
      <div class="theme-indicator">Theme: <span>${escapeHtml(theme)}</span></div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;

  // 2. STYLE.CSS
  const styleCss = getThemeCss(theme);

  // 3. SCRIPT.JS
  const scriptJs = `// Student Digital Twin - Interactive Portfolio Script
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      menuToggle.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.classList.remove('active');
      });
    });
  }

  // 2. Smooth Scrolling with Offset
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  // 3. Scroll Reveal Animation for Cards
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.project-card, .skill-category-card, .achievement-card, .about-card, .education-card').forEach((el) => {
    el.classList.add('fade-in-on-scroll');
    observer.observe(el);
  });

  console.log('Portfolio initialized successfully.');
});
`;

  // 4. README.MD
  const readmeMd = `# ${name} — Executive Portfolio

This is a production-grade, lightweight static portfolio generated directly from your **Student Digital Twin Career OS**.

## 📦 Package Contents
This standalone website contains exactly four files:
- \`index.html\` — Semantic HTML structure containing your verified profile, skills, projects, and achievements.
- \`style.css\` — Modern responsive CSS with custom typography, clean dark/light tokens, and card styling.
- \`script.js\` — Lightweight vanilla JavaScript for smooth scrolling and responsive navigation.
- \`README.md\` — Step-by-step deployment instructions.

---

## 🚀 How to Deploy in Under 60 Seconds (Free on Vercel)

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Click **New Repository**.
3. Name it \`${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-portfolio\` and set it to **Public**.
4. Click **Create repository**.

### Step 2: Upload Your 4 Files
1. In your new repository page on GitHub, click **Upload files**.
2. Drag and drop all 4 files (\`index.html\`, \`style.css\`, \`script.js\`, \`README.md\`) into the box.
3. Click **Commit changes**.

### Step 3: Deploy with Vercel (Instant & Free)
1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New...** → **Project**.
3. Select your portfolio repository and click **Deploy**.
4. Within 15 seconds, Vercel will give you a live production URL (e.g. \`https://${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-portfolio.vercel.app\`).

---

## 🔗 Connect Back to Student Digital Twin
Once your portfolio is live:
1. Copy your new live portfolio URL.
2. Return to **Student Digital Twin** → **AI Portfolio**.
3. Select **"Already have a portfolio?"** and paste your URL.
4. Click **Save & Connect Portfolio**.

Now your recruiters, peers, and mentors can view your live portfolio directly from your Student Digital Twin dashboard!
`;

  return {
    'index.html': indexHtml,
    'style.css': styleCss,
    'script.js': scriptJs,
    'README.md': readmeMd,
  };
}

export async function createPortfolioZipBlob(files: PortfolioFilesBundle): Promise<Blob> {
  const zip = new JSZip();
  zip.file('index.html', files['index.html']);
  zip.file('style.css', files['style.css']);
  zip.file('script.js', files['script.js']);
  zip.file('README.md', files['README.md']);

  return await zip.generateAsync({ type: 'blob' });
}

export function generatePreviewHtmlDoc(files: PortfolioFilesBundle): string {
  // Inject style.css and script.js inline into index.html for a self-contained iframe preview
  const rawHtml = files['index.html'];
  const withStyle = rawHtml.replace(
    '<link rel="stylesheet" href="style.css" />',
    `<style>\n${files['style.css']}\n</style>`
  );
  const withScript = withStyle.replace(
    '<script src="script.js"></script>',
    `<script>\n${files['script.js']}\n</script>`
  );
  return withScript;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getThemeCss(theme: PortfolioThemeId): string {
  const themeVariables: Record<PortfolioThemeId, string> = {
    'modern-minimal': `
      --bg-primary: #0b0f19;
      --bg-secondary: #111827;
      --bg-card: #151d30;
      --bg-card-hover: #1c263e;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.18);
      --accent-light: #60a5fa;
      --border: #1e293b;
      --border-focus: #3b82f6;
    `,
    'cyber-dark': `
      --bg-primary: #05070e;
      --bg-secondary: #0a0d18;
      --bg-card: #0f1424;
      --bg-card-hover: #161e36;
      --text-primary: #f0fdf4;
      --text-secondary: #86efac;
      --text-muted: #4ade80;
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.22);
      --accent-light: #34d399;
      --border: #132e23;
      --border-focus: #10b981;
    `,
    'emerald-tech': `
      --bg-primary: #061118;
      --bg-secondary: #0a1b24;
      --bg-card: #0f2633;
      --bg-card-hover: #153344;
      --text-primary: #f0f9ff;
      --text-secondary: #7dd3fc;
      --text-muted: #38bdf8;
      --accent: #0284c7;
      --accent-glow: rgba(2, 132, 199, 0.2);
      --accent-light: #38bdf8;
      --border: #164e63;
      --border-focus: #0ea5e9;
    `,
    'editorial-clean': `
      --bg-primary: #09090b;
      --bg-secondary: #121215;
      --bg-card: #18181b;
      --bg-card-hover: #27272a;
      --text-primary: #fafafa;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --accent: #f59e0b;
      --accent-glow: rgba(245, 158, 11, 0.18);
      --accent-light: #fbbf24;
      --border: #27272a;
      --border-focus: #f59e0b;
    `,
  };

  return `/* Portfolio Theme: ${theme} */
:root {
  ${themeVariables[theme] || themeVariables['modern-minimal']}
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-full: 9999px;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header & Nav */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.1rem;
}

.logo-badge {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-family: var(--font-mono);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-item {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-item:hover {
  color: var(--accent-light);
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.menu-toggle span {
  display: block;
  width: 22px;
  height: 2px;
  background-color: var(--text-primary);
  transition: all 0.3s ease;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.85rem;
}

.btn-primary {
  background-color: var(--accent);
  color: #ffffff;
  box-shadow: 0 4px 14px var(--accent-glow);
}

.btn-primary:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border);
}

.btn-outline:hover {
  border-color: var(--accent);
  background-color: var(--bg-card);
}

/* Hero Section */
.hero-section {
  padding: 80px 0 60px;
  border-bottom: 1px solid var(--border);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 48px;
  align-items: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-card);
  border: 1px solid var(--border);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-light);
  margin-bottom: 20px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 10px #22c55e;
}

.hero-title {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 12px;
}

.hero-tagline {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-light);
  margin-bottom: 16px;
}

.hero-bio {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 24px;
}

.hero-meta {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.hero-cta-group {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.roles-pill-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.roles-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-chip {
  font-size: 0.8rem;
  padding: 4px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.avatar-card {
  position: relative;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.avatar-img {
  width: 220px;
  height: 220px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 2px solid var(--border);
}

.avatar-placeholder {
  width: 220px;
  height: 220px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent), #1e293b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: #ffffff;
}

.avatar-badge {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  width: 100%;
}

.avatar-badge strong {
  display: block;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.avatar-badge small {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Sections */
.section {
  padding: 80px 0;
  border-bottom: 1px solid var(--border);
}

.section-header {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 0.95rem;
  color: var(--text-muted);
}

/* About Grid */
.about-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
}

.about-card, .education-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.card-heading {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.about-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.aspirations-box {
  margin-top: 20px;
  padding: 16px;
  background: var(--bg-secondary);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.aspirations-box strong {
  display: block;
  font-size: 0.85rem;
  color: var(--accent-light);
  margin-bottom: 4px;
}

.aspirations-box p {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.edu-item {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.edu-icon {
  font-size: 2rem;
}

.edu-info h4 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.edu-degree {
  font-size: 0.92rem;
  color: var(--accent-light);
  font-weight: 600;
  margin-bottom: 6px;
}

.edu-timeline {
  display: flex;
  gap: 12px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* Skills Grid */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.skill-category-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 24px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.skill-category-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-focus);
}

.skill-category-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-light);
  margin-bottom: 14px;
}

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-chip {
  padding: 6px 12px;
  font-size: 0.82rem;
  font-family: var(--font-mono);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.project-card:hover {
  border-color: var(--accent);
  box-shadow: 0 10px 30px var(--accent-glow);
  transform: translateY(-3px);
}

.project-role {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-light);
  margin-bottom: 6px;
}

.project-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.project-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.project-highlights {
  list-style: none;
  margin-bottom: 16px;
}

.project-highlights li {
  font-size: 0.85rem;
  color: var(--text-muted);
  position: relative;
  padding-left: 16px;
  margin-bottom: 6px;
}

.project-highlights li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: var(--accent);
}

.project-tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 16px;
  margin-bottom: 20px;
}

.tech-tag {
  font-size: 0.75rem;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.project-links {
  display: flex;
  gap: 10px;
}

.project-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.project-btn:hover {
  border-color: var(--accent);
  color: var(--accent-light);
}

.project-btn-primary {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

.project-btn-primary:hover {
  filter: brightness(1.15);
  color: #ffffff;
}

/* Achievements */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.achievement-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 24px;
  display: flex;
  gap: 16px;
}

.achievement-icon {
  font-size: 1.8rem;
}

.achievement-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.achievement-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--accent-light);
  margin-bottom: 8px;
}

.achievement-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

/* Goals */
.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.goal-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 24px;
}

.goal-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-light);
}

.goal-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 4px 0 10px;
}

.goal-timeline {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.target-companies strong {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
}

.company-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.company-chip {
  padding: 3px 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--text-primary);
}

/* Contact Card */
.contact-card {
  background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 48px;
  text-align: center;
}

.contact-header {
  max-width: 600px;
  margin: 0 auto 36px;
}

.contact-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.contact-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.contact-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  text-align: left;
}

.contact-link-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.contact-link-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.contact-icon {
  font-size: 1.5rem;
}

.contact-text strong {
  display: block;
  font-size: 0.88rem;
}

.contact-text span {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
  word-break: break-all;
}

/* Footer */
.site-footer {
  padding: 32px 0;
  background: var(--bg-primary);
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.twin-link {
  color: var(--accent-light);
  text-decoration: none;
  font-weight: 600;
}

/* Scroll Animation Helper */
.fade-in-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .nav-links {
    position: fixed;
    top: 72px;
    left: 0;
    right: 0;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border);
    flex-direction: column;
    padding: 24px;
    gap: 16px;
    display: none;
  }

  .nav-links.open {
    display: flex;
  }

  .menu-toggle {
    display: flex;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .about-grid {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .contact-card {
    padding: 32px 20px;
  }
}
`;
}
