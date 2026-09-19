/** Resolves only after the server confirms completed cleanup (HTTP 204). */
export async function requestAccountDeletion(endpoint: string, idToken: string, options: {
  signal?: AbortSignal;
  allowLocalhost?: boolean;
} = {}): Promise<void> {
  const url = new URL(endpoint);
  const local = options.allowLocalhost && ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.hash || url.search)
    throw new Error('Account deletion requires a secure endpoint without credentials, query or fragment.');
  if (!idToken.trim()) throw new Error('A fresh identity token is required.');
  const timeout = AbortSignal.timeout(30_000);
  const response = await fetch(url, {
    method: 'DELETE', headers: {Authorization: `Bearer ${idToken}`},
    redirect: 'error', credentials: 'omit', cache: 'no-store',
    signal: options.signal ? AbortSignal.any([options.signal,timeout]) : timeout,
  });
  if (response.status !== 204) throw new Error('Account deletion was not completed.');
}
