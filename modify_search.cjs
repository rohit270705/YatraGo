const fs = require('fs');
let content = fs.readFileSync('src/pages/SearchPage.jsx', 'utf8');

// Add isLoading state
if (!content.includes('const [isLoading, setIsLoading]')) {
  content = content.replace('const [hasSearched, setHasSearched] = useState(false);', 'const [hasSearched, setHasSearched] = useState(false);\n  const [isLoading, setIsLoading] = useState(false);');
}

// Update handleSearch to async
const oldHandleSearch = /const handleSearch = \(e\) => \{[\s\S]*?setHasSearched\(true\);\s*\};/m;
const newHandleSearch = `const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await searchRoutes(from, to, date);
    setHasSearched(true);
    setIsLoading(false);
  };`;
content = content.replace(oldHandleSearch, newHandleSearch);

// Also since we removed MOCK_ROUTES, we need to load all routes on mount if not searched, OR just leave it empty. Let's leave it to show whatever is in store.routes.
// Wait, we added fetchAllRoutes to store.js. Let's call it on mount if available.
if (!content.includes('fetchAllRoutes')) {
  content = content.replace('const { searchRoutes, searchResults, routes } = useBookingStore();', 'const { searchRoutes, searchResults, routes, fetchAllRoutes } = useBookingStore();');
  content = content.replace('const [hasSearched, setHasSearched] = useState(false);', 'const [hasSearched, setHasSearched] = useState(false);\n  import_useEffect_placeholder');
}
if (content.includes('import_useEffect_placeholder')) {
  content = content.replace('import_useEffect_placeholder', `
  import { useEffect } from 'react'; // handled at top usually, let's just use React.useEffect
  React.useEffect(() => {
    if (fetchAllRoutes) fetchAllRoutes();
  }, [fetchAllRoutes]);
  `);
}

// Wait, SearchPage imports `useState, useMemo`. We need to ensure `useEffect` is imported.
if (!content.includes('useEffect')) {
    content = content.replace('useState, useMemo', 'useState, useMemo, useEffect');
    content = content.replace('React.useEffect', 'useEffect');
} else {
    content = content.replace('React.useEffect', 'useEffect');
}

// Update the loading UI
content = content.replace('{/* Search Form */}', '{isLoading && <div className="loading-spinner">Loading routes...</div>}\n      {/* Search Form */}');

fs.writeFileSync('src/pages/SearchPage.jsx', content);
console.log('SearchPage updated');
