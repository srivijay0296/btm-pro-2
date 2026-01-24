
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate,
  useLocation 
} from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Store, 
  CreditCard, 
  LogOut, 
  Search, 
  Plus, 
  Package, 
  Clock, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  User
} from 'lucide-react';

// --- CONFIG & UTILS ---
const TRIAL_DAYS = 30;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const cn = (...args: any[]) => args.filter(Boolean).join(' ');

// --- MOCK DATABASE / SERVICE LAYER ---
// In a real app, these would be API calls.
const Storage = {
  getUsers: () => JSON.parse(localStorage.getItem('btm_users') || '[]'),
  setUsers: (users: any[]) => localStorage.setItem('btm_users', JSON.stringify(users)),
  getProducts: () => JSON.parse(localStorage.getItem('btm_products') || '[]'),
  setProducts: (products: any[]) => localStorage.setItem('btm_products', JSON.stringify(products)),
  getCurrentUser: () => JSON.parse(localStorage.getItem('btm_current_user') || 'null'),
  setCurrentUser: (user: any) => localStorage.setItem('btm_current_user', JSON.stringify(user)),
  logout: () => localStorage.removeItem('btm_current_user')
};

// Seed initial products if empty
if (Storage.getProducts().length === 0) {
  Storage.setProducts([
    { id: 1, name: 'Premium Egyptian Cotton', price: 450, category: 'Cotton', seller: 'Ahmed Textiles', stock: 120, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80' },
    { id: 2, name: 'Silk Jacquard - Royal Blue', price: 1200, category: 'Silk', seller: 'Luxury Weaves', stock: 45, image: 'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?auto=format&fit=crop&w=400&q=80' },
    { id: 3, name: 'Linen Blend Eco-Friendly', price: 320, category: 'Linen', seller: 'Green Fibers', stock: 200, image: 'https://images.unsplash.com/photo-1528459840556-3830aef63374?auto=format&fit=crop&w=400&q=80' },
  ]);
}

// --- COMPONENTS ---

// 1. PROTECTION MIDDLEWARE
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const user = Storage.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RequireSubscription = ({ children }: { children: React.ReactNode }) => {
  const user = Storage.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;

  const now = new Date();
  const trialEnd = new Date(user.trialEndDate);
  const isTrialActive = now <= trialEnd;
  const isSubscribed = user.subscriptionStatus === 'active';

  if (!isTrialActive && !isSubscribed) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
};

// 2. LAYOUT
const AppLayout = ({ children, title }: { children: React.ReactNode, title: string }) => {
  const navigate = useNavigate();
  const user = Storage.getCurrentUser();
  const location = useLocation();

  const handleLogout = () => {
    Storage.logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
    { label: 'My Inventory', icon: Package, path: '/inventory', role: 'seller' },
    { label: 'Billing', icon: CreditCard, path: '/upgrade' },
  ];

  const filteredNav = navItems.filter(item => !item.role || item.role === user?.role);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg">
            <TrendingUp className="text-indigo-900" size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">BTM Textiles</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                location.pathname === item.path ? "bg-indigo-800 text-white shadow-lg" : "text-indigo-200 hover:bg-indigo-800/50 hover:text-white"
              )}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <div className="bg-indigo-800/50 p-4 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={14} className="text-indigo-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Logged in as</span>
            </div>
            <p className="font-medium text-sm truncate">{user?.fullName}</p>
            <span className="text-[10px] bg-indigo-700 px-2 py-0.5 rounded-full mt-2 inline-block capitalize">{user?.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-indigo-200 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <div className="flex items-center gap-4">
            {user?.subscriptionStatus !== 'active' && (
               <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-amber-700 text-xs font-medium">
                <Clock size={14} />
                Trial ends: {new Date(user?.trialEndDate).toLocaleDateString()}
               </div>
            )}
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
              {user?.fullName?.[0]}
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// 3. PAGE: LOGIN
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = Storage.getUsers();
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      Storage.setCurrentUser(user);
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <TrendingUp className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-2">Sign in to manage your textile business</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input 
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all">
            Sign In
          </button>
        </form>
        <p className="text-center text-slate-500 mt-8 text-sm">
          Don't have an account? <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Start 30-day Free Trial</Link>
        </p>
      </div>
    </div>
  );
};

// 4. PAGE: SIGNUP
const SignupPage = () => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'buyer', mobile: '' });
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const users = Storage.getUsers();
    const now = new Date();
    const trialEnd = new Date(now.getTime() + (TRIAL_DAYS * 24 * 60 * 60 * 1000));
    
    const newUser = {
      ...form,
      createdAt: now.toISOString(),
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      subscriptionStatus: 'trial',
      planType: 'none',
      subscriptionStartDate: null,
      subscriptionEndDate: null
    };

    users.push(newUser);
    Storage.setUsers(users);
    Storage.setCurrentUser(newUser);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-indigo-600 p-10 text-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6 italic">Grow your textile empire.</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="bg-indigo-500 p-1 rounded-full"><Plus size={16}/></div>
              <span>Access global textile suppliers</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-indigo-500 p-1 rounded-full"><Plus size={16}/></div>
              <span>AI-powered quality analysis</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-indigo-500 p-1 rounded-full"><Plus size={16}/></div>
              <span>Automated inventory tracking</span>
            </li>
          </ul>
          <div className="mt-12 p-4 bg-indigo-500/50 rounded-xl border border-indigo-400">
            <p className="text-sm font-medium">🎁 Start with 30 days of free access. No credit card required.</p>
          </div>
        </div>
        <div className="md:w-1/2 p-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Create your account</h2>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <input type="text" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white">
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                <input type="tel" required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-all mt-4">
              Sign Up Free
            </button>
          </form>
          <p className="text-center text-slate-500 mt-6 text-sm">
            Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// 5. PAGE: DASHBOARD
const DashboardPage = () => {
  const user = Storage.getCurrentUser();
  const products = Storage.getProducts();

  return (
    <AppLayout title="Overview">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={24}/></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Products</p>
              <h3 className="text-2xl font-bold">{products.length}</h3>
            </div>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-2/3"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><ShoppingBag size={24}/></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Inquiries</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-1/4"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={24}/></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Account Status</p>
              <h3 className="text-2xl font-bold capitalize">{user?.subscriptionStatus}</h3>
            </div>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-full"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              Gemini AI Textile Assistant
            </h3>
          </div>
          <div className="p-6">
             <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-4 italic text-slate-600">
               "Ask me about current textile market trends, material comparisons, or to generate high-converting product descriptions."
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="e.g. Compare silk vs sateen durability" 
                 className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
               />
               <button className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
                 <Search size={20} />
               </button>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-2 bg-indigo-500 rounded-full h-10"></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">New inquiry received for "Egyptian Cotton"</p>
                  <p className="text-xs text-slate-500">2 hours ago • From TextileHub India</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// 6. PAGE: MARKETPLACE
const MarketplacePage = () => {
  const [products] = useState(Storage.getProducts());

  return (
    <AppLayout title="Marketplace">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search fabrics, materials, colors..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
          />
        </div>
        <select className="bg-white border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 min-w-[150px]">
          <option>All Categories</option>
          <option>Cotton</option>
          <option>Silk</option>
          <option>Linen</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p: any) => (
          <div key={p.id} className="bg-white group rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="h-48 overflow-hidden relative">
              <img src={p.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                ₹{p.price}/m
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-500">{p.category}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">Stock: {p.stock}</span>
              </div>
              <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">{p.name}</h3>
              <p className="text-xs text-slate-400 mb-4">By {p.seller}</p>
              <button className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                Send Inquiry <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

// 7. PAGE: UPGRADE
const UpgradePage = () => {
  const navigate = useNavigate();
  const user = Storage.getCurrentUser();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    setLoading(true);
    // Simulate payment logic
    setTimeout(() => {
      const users = Storage.getUsers();
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active',
        planType: plan,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(new Date().getTime() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const newUsers = users.map((u: any) => u.email === user.email ? updatedUser : u);
      Storage.setUsers(newUsers);
      Storage.setCurrentUser(updatedUser);
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  const isExpired = new Date() > new Date(user.trialEndDate) && user.subscriptionStatus !== 'active';

  return (
    <AppLayout title="Billing & Plans">
      {isExpired && (
        <div className="mb-10 p-6 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-900 mb-1">Your Trial Has Expired</h2>
            <p className="text-red-700">Please upgrade to a paid plan to continue accessing the marketplace and managing your products.</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-600">Choose the best plan for your textile business scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative flex flex-col">
            <h3 className="text-xl font-bold mb-2">Standard Monthly</h3>
            <div className="mb-6">
              <span className="text-4xl font-black text-slate-900">₹299</span>
              <span className="text-slate-500"> / month</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <div className="bg-indigo-100 text-indigo-600 p-0.5 rounded-full"><Plus size={12}/></div>
                Unlimited Inquiries
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <div className="bg-indigo-100 text-indigo-600 p-0.5 rounded-full"><Plus size={12}/></div>
                Up to 50 Product Listings
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 opacity-50">
                <div className="bg-slate-100 text-slate-400 p-0.5 rounded-full"><Plus size={12}/></div>
                AI Description Generator
              </li>
            </ul>
            <button 
              disabled={loading}
              onClick={() => handleUpgrade('monthly')}
              className="w-full py-4 rounded-xl border-2 border-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Start Monthly Plan'}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative text-white flex flex-col transform md:scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              Best Value
            </div>
            <h3 className="text-xl font-bold mb-2">Professional Yearly</h3>
            <div className="mb-6">
              <span className="text-4xl font-black">₹2400</span>
              <span className="text-slate-400"> / year</span>
              <p className="text-indigo-400 text-sm font-bold mt-1">Save ₹1188 annually!</p>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="bg-indigo-500 text-white p-0.5 rounded-full"><Plus size={12}/></div>
                Priority Support
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="bg-indigo-500 text-white p-0.5 rounded-full"><Plus size={12}/></div>
                Unlimited Product Listings
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="bg-indigo-500 text-white p-0.5 rounded-full"><Plus size={12}/></div>
                Full AI Market Analysis Tools
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="bg-indigo-500 text-white p-0.5 rounded-full"><Plus size={12}/></div>
                Custom Branding for Store
              </li>
            </ul>
            <button 
              disabled={loading}
              onClick={() => handleUpgrade('yearly')}
              className="w-full py-4 rounded-xl bg-indigo-500 font-bold hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Upgrade Now'}
            </button>
          </div>
        </div>

        <div className="mt-16 text-center text-slate-400 text-xs">
          <p>Secure payments processed via encrypted gateways. Need help? Contact <a href="#" className="underline">support@btmtextiles.com</a></p>
          <p className="mt-2 font-medium">Refer to <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-500">billing documentation</a> for platform details.</p>
        </div>
      </div>
    </AppLayout>
  );
};

// 8. PAGE: INVENTORY (FOR SELLERS)
const InventoryPage = () => {
  const [products, setProducts] = useState(Storage.getProducts());
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: 'Cotton' });
  const [generating, setGenerating] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const p = {
      ...newProduct,
      id: Date.now(),
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      seller: Storage.getCurrentUser()?.fullName,
      image: 'https://images.unsplash.com/photo-1590674000109-77119934164b?auto=format&fit=crop&w=400&q=80'
    };
    const updated = [...products, p];
    Storage.setProducts(updated);
    setProducts(updated);
    setIsAdding(false);
  };

  const generateDescription = async () => {
    setGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Create a professional 30-word sales description for a textile product named "${newProduct.name}" in the category "${newProduct.category}". Highlight quality and texture.`
      });
      alert(response.text);
    } catch (e) {
      console.error(e);
      alert('AI service currently unavailable for trial users. Upgrade to access full features.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout title="Inventory Management">
      <div className="flex justify-between items-center mb-8">
        <p className="text-slate-500">Manage your textile listings and track stock levels.</p>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Add New Textile
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">List New Material</h2>
            <form onSubmit={handleAdd} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                  <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" placeholder="e.g. Italian Wool" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500">
                    <option>Cotton</option>
                    <option>Silk</option>
                    <option>Wool</option>
                    <option>Polyester</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (per meter)</label>
                  <input required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Level</label>
                  <input required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" placeholder="100" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={generateDescription} disabled={!newProduct.name || generating} className="flex-1 border-2 border-indigo-100 text-indigo-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all disabled:opacity-50">
                  <Sparkles size={18} /> {generating ? 'Thinking...' : 'AI Describe'}
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">
                  Save Product
                </button>
              </div>
              <button type="button" onClick={() => setIsAdding(false)} className="w-full text-slate-400 text-sm py-2 hover:text-slate-600">Cancel</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-bold text-slate-800">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.category}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.stock}m</td>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">₹{p.price}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    p.stock > 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {p.stock > 10 ? 'In Stock' : 'Low Stock'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

// 9. APP ROOT
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        <Route path="/dashboard" element={
          <RequireAuth>
            <RequireSubscription>
              <DashboardPage />
            </RequireSubscription>
          </RequireAuth>
        } />

        <Route path="/marketplace" element={
          <RequireAuth>
            <RequireSubscription>
              <MarketplacePage />
            </RequireSubscription>
          </RequireAuth>
        } />

        <Route path="/inventory" element={
          <RequireAuth>
            <RequireSubscription>
              <InventoryPage />
            </RequireSubscription>
          </RequireAuth>
        } />

        <Route path="/upgrade" element={
          <RequireAuth>
            <UpgradePage />
          </RequireAuth>
        } />

        {/* Home redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
