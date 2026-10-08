import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import NewEntry from './pages/NewEntry.jsx';
import CustomerList from './pages/CustomerList.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <Link to="/" className="brand">
            Pesum Kanakku
          </Link>
          <Link to="/new-entry" className="primary-button compact-button">
            + New Entry
          </Link>
        </header>

        <main className="page-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new-entry" element={<NewEntry />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
