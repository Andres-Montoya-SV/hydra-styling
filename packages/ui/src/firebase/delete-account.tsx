import {useState,type FormEvent} from 'react';
import {EmailAuthProvider,reauthenticateWithCredential} from 'firebase/auth';
import {useHydraAuth} from './auth';
import {firebaseMessage} from './services';
import {Field,Input} from '../components/field';
import {PasswordInput} from '../components/extended';
import {Button} from '../components/button';
import {Alert} from '../components/feedback';

/** Backend must verify the fresh token, handle ownership, erase data and delete Auth. */
export function DeleteAccountForm({onDeleteAccount}:{onDeleteAccount?:(idToken:string)=>Promise<void>}) {
  const {user}=useHydraAuth();
  return <DeleteAccountFields key={user?.uid} onDeleteAccount={onDeleteAccount}/>;
}
function DeleteAccountFields({onDeleteAccount}:{onDeleteAccount?:(idToken:string)=>Promise<void>}) {
  const {user}=useHydraAuth();
  const [password,setPassword]=useState(''); const [confirmation,setConfirmation]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [done,setDone]=useState(false);
  const supported=user?.providerData.some(p=>p.providerId==='password');
  async function submit(event:FormEvent) {
    event.preventDefault();
    if(!user?.email||!supported||!onDeleteAccount||busy||confirmation!=='DELETE')return;
    setBusy(true);setError('');
    try {
      await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));
      const token=await user.getIdToken(true);
      await onDeleteAccount(token);
      setDone(true);
    } catch(e) {setError(firebaseMessage(e));}
    finally {setBusy(false);setPassword('');}
  }
  if(done)return <Alert tone="success">Account deletion completed.</Alert>;
  return <form onSubmit={submit} className="grid gap-4" aria-label="Delete account" aria-busy={busy}>
    <Alert tone="danger" title="Delete your account">This action is permanent. Organization ownership and retained evidence must be handled before deletion.</Alert>
    {!onDeleteAccount&&<p role="status">Account deletion is unavailable until your application connects its secure deletion service.</p>}
    {!supported&&<p role="status">Sign in with a password account to use this form. Other providers require their own reauthentication flow.</p>}
    <Field label="Current password"><PasswordInput autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required disabled={busy||!supported||!onDeleteAccount}/></Field>
    <Field label="Type DELETE to confirm"><Input value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off" required disabled={busy||!onDeleteAccount}/></Field>
    {error&&<Alert tone="danger">{error}</Alert>}
    <Button variant="danger" type="submit" disabled={busy||!supported||!onDeleteAccount||confirmation!=='DELETE'}>{busy?'Deleting account…':'Permanently delete account'}</Button>
  </form>;
}
