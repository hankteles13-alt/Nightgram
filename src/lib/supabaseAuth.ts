import { supabase } from './supabase';
export const auth = supabase.auth;
export const onAuthStateChanged = (_auth: typeof supabase.auth, callback: (user: any | null) => void) => { let active=true; supabase.auth.getSession().then(({data})=>{if(active) callback(data.session?.user??null)}); const {data:subscription}=supabase.auth.onAuthStateChange((_event,session)=>{if(active) callback(session?.user??null)}); return ()=>{active=false;subscription.subscription.unsubscribe()}; };
export const signOut = async (_auth: typeof supabase.auth) => supabase.auth.signOut();
export const createUserWithEmailAndPassword = async (_auth: typeof supabase.auth,email:string,password:string)=>{const {data,error}=await supabase.auth.signUp({email,password});if(error)throw error;if(!data.user)throw new Error('Account creation did not return a user.');return {user:data.user};};
export const signInWithEmailAndPassword = async (_auth: typeof supabase.auth,email:string,password:string)=>{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;if(!data.user)throw new Error('Sign-in did not return a user.');return {user:data.user};};
export const signInWithPopup = async ()=>{const {data,error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});if(error)throw error;return {user:null,data};};
export const signInWithRedirect = async ()=>{const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});if(error)throw error;};
export const getRedirectResult = async ()=>{const {data}=await supabase.auth.getSession();return data.session?.user?{user:data.session.user}:null;};
