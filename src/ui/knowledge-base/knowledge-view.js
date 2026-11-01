/**
 * Knowledge Base View Component
 * Complies with Frontend Contract FE-001 Section 3.1
 */
import { KNOWLEDGE_ARTICLES } from './knowledge-data.js';

export function renderKnowledgeBase(container, state) {
  let activeArticleId = state.activeKbArticleId || KNOWLEDGE_ARTICLES[0].id;
  let searchQuery = '';

  function updateView() {
    const filteredArticles = KNOWLEDGE_ARTICLES.filter(art => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return art.title.toLowerCase().includes(q) ||
             art.description.toLowerCase().includes(q) ||
             art.category.toLowerCase().includes(q);
    });

    const activeArticle = KNOWLEDGE_ARTICLES.find(a => a.id === activeArticleId) || KNOWLEDGE_ARTICLES[0];

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Knowledge Base & Engineering Rules</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
          Architectural principles, mathematical formulas, RFC references, and deterministic rule definitions governing NetArchitect.
        </p>
      </div>

      <div class="kb-container">
        <!-- Sidebar -->
        <div class="kb-sidebar">
          <input 
            type="text" 
            id="kb-search-input" 
            placeholder="Search rules, RFCs, formulas..." 
            value="${searchQuery}"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: var(--radius-md); font-family: inherit; font-size: 0.82rem; margin-bottom: 1rem;"
          />

          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-faint); margin-bottom: 0.5rem; letter-spacing: 0.05em;">
            Engineering Articles (${filteredArticles.length})
          </div>

          <div style="display: flex; flex-direction: column;">
            ${filteredArticles.map(art => `
              <div class="kb-article-item ${art.id === activeArticleId ? 'active' : ''}" data-id="${art.id}">
                <div style="font-weight: 600;">${art.title}</div>
                <div style="font-size: 0.72rem; opacity: 0.75; margin-top: 0.15rem;">${art.category}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Article Reader -->
        <div class="kb-reader">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <span class="badge badge-neutral">${activeArticle.category}</span>
            <span class="badge ${activeArticle.status === 'Implemented' ? 'badge-info' : 'badge-warning'}">
              ${activeArticle.status}
            </span>
          </div>

          <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main);">
            ${activeArticle.title}
          </h2>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
            ${activeArticle.description}
          </p>

          <div class="kb-article-body" style="font-size: 0.9rem; color: var(--text-main); line-height: 1.65;">
            ${formatMarkdown(activeArticle.content)}
          </div>

          <!-- Decision Rules & Standards Footer -->
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-subtle);">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; color: var(--text-muted);">
              Associated Decision Rule IDs
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;">
              ${(activeArticle.rules || []).map(r => `
                <span class="badge badge-neutral" style="font-family: var(--font-mono); font-size: 0.75rem;">${r}</span>
              `).join('')}
            </div>

            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; color: var(--text-muted);">
              Standards & RFC Citations
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${(activeArticle.standards || []).map(s => `
                <span class="badge badge-info" style="font-size: 0.75rem;">${s}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach search event
    const searchInput = container.querySelector('#kb-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        updateView();
        const nextInput = container.querySelector('#kb-search-input');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      });
    }

    // Attach article item clicks
    container.querySelectorAll('.kb-article-item').forEach(el => {
      el.addEventListener('click', () => {
        activeArticleId = el.getAttribute('data-id');
        state.activeKbArticleId = activeArticleId;
        updateView();
      });
    });
  }

  updateView();
}

/**
 * Lightweight markdown parser for headings, lists, bold, math blocks
 */
function formatMarkdown(text = '') {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.4rem;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem;">$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code style="background-color: #f1f5f9; padding: 0.15rem 0.35rem; border-radius: 3px; font-family: var(--font-mono); font-size: 0.82rem;">$1</code>');

  // Parse display math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    return `<div style="background-color: #f8fafc; border-left: 3px solid #000; padding: 0.75rem 1rem; margin: 1rem 0; font-family: var(--font-mono); font-size: 0.88rem; overflow-x: auto;">${formula.trim()}</div>`;
  });

  // Convert list items
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.3rem;">$1</li>');

  // Convert newlines to paragraphs where appropriate
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<li')) return p;
    return `<p style="margin-bottom: 0.75rem;">${p.trim()}</p>`;
  }).join('');

  return html;
}

