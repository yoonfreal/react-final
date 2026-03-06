import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserProvider';

const STATUSES = [
  'INIT',
  'CLOSE-NO-AVAILABLE-BOOK',
  'ACCEPTED',
  'CANCEL-ADMIN',
  'CANCEL-USER'
];

export default function BookBorrow() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useUser();
  const isAdmin = user.role === 'ADMIN';

  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ bookId: '', targetDate: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function fetchBooksEndpoint(pathWithQuery, options) {
    const first = await fetch(`${API_URL}${pathWithQuery}`, options);
    if (first.status !== 404) return first;
    const fallbackPath = pathWithQuery.replace('/api/books', '/api/book');
    return fetch(`${API_URL}${fallbackPath}`, options);
  }

  async function loadBooks() {
    const result = await fetchBooksEndpoint('/api/books', {
      method: 'GET',
      credentials: 'include'
    });

    if (!result.ok) return;

    const payload = await result.json().catch(() => []);
    const list = Array.isArray(payload) ? payload : payload?.data || [];
    setBooks(list);

    if (!form.bookId && list.length > 0) {
      setForm((prev) => ({ ...prev, bookId: list[0]._id || list[0].id }));
    }
  }

  async function loadRequests() {
    const result = await fetch(`${API_URL}/api/borrow`, {
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
      return;
    }

    const payload = await result.json().catch(() => []);
    const list = Array.isArray(payload) ? payload : payload?.data || [];
    setRequests(list);
  }

  useEffect(() => {
    setError('');
    loadBooks();
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreateRequest(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const result = await fetch(`${API_URL}/api/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        bookId: form.bookId,
        targetDate: form.targetDate
      })
    });

    if (result.status === 403) {
      setError('403 Forbidden');
      return;
    }

    if (result.status === 401) {
      setError('401 Unauthorized');
      return;
    }

    if (!result.ok) {
      setError('Create request failed');
      return;
    }

    setMessage('Borrow request created');
    await loadRequests();
  }

  async function onUpdateStatus(requestId, status) {
    setError('');
    setMessage('');

    const result = await fetch(`${API_URL}/api/borrow`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ requestId, status })
    });

    if (result.status === 403) {
      setError('403 Forbidden');
      return;
    }

    if (result.status === 401) {
      setError('401 Unauthorized');
      return;
    }

    if (!result.ok) {
      setError('Update request status failed');
      return;
    }

    setMessage('Request status updated');
    await loadRequests();
  }

  return (
    <div className='panel'>
      <h2>Borrow</h2>
      {error && <p className='alert error'>{error}</p>}
      {message && <p className='alert ok'>{message}</p>}

      {!isAdmin && (
        <div className='sub-panel'>
          <h3>Create Borrow Request</h3>
          <form className='form-row' onSubmit={onCreateRequest}>
            <select
              value={form.bookId}
              onChange={(e) => setForm((prev) => ({ ...prev, bookId: e.target.value }))}
              required
            >
              {books.map((book) => (
                <option key={book._id || book.id} value={book._id || book.id}>
                  {book.title} - {book.author}
                </option>
              ))}
            </select>
            <input
              type='date'
              required
              value={form.targetDate}
              onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))}
            />
            <button className='cta' type='submit'>Submit Request</button>
          </form>
        </div>
      )}

      <h3>{isAdmin ? 'Manage Borrow Requests' : 'My Borrow Requests'}</h3>
      <div className='table-wrap'>
      <table className='data-table'>
        <thead>
          <tr>
            <th>User</th>
            <th>Book</th>
            <th>Created At</th>
            <th>Target Date</th>
            <th>Status</th>
            {isAdmin && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const requestId = request._id || request.id;
            const matchedBook = books.find(
              (book) => (book._id || book.id) === request.bookId
            );
            return (
              <tr key={requestId}>
                <td>{request.userId || request.user?.email || '-'}</td>
                <td>{request.bookTitle || matchedBook?.title || request.book?.title || request.bookId || '-'}</td>
                <td>{request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</td>
                <td>{request.targetDate ? new Date(request.targetDate).toLocaleDateString() : '-'}</td>
                <td>{request.status}</td>
                {isAdmin && (
                  <td>
                    <select
                      defaultValue={request.status}
                      onChange={(e) => onUpdateStatus(requestId, e.target.value)}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
              </tr>
            );
          })}
          {requests.length === 0 && (
            <tr>
              <td className='empty-cell' colSpan={isAdmin ? 6 : 5}>No request found</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
