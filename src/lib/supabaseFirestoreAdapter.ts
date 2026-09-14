import { supabase } from './supabase';
import { auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, signInWithRedirect, getRedirectResult, updatePhoneNumber } from './supabaseAuth';

// Firestore-shaped compatibility API backed entirely by Supabase Postgres/Realtime.
// The chat UI still uses its existing Firestore-style calls, but no chat data is stored in Firebase.

type Ref = { path: string[]; id: string; table: string };
type Filter = { field: string; op: string; value: any };
type QuerySpec = { path: string[]; filters: Filter[]; order?: { field: string; direction: 'asc' | 'desc' } };

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const wrapDocs = (rows: any[] = []) => ({
  docs: rows.map((row) => ({ id: row.id, data: () => row })),
  empty: rows.length === 0,
  size: rows.length,
  forEach: (cb: (doc: any) => void) => rows.forEach((row) => cb({ id: row.id, data: () => row })),
});

async function getChatId(refId: string) {
  if (isUuid(refId)) return refId;
  const parts = refId.split('_').filter(Boolean);
  if (parts.length !== 2 || !parts.every(isUuid)) return null;
  const { data, error } = await supabase.rpc('create_direct_conversation', { target_user_id: parts[0] === (await currentUid()) ? parts[1] : parts[0] });
  if (error) throw error;
  return data as string;
}

async function currentUid() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || '';
}

export const db = supabase;

export const doc = (_db: any, ...segments: string[]): Ref => ({
  path: segments,
  id: segments[segments.length - 1],
  table: segments[0] || '',
});

export const collection = (_db: any, ...segments: string[]): QuerySpec => ({ path: segments, filters: [] });

export const where = (field: string, op: string, value: any): Filter => ({ field, op, value });

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({ field, direction });

export const query = (base: QuerySpec, ...parts: any[]): QuerySpec => {
  const next: QuerySpec = { ...base, filters: [...base.filters] };
  for (const part of parts) {
    if (part?.field && part?.op) next.filters.push(part);
    else if (part?.field && part?.direction) next.order = part;
  }
  return next;
};

async function rowsFor(spec: QuerySpec): Promise<any[]> {
  const [root, parentId, child] = spec.path;

  if (root === 'chats') {
    if (child === 'messages' && parentId) {
      const conversationId = await getChatId(parentId);
      if (!conversationId) return [];
      let q: any = supabase.from('messages').select('*').eq('conversation_id', conversationId);
      for (const f of spec.filters) {
        if (f.field === 'createdAt' && f.op === '==') q = q.eq('created_at', f.value);
        else if (f.field === 'senderId' && f.op === '==') q = q.eq('sender_id', f.value);
      }
      if (spec.order) q = q.order(spec.order.field === 'createdAt' ? 'created_at' : spec.order.field, { ascending: spec.order.direction === 'asc' });
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((m: any) => ({
        id: m.id,
        chatId: parentId,
        senderId: m.sender_id,
        senderName: '',
        senderAvatar: '',
        text: m.content || '',
        createdAt: m.created_at,
      }));
    }

    const { data, error } = await supabase.rpc('list_my_conversations');
    if (error) throw error;
    let rows = (data || []).map((c: any) => ({
      id: c.id,
      participants: Object.keys(c.participant_profiles || {}),
      participantProfiles: c.participant_profiles || {},
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time || '',
      lastSenderId: c.last_sender_id || '',
      unreadBy: c.unread_by || [],
      updatedAt: c.updated_at || c.created_at,
      createdAt: c.created_at,
    }));
    for (const f of spec.filters) {
      if (f.field === 'participants' && f.op === 'array-contains') rows = rows.filter((r: any) => r.participants.includes(f.value));
    }
    if (spec.order) rows.sort((a: any, b: any) => String(a[spec.order!.field] || '').localeCompare(String(b[spec.order!.field] || '')) * (spec.order!.direction === 'asc' ? 1 : -1));
    return rows;
  }

  if (root === 'users' && parentId && child === 'messages') {
    return [];
  }

  const table = root === 'users' ? 'profiles' : root;
  let q: any = supabase.from(table).select('*');
  for (const f of spec.filters) {
    const column = f.field === 'username' ? 'username' : f.field;
    if (f.op === '==' || f.op === 'eq') q = q.eq(column, f.value);
    else if (f.op === 'array-contains') q = q.contains(column, [f.value]);
  }
  if (spec.order) q = q.order(spec.order.field === 'createdAt' ? 'created_at' : spec.order.field, { ascending: spec.order.direction === 'asc' });
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((row: any) => root === 'users' ? {
    ...row,
    uid: row.id,
    displayName: row.display_name || row.username || 'Nightgram User',
    avatar: row.avatar_url || '',
    bio: row.bio || '',
  } : row);
}

async function findRef(ref: Ref) {
  const [root, id, child] = ref.path;
  if (root === 'chats') {
    if (child === 'messages' && id) return null;
    const conversationId = await getChatId(id);
    if (!conversationId) return null;
    const { data, error } = await supabase.rpc('list_my_conversations');
    if (error) throw error;
    const c = (data || []).find((row: any) => row.id === conversationId);
    if (!c) return null;
    return {
      id: c.id,
      participants: Object.keys(c.participant_profiles || {}),
      participantProfiles: c.participant_profiles || {},
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time || '',
      lastSenderId: c.last_sender_id || '',
      unreadBy: c.unread_by || [],
      updatedAt: c.updated_at || c.created_at,
      createdAt: c.created_at,
    };
  }
  if (root === 'users') {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? { ...data, uid: data.id, displayName: data.display_name || data.username || 'Nightgram User', avatar: data.avatar_url || '' } : null;
  }
  const { data, error } = await supabase.from(root).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export const getDoc = async (ref: Ref) => {
  const data = await findRef(ref);
  return { id: ref.id, exists: () => !!data, data: () => data };
};

export const getDocFromServer = getDoc;

export const getDocs = async (source: any) => {
  const spec: QuerySpec = Array.isArray(source.path) ? source : { path: [source], filters: [] };
  return wrapDocs(await rowsFor(spec));
};

export const setDoc = async (ref: Ref, value: Record<string, any>) => {
  const [root, id, child] = ref.path;
  if (root === 'chats' && !child) {
    const parts = id.split('_').filter(Boolean);
    if (parts.length !== 2) throw new Error('Invalid direct chat id');
    const me = await currentUid();
    const target = parts[0] === me ? parts[1] : parts[0];
    const { error } = await supabase.rpc('create_direct_conversation', { target_user_id: target });
    if (error) throw error;
    return;
  }
  if (root === 'users') {
    const payload = { id, username: value.username || id, display_name: value.displayName || value.username || 'Nightgram User', avatar_url: value.avatar || '', bio: value.bio || '' };
    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(root).upsert({ ...value, id });
  if (error) throw error;
};

export const addDoc = async (ref: QuerySpec, value: Record<string, any>) => {
  const [root, parentId, child] = ref.path;
  if (root === 'chats' && child === 'messages') {
    const conversationId = await getChatId(parentId);
    if (!conversationId) throw new Error('Conversation not found');
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: value.senderId,
      content: value.text || '',
    }).select('id').single();
    if (error) throw error;
    await supabase.from('conversations').update({
      last_message: value.text || '',
      last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      last_sender_id: value.senderId,
      updated_at: new Date().toISOString(),
    }).eq('id', conversationId);
    return { id: data.id, data: () => value };
  }
  const { data, error } = await supabase.from(root).insert(value).select('id').single();
  if (error) throw error;
  return { id: data.id, data: () => value };
};

export const updateDoc = async (ref: Ref, value: Record<string, any>) => {
  const [root, id, child] = ref.path;
  if (root === 'chats' && !child) {
    const conversationId = await getChatId(id);
    if (!conversationId) throw new Error('Conversation not found');
    const patch: any = {};
    if (value.lastMessage !== undefined) patch.last_message = value.lastMessage;
    if (value.lastMessageTime !== undefined) patch.last_message_time = value.lastMessageTime;
    if (value.lastSenderId !== undefined) patch.last_sender_id = value.lastSenderId;
    if (value.updatedAt !== undefined) patch.updated_at = value.updatedAt;
    if (value.unreadBy !== undefined) patch.unread_by = value.unreadBy;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('conversations').update(patch).eq('id', conversationId);
      if (error) throw error;
    }
    return;
  }
  if (root === 'users') {
    const patch: any = {};
    if (value.username !== undefined) patch.username = value.username;
    if (value.displayName !== undefined) patch.display_name = value.displayName;
    if (value.avatar !== undefined) patch.avatar_url = value.avatar;
    if (value.bio !== undefined) patch.bio = value.bio;
    const { error } = await supabase.from('profiles').update(patch).eq('id', id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(root).update(value).eq('id', id);
  if (error) throw error;
};

export const deleteDoc = async (ref: Ref) => {
  const [root, id, child] = ref.path;
  if (root === 'chats' && child === 'messages') {
    const conversationId = await getChatId(id);
    const { error } = await supabase.from('messages').delete().eq('id', child);
    if (error) throw error;
    return;
  }
  const table = root === 'users' ? 'profiles' : root;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

export const arrayUnion = (...values: any[]) => ({ __arrayOp: 'union', values });
export const arrayRemove = (...values: any[]) => ({ __arrayOp: 'remove', values });

export const onSnapshot = (source: any, next: (snapshot: any) => void, error?: (err: any) => void) => {
  const spec: QuerySpec = source.path ? source : null;
  let active = true;
  let channel: any = null;

  const refresh = async () => {
    try {
      if (!active || !spec) return;
      const rows = await rowsFor(spec);
      if (active) next(wrapDocs(rows));
    } catch (e) {
      if (active && error) error(e);
    }
  };

  refresh();

  if (spec) {
    const [root, parentId, child] = spec.path;
    if (root === 'chats' && child === 'messages' && parentId) {
      getChatId(parentId).then((conversationId) => {
        if (!conversationId || !active) return;
        channel = supabase.channel(`nightgram-messages-${conversationId}-${Math.random()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, refresh)
          .subscribe();
      }).catch((e) => error?.(e));
    } else if (root === 'chats') {
      channel = supabase.channel(`nightgram-chats-${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, refresh)
        .subscribe();
    } else {
      channel = supabase.channel(`nightgram-${root}-${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: root === 'users' ? 'profiles' : root }, refresh)
        .subscribe();
    }
  }

  return () => {
    active = false;
    if (channel) supabase.removeChannel(channel);
  };
};

export const serverTimestamp = () => new Date().toISOString();
export const Timestamp = { now: () => new Date() };
export const updateProfile = async (_user: any, values: any) => {
  const { error } = await supabase.auth.updateUser({ data: values });
  if (error) throw error;
};
export const GoogleAuthProvider = class {};
export { auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, signInWithRedirect, getRedirectResult, updatePhoneNumber };
export enum OperationType { CREATE='create', UPDATE='update', DELETE='delete', LIST='list', GET='get', WRITE='write' }
export const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => ({ error: error instanceof Error ? error.message : String(error), operationType, path, authInfo: {} });
export const testConnection = async () => { const { error } = await supabase.from('profiles').select('id').limit(1); return !error; };
export const app = supabase;
export const firebaseConfig = {};
export type DocumentReference = Ref;
export type CollectionReference = QuerySpec;
export type Query = QuerySpec;
export type DocumentSnapshot = any;
export type QuerySnapshot = any;
export type FirebaseUser = any;
