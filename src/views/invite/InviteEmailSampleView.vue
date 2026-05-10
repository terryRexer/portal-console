<script setup lang="ts">
import { useRouter } from 'vue-router'
import PortalPageTitle from '@/components/PortalPageTitle.vue'

/** F3 · 邀请邮件正文演示（占位符与 PRD 一致） */
const router = useRouter()
const systemShort = 'MarsWallet'
const tenantName = '演示企业有限公司'
const customerDisplayName = '演示企业有限公司'
const inviteeName = '张三'
const activateLinkDemo = 'https://portal.example.com/invite/activate?token=…'
</script>

<template>
  <div class="invite-email-sample-page">
    <div class="invite-email-sample-card">
      <PortalPageTitle>邀请邮件（演示模板）</PortalPageTitle>
      <p class="portal-page-sub">
        对应需求 <strong>F3</strong>：真实环境由邮件服务发送；本页仅展示主题与正文结构。
      </p>

      <a-divider orientation="left">邮件主题</a-divider>
      <a-typography-paragraph copyable class="invite-email-block">
        【{{ systemShort }}】您已被邀请加入 {{ tenantName }} 工作台
      </a-typography-paragraph>

      <a-divider orientation="left">邮件正文</a-divider>
      <div class="invite-email-body">
        <p>尊敬的{{ inviteeName }}：</p>
        <p>
          {{ customerDisplayName }} 管理员邀请您加入 Marswallex 工作台，加入后您可使用企业内部工作台及相关权限服务。
        </p>
        <p>请点击下方链接，完成账号激活并设置个人登录密码：</p>
        <p>
          <a-typography-link>{{ activateLinkDemo }}</a-typography-link>
        </p>

        <a-typography-title :level="4" class="portal-heading-h4 invite-email-hint-heading">
          温馨提示
        </a-typography-title>
        <ul class="invite-email-hint-list">
          <li>本邀请链接有效期为 24 小时，过期将自动失效，失效后可联系管理员重新发起邀请；</li>
          <li>若您从未注册过账号，可在页面自主设置登录密码，完成账号激活；</li>
          <li>如非本人操作，请忽略本邮件，您的邮箱不会被绑定任何企业信息；</li>
          <li>本邮件为系统自动发送，请勿直接回复。</li>
        </ul>
      </div>

      <a-divider />
      <p class="invite-email-footer-note">
        激活页路由（演示）：<code>/invite/activate?token=…</code><br />
        验收专用 query：<code>token=demo-invalid-token</code>（校验失败提示）、
        <code>token=demo-expired-token</code>（过期提示）。
      </p>
      <a-button type="primary" @click="router.push('/settings/user-management')">返回企业管理-本期新增</a-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.invite-email-sample-page {
  min-height: 100vh;
  padding: 48px 24px;
  background: linear-gradient(160deg, #f5f0ff 0%, #f0f5ff 40%, #fafafa 100%);
}

.invite-email-sample-card {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.invite-email-block {
  margin-bottom: 0;
  font-size: 15px;
}

.invite-email-body {
  font-size: 14px;
  line-height: 1.75;
  color: rgba(0, 0, 0, 0.88);

  p {
    margin: 0 0 12px;
  }
}

.invite-email-hint-heading {
  margin-top: 20px;
}

.invite-email-hint-list {
  margin: 8px 0 0;
  padding-left: 20px;
  color: rgba(0, 0, 0, 0.65);
}

.invite-email-footer-note {
  margin: 0 0 16px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.7;

  code {
    font-size: 12px;
  }
}
</style>
