const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboardPage.jsx', 'utf8');

// Remove MOCK_USERS
content = content.replace(/\/\/ Mock active platform users[\s\S]*?\];/m, `// Mock users removed`);

// Add supabase import if not exists
if (!content.includes("import { supabase } from '../supabaseClient'")) {
  content = content.replace("import { useVehicleStore", "import { supabase } from '../supabaseClient';\nimport { useVehicleStore");
}

// Add state for users
const exportDefaultLine = "export default function AdminDashboardPage() {";
const stateAdditions = `
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) setUsers(data);
      } catch (err) {} finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);
`;
content = content.replace(exportDefaultLine, exportDefaultLine + stateAdditions);

// Replace MOCK_USERS usage with users
content = content.replace(/MOCK_USERS/g, 'users');

fs.writeFileSync('src/pages/AdminDashboardPage.jsx', content);
console.log('AdminDashboardPage updated to use Supabase users');
