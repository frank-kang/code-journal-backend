import { User } from './components/UserContext';

const authKey = 'um.auth';

type Auth = {
  user: User;
  token: string;
};

export type Entry = {
  entryId?: number;
  title: string;
  notes: string;
  photoUrl: string;
};

export function saveAuth(user: User, token: string): void {
  const auth: Auth = { user, token };
  localStorage.setItem(authKey, JSON.stringify(auth));
}

export function removeAuth(): void {
  localStorage.removeItem(authKey);
}

export async function readEntries(): Promise<Entry[]> {
  const url = '/api/entries';
  const token = readToken();
  const req = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch(url, req);
  if (!response.ok) throw new Error(`Response status ${response.status}`);

  const entries = await response.json();
  return entries;
}

export async function readEntry(entryId: number): Promise<Entry | undefined> {
  const url = `/api/entries/${entryId}`;
  const token = readToken();
  const req = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch(url, req);
  if (!response.ok) throw new Error(`Response status ${response.status}`);

  const entry = await response.json();
  return entry;
}

export async function addEntry(entry: Entry): Promise<Entry> {
  const url = '/api/entries';
  const token = readToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error(`Response status ${response.status}`);
  const json = await response.json();
  return json;
}

export async function updateEntry(entry: Entry): Promise<Entry> {
  const url = `/api/entries/${entry.entryId}`;
  const token = readToken();
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`Response status ${response.status}`);
  return json;
}

export async function removeEntry(entryId: number): Promise<void> {
  const url = `/api/entries/${entryId}`;
  const token = readToken();
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entryId),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`Response status ${response.status}`);
  return json;
}

export function readUser(): User | undefined {
  const auth = localStorage.getItem(authKey);
  if (!auth) return undefined;
  return (JSON.parse(auth) as Auth).user;
}

export function readToken(): string | undefined {
  const auth = localStorage.getItem(authKey);
  if (!auth) return undefined;
  return (JSON.parse(auth) as Auth).token;
}
