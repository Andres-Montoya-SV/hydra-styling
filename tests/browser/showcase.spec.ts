import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('account previews are usable, responsive and accessible in both themes',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/#account');
  await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible();
  for(const theme of ['nocturne','parchment']) {
    if(theme==='parchment')await page.getByRole('button',{name:'Use light theme'}).click();
    for(const [button,heading] of [['Log in','Welcome back'],['Register','Join Hydra'],['Edit profile','Your profile'],['Delete account','Leave Hydra']]) {
      await page.getByRole('navigation',{name:'Account screens'}).getByRole('button',{name:button,exact:true}).click();
      await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
      const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('forms submit by keyboard without persisting preview credentials',async({page})=>{
  await page.goto('/#account');
  await page.getByLabel('Email',{exact:true}).fill('analyst@example.com');
  await page.getByLabel('Password',{exact:true}).fill('preview-password');
  await page.getByLabel('Password',{exact:true}).press('Enter');
  await expect(page.getByText('Preview only. No account or data was changed.')).toBeVisible();
  await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
  expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toContain('preview-password');
  await page.getByRole('button',{name:'Preview site loader'}).click();
  await expect(page.getByRole('status').filter({hasText:'Loading Hydra…'})).toBeVisible();
});

test('reduced motion overrides every nested provider',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#account');
  await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible();
  await expect(page.locator('[data-hydra-motion="on"]')).toHaveCount(0);
});

test('a failed lazy chunk offers explicit recovery instead of a blank page',async({page})=>{
  await page.route('**/assets/App-*.js',route=>route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'This view could not load'})).toBeVisible();
  await page.unroute('**/assets/App-*.js');
  await page.getByRole('button',{name:'Reload application'}).click();
  await expect(page.getByRole('alert').filter({hasText:'This view could not load'})).toHaveCount(0);
  await expect(page.getByRole('main')).toBeVisible();
});


test('mobile navigation keeps keyboard focus inside and restores it on Escape',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#account');
  const open=page.getByRole('button',{name:'Open menu',exact:true});
  await open.click();
  await expect(page.getByRole('button',{name:'Close menu',exact:true})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:'Settings',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  await expect(open).toHaveAttribute('aria-expanded','false');
});
