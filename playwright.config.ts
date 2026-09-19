import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'],['html',{open:'never'}]],
  use: {baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}},
  projects: [
    {name:'desktop',use:{...devices['Desktop Chrome']}},
    {name:'mobile-reduced-motion',use:{...devices['Desktop Chrome'],viewport:{width:390,height:844},reducedMotion:'reduce'}},
  ],
  webServer: [
    {command:'npx --no-install vite preview apps/showcase --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:false},
    {command:'npx --no-install vite packages/ui/starter --host 127.0.0.1 --port 4174 --strictPort',url:'http://127.0.0.1:4174',env:{VITE_FIREBASE_EMULATORS:'true'},timeout:120_000,reuseExistingServer:false},
  ],
});
