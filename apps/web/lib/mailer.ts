import nodemailer from "nodemailer";

type SendResetEmailArgs = {
  to: string;
  resetLink: string;
};

function hasSmtpConfig() {
  return (
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS &&
    !!process.env.SMTP_FROM
  );
}

export async function sendResetEmail({ to, resetLink }: SendResetEmailArgs) {
  if (!hasSmtpConfig()) {
    console.warn("SMTP not configured; reset link:", resetLink);
    return { sent: false, fallbackLink: resetLink };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "梨树贴吧 - 重置密码",
    text: `点击链接重置密码：${resetLink}\n此链接 15 分钟内有效。`,
    html: `
      <div style="margin:0;padding:24px;background:#fcfaf5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Noto Sans CJK SC',sans-serif;color:#18181b;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
          <div style="padding:20px 24px;background:#f5deab;">
            <h1 style="margin:0;font-size:22px;line-height:1.3;color:#18181b;">梨树贴吧</h1>
            <p style="margin:6px 0 0 0;font-size:13px;color:#3f3f46;">重置你的登录密码</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 10px 0;font-size:14px;color:#3f3f46;">
              你好，你刚刚申请了密码重置。
            </p>
            <p style="margin:0 0 18px 0;font-size:14px;color:#3f3f46;">
              点击下方按钮继续，此链接 <strong>15 分钟</strong> 内有效。
            </p>
            <a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;">
              立即重置密码
            </a>
            <p style="margin:18px 0 0 0;font-size:12px;color:#71717a;word-break:break-all;">
              如果按钮无法点击，可复制以下链接到浏览器：<br />${resetLink}
            </p>
            <p style="margin:14px 0 0 0;font-size:12px;color:#a1a1aa;">
              如果不是你本人操作，请忽略本邮件。
            </p>
          </div>
        </div>
      </div>
    `,
  });

  return { sent: true as const };
}
