import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserProvider';

export default function Books() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useUser();
  const isAdmin = user.role === 'ADMIN';

  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({ title: '', author: '' });
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', quantity: 1, location: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');

  async function fetchWithBookFallback(pathWithQuery, options) {
    const first = await fetch(`${API_URL}${pathWithQuery}`, options);
    if (first.status !== 404) return first;
    const fallbackPath = pathWithQuery.replace('/api/books', '/api/book');
    return fetch(`${API_URL}${fallbackPath}`, options);
  }

  async function fetchBooks() {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.title) params.set('title', filters.title);
      if (filters.author) params.set('author', filters.author);
      if (isAdmin && includeDeleted) params.set('includeDeleted', 'true');
      const query = params.toString();

      const result = await fetchWithBookFallback(`/api/books${query ? `?${query}` : ''}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (result.status === 401) {
        setError('401 Unauthorized');
        setBooks([]);
        return;
      }

      if (result.status === 403) {
        setError('403 Forbidden');
        setBooks([]);
        return;
      }

      if (!result.ok) {
        setError('Failed to load books');
        setBooks([]);
        return;
      }

      const payload = await result.json().catch(() => []);
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      setBooks(list);
    } catch {
      setError('Failed to load books');
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDeleted]);

  async function onSearchSubmit(event) {
    event.preventDefault();
    await fetchBooks();
  }

  async function onCreateBook(event) {
    event.preventDefault();
    setCreateError('');

    const result = await fetchWithBookFallback('/api/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        title: newBook.title,
        author: newBook.author,
        quantity: Number(newBook.quantity),
        location: newBook.location
      })
    });

    if (result.status === 401) {
      setCreateError('401 Unauthorized');
      return;
    }

    if (result.status === 403) {
      setCreateError('403 Forbidden');
      return;
    }

    if (!result.ok) {
      setCreateError('Create book failed');
      return;
    }

    setNewBook({ title: '', author: '', quantity: 1, location: '' });
    await fetchBooks();
  }

  return (
    <div className='panel'>
      <h2>Books</h2>

      <form className='form-row' onSubmit={onSearchSubmit}>
        <input
          type='text'
          placeholder='Filter by title'
          value={filters.title}
          onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
        />
        <input
          type='text'
          placeholder='Filter by author'
          value={filters.author}
          onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
        />
        <button className='cta' type='submit'>Search</button>
        {isAdmin && (
          <label className='checkbox-line'>
            <input
              type='checkbox'
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            Show deleted
          </label>
        )}
      </form>

      {error && <p className='alert error'>{error}</p>}
      {isLoading ? <p className='meta-line'>Loading...</p> : null}

      <div className='table-wrap'>
      <table className='data-table'>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Quantity</th>
            <th>Location</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book._id || book.id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.quantity}</td>
              <td>{book.location}</td>
              <td>{book.status || 'ACTIVE'}</td>
              <td>
                <Link to={`/books/${book._id || book.id}`}>Detail</Link>
              </td>
            </tr>
          ))}
          {books.length === 0 && !isLoading ? (
            <tr>
              <td colSpan='6' className='empty-cell'>No books found</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>

      {isAdmin && (
        <div className='sub-panel'>
          <h3>Create Book</h3>
          <form className='form-row' onSubmit={onCreateBook}>
            <input
              type='text'
              placeholder='Title'
              required
              value={newBook.title}
              onChange={(e) => setNewBook((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              type='text'
              placeholder='Author'
              required
              value={newBook.author}
              onChange={(e) => setNewBook((prev) => ({ ...prev, author: e.target.value }))}
            />
            <input
              type='number'
              min='0'
              placeholder='Quantity'
              required
              value={newBook.quantity}
              onChange={(e) => setNewBook((prev) => ({ ...prev, quantity: e.target.value }))}
            />
            <input
              type='text'
              placeholder='Location'
              required
              value={newBook.location}
              onChange={(e) => setNewBook((prev) => ({ ...prev, location: e.target.value }))}
            />
            <button className='cta' type='submit'>Create</button>
          </form>
          {createError && <p className='alert error'>{createError}</p>}
        </div>
      )}
    </div>
  );
}
