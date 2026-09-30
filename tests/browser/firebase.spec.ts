import {randomUUID} from 'node:crypto';
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('real emulator registration, permission gate, profile persistence and sign-in',async({page,request})=>{
  const email=`browser-${randomUUID()}@example.com`;
  const password='Hydra-test-password-42';
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button',{name:'sign up',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByLabel('Confirm password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByText('Verify your email before accessing organizations.')).toBeVisible();
  await expect(page.getByLabel('Organization',{exact:true})).toHaveCount(0);
  await page.getByText('Profile and account security',{exact:true}).click();
  await page.getByLabel('Display name',{exact:true}).fill('Browser Analyst');
  await page.getByLabel('Username',{exact:true}).fill('browser.analyst');
  await page.getByRole('button',{name:'Save profile',exact:true}).click();
  await expect(page.getByText('Profile saved.',{exact:true})).toBeVisible();
  // Deletion must fail closed until the consumer supplies a real cleanup service.
  await expect(page.getByRole('button',{name:'Permanently delete account'})).toBeDisabled();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByLabel('Organization',{exact:true})).toHaveCount(0);
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByText('Verify your email before accessing organizations.')).toBeVisible();
  // Use the emulator's actual verification link; no production admin credential.
  const codes=await request.get('http://127.0.0.1:9099/emulator/v1/projects/demo-hydra-ui/oobCodes');
  const code=(await codes.json()).oobCodes.find((item:{email:string;requestType:string})=>item.email===email&&item.requestType==='VERIFY_EMAIL');
  expect(code).toBeTruthy();
  const verified=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key',{data:{oobCode:code.oobCode}});
  expect(verified.ok()).toBe(true);
  await page.getByRole('button',{name:'I verified my email'}).click();
  await expect(page.getByLabel('Organization',{exact:true})).toBeVisible();
  await page.getByLabel('New organization',{exact:true}).fill('Browser organization');
  await page.getByRole('button',{name:'Create organization',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Organization members'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Grant or update access'})).toBeVisible();
  await page.getByText('Profile and account security',{exact:true}).click();
  await expect(page.getByLabel('Display name',{exact:true})).toHaveValue('Browser Analyst');
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
});
