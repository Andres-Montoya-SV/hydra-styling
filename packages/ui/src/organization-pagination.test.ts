import {beforeEach,expect,it,vi} from 'vitest';
import {listOrganizationsPage} from './firebase/organizations';
import type {HydraFirebaseServices} from './firebase/services';
const mocks=vi.hoisted(()=>({getDocs:vi.fn(),getDoc:vi.fn(),startAfter:vi.fn(cursor=>({cursor}))}));
vi.mock('firebase/firestore',()=>({
  getDocs:mocks.getDocs,getDoc:mocks.getDoc,startAfter:mocks.startAfter,
  collectionGroup:vi.fn(),where:vi.fn(),limit:vi.fn(),query:vi.fn(),doc:vi.fn(),
}));
const services={auth:{currentUser:{uid:'alice',emailVerified:true}},db:{}} as unknown as HydraFirebaseServices;
const row=(i:number,status='active')=>({data:()=>({orgId:`org-${i}`,userId:'alice',role:'viewer',status})});
beforeEach(()=>{vi.clearAllMocks();mocks.getDoc.mockResolvedValue({exists:()=>true,id:'org',data:()=>({name:'Organization'})});});
it('retains the cursor even when an entire page contains suspended memberships',async()=>{
  const docs=Array.from({length:50},(_,i)=>row(i,'suspended'));
  mocks.getDocs.mockResolvedValueOnce({docs,size:50}).mockResolvedValueOnce({docs:[row(51)],size:1});
  const first=await listOrganizationsPage(services);
  expect(first.organizations).toEqual([]);expect(first.nextCursor).toBe(docs[49]);
  const second=await listOrganizationsPage(services,first.nextCursor);
  expect(mocks.startAfter).toHaveBeenCalledWith(docs[49]);
  expect(second.organizations).toHaveLength(1);expect(second.nextCursor).toBeUndefined();
});
it('rejects invalid membership and organization data',async()=>{
  mocks.getDocs.mockResolvedValue({docs:[{data:()=>({role:'super-admin'})}],size:1});
  await expect(listOrganizationsPage(services)).rejects.toThrow();
  mocks.getDocs.mockResolvedValue({docs:[row(1)],size:1});
  mocks.getDoc.mockResolvedValue({exists:()=>true,id:'org',data:()=>({name:{unexpected:true}})});
  await expect(listOrganizationsPage(services)).rejects.toThrow();
});
it('requires a verified session before issuing a query',async()=>{
  await expect(listOrganizationsPage({...services,auth:{currentUser:null}} as unknown as HydraFirebaseServices)).rejects.toThrow('verified session');
  expect(mocks.getDocs).not.toHaveBeenCalled();
});
