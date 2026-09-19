import {useState} from 'react';
import {Alert,Badge,Button,Card,CardContent,Field,HydraMark,Input,Motion,PasswordInput,SiteLoader} from '@hydra-security/ui';

export default function AccountScreen(){
  const [mode,setMode]=useState('login'); const [message,setMessage]=useState('');const [loading,setLoading]=useState(false);
  return <div className="mx-auto grid max-w-5xl gap-8 py-8 lg:grid-cols-2">
    <section className="self-center space-y-5"><HydraMark wordmark className="w-52"/><Badge severity="info">Your surface. Your control.</Badge><h2 className="font-display text-4xl leading-tight">Clarity in<br/>the depths.</h2><p className="max-w-sm text-hydra-muted">A calm workspace for the signals that matter. Manage your identity and return to your security operations.</p><Alert title="Interface preview">These forms do not create or modify accounts. The Firebase starter provides real login, registration and profile editing.</Alert><Button variant="ghost" onClick={()=>setLoading(v=>!v)}>{loading?'Hide loader preview':'Preview site loader'}</Button>{loading&&<SiteLoader/>}</section>
    <Card><CardContent><nav aria-label="Account screens" className="mb-6 flex flex-wrap gap-2">{['login','register','edit','delete'].map(value=><Button key={value} variant={mode===value?'primary':'ghost'} size="sm" aria-pressed={mode===value} onClick={()=>{setMode(value);setMessage('');}}>{value==='edit'?'Edit profile':value==='delete'?'Delete account':value==='register'?'Register':'Log in'}</Button>)}</nav>
      <Motion key={mode}><form className="grid gap-5" onSubmit={e=>{e.preventDefault();e.currentTarget.reset();setMessage('Preview only. No account or data was changed.');}}>
        <h2 className="font-display text-2xl">{mode==='login'?'Welcome back':mode==='register'?'Join Hydra':mode==='edit'?'Your profile':'Leave Hydra'}</h2>
        {mode==='delete'?<><Alert tone="danger">Permanent deletion requires reauthentication and a secure backend cleanup workflow.</Alert><Field label="Type DELETE to confirm"><Input required pattern="DELETE" autoComplete="off"/></Field></>:<>
          {(mode==='register'||mode==='edit')&&<Field label="Display name"><Input required autoComplete="name" defaultValue={mode==='edit'?'Hydra Analyst':undefined}/></Field>}
          {mode==='edit'&&<Field label="Username"><Input required defaultValue="hydra.analyst" autoComplete="username"/></Field>}
          <Field label="Email"><Input type="email" required autoComplete="email" defaultValue={mode==='edit'?'analyst@example.com':undefined} readOnly={mode==='edit'}/></Field>
        </>}
        {mode!=='edit'&&<Field label={mode==='delete'?'Current password':'Password'}><PasswordInput required autoComplete={mode==='register'?'new-password':'current-password'} minLength={mode==='register'?12:undefined}/></Field>}
        <Button type="submit" variant={mode==='delete'?'danger':'primary'}>{mode==='login'?'Log in':mode==='register'?'Create account':mode==='edit'?'Save profile':'Confirm deletion'} · Preview</Button>
        {message&&<Alert>{message}</Alert>}
      </form></Motion>
    </CardContent></Card>
  </div>;
}
