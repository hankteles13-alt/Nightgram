import { supabase } from './supabase';

type Filter = { field: string; op: string; value: any };
type Sort = { field: string; direction: 'asc' | 'desc' };

export interface CollectionRef {
  kind: 'collection';
  path: string[];
  name: string;
}

export interface DocRef {
  kind: 'doc';
  path: string[];
  id: string;
  parent: CollectionRef;
}

export interface QueryRef {
  kind: 'query';
  collection: CollectionRef;
  filters: Filter[];
  sort?: Sort;
}

export const db = {};

const collectionName = (path: string[]) =>
  path.length === 1 ? path[0] : `${path[0]}_messages`;

const pathString = (path: string[]) => path.join('/');

export const collection = (_db: any, ...path: string[]): CollectionRef => ({
  kind: 'collection',
  path,
  name: collectionName(path),
});

export const doc = (_db: any, ...path: string[]): DocRef => ({
  kind: 'doc',
  path,
  id: path[path.length - 1],
  parent: collection(_db, ...path.slice(0, -1)),
});

export const where = (field: string, op: string, value: any): Filter => ({
  field,
  op,
  value,
});

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc'): Sort => ({
  field,
  direction,
});

export const query = (
  ref: CollectionRef,
  ...constraints: Array<Filter | Sort>
): QueryRef => ({
  kind: 'query',
  collection: ref,
  filters: constraints.filter((c): c is Filter => 'op' in c),
  sort: constraints.find((c): c is Sort => 'direction' in c),
});

// Local cache helpers to ensure offline resilience and instant local persistence
const LOCAL_PREFIX = 'nightgram_doc:';

function saveLocalDoc(id: string, data: any) {
  try {
    localStorage.setItem(LOCAL_PREFIX + id, JSON.stringify(data));
  } catch {}
}

function getLocalDoc(id: string): any | null {
  try {
    const item = localStorage.getItem(LOCAL_PREFIX + id);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function removeLocalDoc(id: string) {
  try {
    localStorage.removeItem(LOCAL_PREFIX + id);
  } catch {}
}

function getLocalCollectionRows(collectionName: string): any[] {
  const rows: any[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_PREFIX)) {
        const id = key.slice(LOCAL_PREFIX.length);
        const parts = id.split('/');
        const colName =
          parts.length === 2 ? parts[0] : parts.length > 2 ? `${parts[0]}_messages` : parts[0];
        if (colName === collectionName) {
          const val = getLocalDoc(id);
          if (val) {
            rows.push({
              id,
              data: val,
              created_at: val.createdAt || new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch {}
  return rows;
}

const makeDoc = (row: any) => ({
  id: row.id.split('/').pop() || row.id,
  data: () => row.data || {},
  exists: () => !!row.data,
});

const matches = (row: any, filters: Filter[]) =>
  filters.every((f) => {
    if (!row.data) return false;
    if (f.op === '==') return row.data[f.field] === f.value;
    if (f.op === 'array-contains')
      return Array.isArray(row.data[f.field]) && row.data[f.field].includes(f.value);
    return false;
  });

const fetchRows = async (q: QueryRef) => {
  let rows: any[] = [];
  try {
    const { data, error } = await supabase
      .from('legacy_documents')
      .select('id,data,created_at')
      .eq('collection_name', q.collection.name);

    if (!error && Array.isArray(data) && data.length > 0) {
      rows = data;
      for (const r of data) {
        saveLocalDoc(r.id, r.data);
      }
    } else {
      rows = getLocalCollectionRows(q.collection.name);
    }
  } catch {
    rows = getLocalCollectionRows(q.collection.name);
  }

  const prefix = q.collection.path.length > 1 ? q.collection.path.join('/') + '/' : '';
  let filtered = rows.filter(
    (row: any) => (!prefix || row.id.startsWith(prefix)) && matches(row, q.filters)
  );

  if (q.sort) {
    filtered.sort((a: any, b: any) => {
      const av = a.data?.[q.sort!.field] ?? a.created_at ?? '';
      const bv = b.data?.[q.sort!.field] ?? b.created_at ?? '';
      const c = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return q.sort!.direction === 'desc' ? -c : c;
    });
  }
  return filtered;
};

const snap = (rows: any[]) => ({
  docs: rows.map(makeDoc),
  empty: rows.length === 0,
  size: rows.length,
  forEach: (fn: (doc: ReturnType<typeof makeDoc>) => void) => rows.map(makeDoc).forEach(fn),
});

export const getDoc = async (ref: DocRef) => {
  const p = pathString(ref.path);
  try {
    const { data, error } = await supabase
      .from('legacy_documents')
      .select('id,data')
      .eq('id', p)
      .maybeSingle();

    if (!error && data) {
      saveLocalDoc(p, data.data);
      return {
        exists: () => true,
        id: ref.id,
        data: () => data.data || {},
      };
    }
  } catch {}

  const localData = getLocalDoc(p);
  return {
    exists: () => localData !== null,
    id: ref.id,
    data: () => localData || {},
  };
};

export const getDocs = async (ref: CollectionRef | QueryRef) =>
  snap(await fetchRows(ref.kind === 'query' ? ref : query(ref)));

const ownerFor = (data: any) =>
  data?.uid ||
  data?.userId ||
  data?.senderId ||
  (Array.isArray(data?.participants) ? data.participants[0] : null) ||
  null;

export const setDoc = async (
  ref: DocRef,
  data: any,
  options?: { merge?: boolean }
) => {
  const p = pathString(ref.path);
  let finalData = data || {};
  if (options?.merge) {
    const old = await getDoc(ref);
    finalData = { ...(old.data() || {}), ...data };
  }

  saveLocalDoc(p, finalData);

  try {
    const { error } = await supabase.from('legacy_documents').upsert({
      id: p,
      collection_name: ref.parent.name,
      doc_id: ref.id,
      parent_path: ref.parent.path.join('/'),
      owner_id: ownerFor(finalData),
      data: finalData,
    });
    if (error) {
      console.warn('Supabase setDoc notice (saved locally):', error.message);
    }
  } catch (err) {
    console.warn('Supabase setDoc exception (saved locally):', err);
  }
};

const transform = (current: any, updates: any) => {
  const next = { ...current };
  for (const [key, value] of Object.entries(updates)) {
    if (value && typeof value === 'object' && (value as any).__arrayOp) {
      const arr = Array.isArray(next[key]) ? [...next[key]] : [];
      if ((value as any).__arrayOp === 'union') {
        for (const item of (value as any).values) {
          if (!arr.some((x) => JSON.stringify(x) === JSON.stringify(item))) {
            arr.push(item);
          }
        }
      } else {
        for (const item of (value as any).values) {
          for (let i = arr.length - 1; i >= 0; i--) {
            if (JSON.stringify(arr[i]) === JSON.stringify(item)) {
              arr.splice(i, 1);
            }
          }
        }
      }
      next[key] = arr;
    } else if (key.includes('.')) {
      const parts = key.split('.');
      let target = next;
      for (const part of parts.slice(0, -1)) {
        target[part] ||= {};
        target = target[part];
      }
      target[parts.at(-1)!] = value;
    } else {
      next[key] = value;
    }
  }
  return next;
};

export const updateDoc = async (ref: DocRef, updates: any) => {
  const p = pathString(ref.path);
  const old = await getDoc(ref);
  const currentData = old.exists() ? old.data() : {};
  const data = transform(currentData, updates);

  saveLocalDoc(p, data);

  try {
    const { error } = await supabase
      .from('legacy_documents')
      .upsert({
        id: p,
        collection_name: ref.parent.name,
        doc_id: ref.id,
        parent_path: ref.parent.path.join('/'),
        owner_id: ownerFor(data),
        data,
      });
    if (error) {
      console.warn('Supabase updateDoc notice (saved locally):', error.message);
    }
  } catch (err) {
    console.warn('Supabase updateDoc exception (saved locally):', err);
  }
};

export const deleteDoc = async (ref: DocRef) => {
  const p = pathString(ref.path);
  removeLocalDoc(p);
  try {
    await supabase.from('legacy_documents').delete().eq('id', p);
  } catch (err) {
    console.debug('Supabase deleteDoc notice:', err);
  }
};

export const addDoc = async (ref: CollectionRef, data: any): Promise<DocRef> => {
  const id = crypto.randomUUID();
  const docRef = doc(db, ...ref.path, id);
  await setDoc(docRef, data);
  return docRef;
};

export const arrayUnion = (...values: any[]) => ({ __arrayOp: 'union', values });
export const arrayRemove = (...values: any[]) => ({ __arrayOp: 'remove', values });

export const onSnapshot = (
  ref: DocRef | CollectionRef | QueryRef,
  next: (snapshot: any) => void,
  onError?: (error: any) => void
): (() => void) => {
  if (ref.kind === 'doc') {
    let active = true;
    const p = pathString(ref.path);
    const refreshDoc = async () => {
      try {
        const docSnap = await getDoc(ref);
        if (active) next(docSnap);
      } catch (err) {
        if (active && onError) onError(err);
      }
    };
    void refreshDoc();

    const channel = supabase
      .channel(`doc-${p}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legacy_documents',
          filter: `id=eq.${p}`,
        },
        () => {
          void refreshDoc();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }

  const q = ref.kind === 'query' ? ref : query(ref);
  let active = true;
  const refresh = async () => {
    try {
      const rows = await fetchRows(q);
      if (active) next(snap(rows));
    } catch (e) {
      if (active && onError) onError(e);
    }
  };
  void refresh();

  const channel = supabase
    .channel(`col-${q.collection.name}-${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'legacy_documents',
        filter: `collection_name=eq.${q.collection.name}`,
      },
      () => {
        void refresh();
      }
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
};
