import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../contexts/UserProvider';

export function BookDetail() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const isAdmin = user.role === 'ADMIN';

  const [book, setBook] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', quantity: 0, location: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function fetchWithBookFallback(path, options) {
    const first = await fetch(`${API_URL}${path}`, options);
    if (first.status !== 404) return first;
    const fallbackPath = path.replace('/api/books', '/api/book');
    return fetch(`${API_URL}${fallbackPath}`, options);
  }

  async function loadBook() {
    setError('');
    setMessage('');

    const result = await fetchWithBookFallback(`/api/books/${id}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (result.status === 401) {
      setError('401 Unauthorized');
      return;
    }

    if (result.status === 403) {
      setError('403 Forbidden');
      return;
    }

    if (!result.ok) {
      setError('Failed to load book');
      return;
    }

    const payload = await result.json().catch(() => ({}));
    const detail = payload?.data || payload;
    setBook(detail);
    setForm({
      title: detail.title || '',
      author: detail.author || '',
      quantity: detail.quantity || 0,
      location: detail.location || ''
    });
  }

  useEffect(() => {
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onUpdate(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);

    const result = await fetchWithBookFallback(
      `/api/books/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          quantity: Number(form.quantity),
          location: form.location
        })
      }
    );

    if (result.status === 401) {
      setError('401 Unauthorized');
      setIsSaving(false);
      return;
    }

    if (result.status === 403) {
      setError('403 Forbidden');
      setIsSaving(false);
      return;
    }

    if (!result.ok) {
      const payload = await result.json().catch(() => ({}));
      setError(payload?.message || 'Update failed');
      setIsSaving(false);
      return;
    }

    const payload = await result.json().catch(() => ({}));
    const updated = payload?.book;
    if (updated) {
      setBook(updated);
      setForm({
        title: updated.title || '',
        author: updated.author || '',
        quantity: updated.quantity || 0,
        location: updated.location || ''
      });
    } else {
      await loadBook();
    }
    setMessage('Book updated successfully');
    setIsSaving(false);
  }

  async function onDelete() {
    setMessage('');
    setError('');

    const result = await fetchWithBookFallback(`/api/books/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (result.status === 401) {
      setError('401 Unauthorized');
      return;
    }

    if (result.status === 403) {
      setError('403 Forbidden');
      return;
    }

    if (!result.ok) {
      setError('Delete failed');
      return;
    }

    navigate('/books');
  }

  if (!book && !error) return <p className='meta-line'>Loading...</p>;

  return (
    <div className='panel'>
      <h2>Book Detail</h2>
      <p className='meta-line'>
        <Link className='back-link' to='/books'>Back to Books</Link>
      </p>
      {error && <p className='alert error'>{error}</p>}
      {message && <p className='alert ok'>{message}</p>}

      {book && (
        <div>
          <p className='meta-line'>Current Status: <strong>{book.status || 'ACTIVE'}</strong></p>
          {isAdmin ? (
            <form className='form-row' onSubmit={onUpdate}>
              <input
                type='text'
                value={form.title}
                required
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                type='text'
                value={form.author}
                required
                onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
              />
              <input
                type='number'
                min='0'
                value={form.quantity}
                required
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
              <input
                type='text'
                value={form.location}
                required
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              />
              <button className='cta' type='submit' disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update'}
              </button>
              <button className='ghost danger' type='button' onClick={onDelete}>
                Soft Delete
              </button>
            </form>
          ) : (
            <div className='table-wrap'>
            <table className='data-table detail-table'>
              <tbody>
                <tr>
                  <th>Title</th>
                  <td>{book.title}</td>
                </tr>
                <tr>
                  <th>Author</th>
                  <td>{book.author}</td>
                </tr>
                <tr>
                  <th>Quantity</th>
                  <td>{book.quantity}</td>
                </tr>
                <tr>
                  <th>Location</th>
                  <td>{book.location}</td>
                </tr>
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
