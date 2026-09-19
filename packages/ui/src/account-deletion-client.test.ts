import {afterEach,expect,it,vi} from 'vitest';
import {requestAccountDeletion} from './firebase/account-deletion-client';
afterEach(()=>vi.unstubAllGlobals());
it('sends identity only in the authorization header and accepts completed cleanup',async()=>{
  const fetcher=vi.fn().mockResolvedValue({status:204});vi.stubGlobal('fetch',fetcher);
  await requestAccountDeletion('https://api.example.com/account','fresh-token');
  expect(fetcher).toHaveBeenCalledWith(new URL('https://api.example.com/account'),expect.objectContaining({method:'DELETE',headers:{Authorization:'Bearer fresh-token'},redirect:'error',credentials:'omit',cache:'no-store'}));
});
it.each([200,202,301,401,403,409,429,500])('does not report completed cleanup for HTTP %i',async status=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({status}));
  await expect(requestAccountDeletion('https://api.example.com/account','token')).rejects.toThrow('not completed');
});
it.each(['http://api.example.com/account','https://user:password@api.example.com/account','https://api.example.com/account?token=secret','https://api.example.com/account#fragment'])('rejects unsafe endpoint %s without sending credentials',async endpoint=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  await expect(requestAccountDeletion(endpoint,'token')).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();
});
it('propagates cancellation without reporting success',async()=>{
  const controller=new AbortController();controller.abort();
  vi.stubGlobal('fetch',vi.fn((_url,options)=>{options.signal.throwIfAborted();}));
  await expect(requestAccountDeletion('https://api.example.com/account','token',{signal:controller.signal})).rejects.toThrow();
});
