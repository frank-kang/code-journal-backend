export type Entry = {
  entryId?: number;
  title: string;
  notes: string;
  photoUrl: string;
};

export async function readEntries(): Promise<Entry[]> {
  // return readData().entries;
  const url = '/api/entries';
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Response status ${response.status}`);

  const entries = await response.json();
  return entries;
}

export async function readEntry(entryId: number): Promise<Entry | undefined> {
  // return readData().entries.find((e) => e.entryId === entryId);
  const url = `/api/entries/${entryId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Response status ${response.status}`);

  const entry = await response.json();
  return entry;
}

export async function addEntry(entry: Entry): Promise<Entry> {
  const url = '/api/entries';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error(`Response status ${response.status}`);
  const json = await response.json();
  return json;
}

export async function updateEntry(entry: Entry): Promise<Entry> {
  const url = `/api/entries/${entry.entryId}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`Response status ${response.status}`);
  return json;
}

export async function removeEntry(entryId: number): Promise<void> {
  const url = `/api/entries/${entryId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify(entryId),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`Response status ${response.status}`);
  return json;
}
