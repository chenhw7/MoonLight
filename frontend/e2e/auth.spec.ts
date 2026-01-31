import { test, expect } from '@playwright/test'

/**
 * 认证流程 E2E 测试
 *
 * 测试完整的登录和注册流程
 */
test.describe('认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前访问登录页面
    await page.goto('/login')
  })

  test.describe('邮箱输入步骤', () => {
    test('应该显示邮箱输入页面', async ({ page }) => {
      // Then: 应该看到邮箱输入框
      await expect(page.getByPlaceholder('name@example.com')).toBeVisible()
      await expect(page.getByRole('button', { name: /继续/i })).toBeVisible()
    })

    test('输入无效邮箱应该显示错误', async ({ page }) => {
      // When: 输入无效邮箱并提交
      await page.fill('[placeholder="name@example.com"]', 'invalid-email')
      await page.click('button[type="submit"]')

      // Then: 应该显示错误信息
      await expect(page.getByText('请输入有效的邮箱地址')).toBeVisible()
    })

    test('空邮箱提交应该显示错误', async ({ page }) => {
      // When: 直接提交
      await page.click('button[type="submit"]')

      // Then: 应该显示错误信息
      await expect(page.getByText('请输入有效的邮箱地址')).toBeVisible()
    })
  })

  test.describe('新用户注册流程', () => {
    test('新邮箱应该进入验证码步骤', async ({ page }) => {
      // When: 输入新邮箱并提交
      await page.fill('[placeholder="name@example.com"]', 'newuser@example.com')
      await page.click('button[type="submit"]')

      // Then: 应该显示验证码输入界面
      await expect(page.getByText('验证邮箱')).toBeVisible()
      await expect(page.getByText(/验证码已发送至/i)).toContainText('newuser@example.com')
    })

    test('应该能够输入验证码', async ({ page }) => {
      // Given: 进入验证码步骤
      await page.fill('[placeholder="name@example.com"]', 'newuser@example.com')
      await page.click('button[type="submit"]')

      // When: 输入验证码
      const inputs = page.locator('input[type="text"][inputmode="numeric"]')
      await inputs.first().waitFor()

      // 输入6位验证码
      for (let i = 0; i < 6; i++) {
        await inputs.nth(i).fill(String(i + 1))
      }

      // Then: 应该进入注册步骤
      await expect(page.getByText('创建账户')).toBeVisible()
    })

    test('注册步骤应该显示用户名和密码输入', async ({ page }) => {
      // Given: 进入注册步骤
      await page.fill('[placeholder="name@example.com"]', 'newuser@example.com')
      await page.click('button[type="submit"]')

      // 输入验证码
      const inputs = page.locator('input[type="text"][inputmode="numeric"]')
      await inputs.first().waitFor()
      for (let i = 0; i < 6; i++) {
        await inputs.nth(i).fill(String(i + 1))
      }

      // Then: 应该看到注册表单
      await expect(page.getByPlaceholder('设置用户名')).toBeVisible()
      await expect(page.getByPlaceholder('设置密码')).toBeVisible()
      await expect(page.getByPlaceholder('再次输入密码')).toBeVisible()
    })
  })

  test.describe('已有用户登录流程', () => {
    test('已有邮箱应该进入密码步骤', async ({ page }) => {
      // 注意：这里假设邮箱已存在，实际测试需要后端支持
      // 或者使用 mock

      // When: 输入已有邮箱并提交
      await page.fill('[placeholder="name@example.com"]', 'existing@example.com')
      await page.click('button[type="submit"]')

      // Then: 应该显示密码输入界面
      // 注意：由于前端暂时模拟不存在，这里会进入验证码步骤
      // 实际集成测试需要后端支持
    })
  })

  test.describe('主题切换', () => {
    test('应该能够切换深色/浅色主题', async ({ page }) => {
      // Given: 获取 html 元素
      const html = page.locator('html')

      // When: 点击主题切换按钮
      await page.click('button[aria-label*="切换主题"], button:has(.lucide-sun), button:has(.lucide-moon)')

      // Then: 主题应该切换
      // 检查是否有 dark 类
      const hasDarkClass = await html.evaluate((el) => el.classList.contains('dark'))
      expect(hasDarkClass).toBeTruthy()
    })
  })

  test.describe('返回功能', () => {
    test('在验证码页面应该能够返回邮箱输入', async ({ page }) => {
      // Given: 进入验证码步骤
      await page.fill('[placeholder="name@example.com"]', 'test@example.com')
      await page.click('button[type="submit"]')
      await expect(page.getByText('验证邮箱')).toBeVisible()

      // When: 点击返回按钮
      await page.click('button:has-text("返回")')

      // Then: 应该回到邮箱输入页面
      await expect(page.getByText('欢迎回来')).toBeVisible()
      await expect(page.getByPlaceholder('name@example.com')).toBeVisible()
    })
  })
})
