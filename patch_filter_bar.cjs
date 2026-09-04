const fs = require('fs');
let content = fs.readFileSync('pages/Home.tsx', 'utf8');

// The sort select might look ugly on mobile, let's wrap it beautifully
const oldFilterBlock = `                  {/* Filters & Sort Controls */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                    <button
                      id="open-filters-modal-btn"
                      type="button"
                      onClick={() => setShowFilterModal(true)}
                      className={\`h-9 px-3 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer font-bold text-xs \${
                        activeFiltersCount > 0
                          ? "bg-primary-lime text-accent-text border-primary-lime shadow-xs font-black"
                          : "bg-surface-card hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                      }\`}
                      title="Open detailed pitch filters"
                    >
                      <SlidersHorizontal size={13} />
                      <span>Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-accent-text text-primary-lime text-[10px] font-black flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 bg-surface-card border border-border-subtle rounded-xl px-2.5 h-9">
                      <span className="text-xs font-bold text-text-tertiary">Sort:</span>
                      <select
                        id="pitch-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
                      >
                        <option value="recommended">⭐ Recommended</option>
                        <option value="rating">Top Rated</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                      </select>
                    </div>
                  </div>`;

const newFilterBlock = `                  {/* Filters & Sort Controls */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <button
                      id="open-filters-modal-btn"
                      type="button"
                      onClick={() => setShowFilterModal(true)}
                      className={\`h-9 px-4 rounded-full border flex items-center gap-2 shrink-0 transition-all cursor-pointer font-bold text-[11px] uppercase tracking-wide \${
                        activeFiltersCount > 0
                          ? "bg-primary-lime text-white border-primary-lime shadow-md shadow-primary-lime/20"
                          : "bg-surface-card hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                      }\`}
                    >
                      <SlidersHorizontal size={14} />
                      <span>Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-white text-primary-lime text-[10px] font-black flex items-center justify-center ml-1">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 bg-surface-card hover:bg-surface-raised transition-colors border border-border-subtle rounded-full px-4 h-9 shrink-0 relative">
                      <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide">Sort</span>
                      <div className="w-px h-3 bg-border-subtle mx-1"></div>
                      <select
                        id="pitch-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-[11px] font-bold text-text-primary focus:outline-none cursor-pointer appearance-none pr-4"
                      >
                        <option value="recommended">Recommended</option>
                        <option value="rating">Top Rated</option>
                        <option value="price-asc">Price: Lowest</option>
                        <option value="price-desc">Price: Highest</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>`;

if (content.includes('id="pitch-sort-select"')) {
    content = content.replace(oldFilterBlock, newFilterBlock);
    fs.writeFileSync('pages/Home.tsx', content);
    console.log('Filter bar updated');
} else {
    console.log('Could not find old filter block');
}
