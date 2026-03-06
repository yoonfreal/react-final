import './App.css';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './middleware/RequireAuth';
import Login from './components/Login';
import Logout from './components/Logout';
import Books from './components/Books';
import { BookDetail } from './components/BookDetail';
import BookBorrow from './components/BookBorrow';
import { useUser } from './contexts/UserProvider';

function ProtectedLayout({ children }) {
  const { user } = useUser();
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className='app-shell'>
      <header className='topbar'>
        <div>
          <p className='kicker'>WAD Final Project</p>
          <h1>Library Management System</h1>
        </div>
        <p className='identity'>
          Logged in as: {user.email || user.name || 'Unknown'} ({user.role || 'USER'})
        </p>
        <nav className='menu'>
          <Link className='chip' to='/books'>Books</Link>
          <Link className='chip' to='/borrow'>{isAdmin ? 'Borrow Requests' : 'Borrow'}</Link>
          <Link className='chip danger' to='/logout'>Logout</Link>
        </nav>
      </header>
      <main className='content'>{children}</main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route
        path='/logout'
        element={
          <RequireAuth>
            <Logout />
          </RequireAuth>
        }
      />
      <Route
        path='/books'
        element={
          <RequireAuth>
            <ProtectedLayout>
              <Books />
            </ProtectedLayout>
          </RequireAuth>
        }
      />
      <Route
        path='/books/:id'
        element={
          <RequireAuth>
            <ProtectedLayout>
              <BookDetail />
            </ProtectedLayout>
          </RequireAuth>
        }
      />
      <Route
        path='/borrow'
        element={
          <RequireAuth>
            <ProtectedLayout>
              <BookBorrow />
            </ProtectedLayout>
          </RequireAuth>
        }
      />
      <Route path='/' element={<Navigate to='/books' replace />} />
      <Route path='*' element={<Navigate to='/books' replace />} />
    </Routes>
  );
}

export default App;
