"use server";

import { summarizeDiaryContent } from "../lib/ai";
import {
  clearSession,
  createSession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "../lib/auth";
import { sendResetEmail } from "../lib/mailer";
import { prisma } from "../lib/prisma";
import { getSupabaseAdminClient } from "../lib/supabase";

export type DiaryEntryView = {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  content: string;
  summary: string | null;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
  comments: CommentView[];
};

export type CommentView = {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
};

export type UserView = {
  id: string;
  username: string | null;
  email: string;
  displayName: string;
  avatar: string;
};

type ActionState = {
  ok: boolean;
  message: string;
};

function mapEntry(
  entry: {
    id: string;
    authorId: string | null;
    authorName: string;
    authorAvatar: string;
    content: string;
    summary: string | null;
    createdAt: Date;
    comments: Array<{
      id: string;
      authorId: string | null;
      authorName: string;
      authorAvatar: string;
      content: string;
      createdAt: Date;
    }>;
    likes: Array<{ userId: string }>;
  },
  currentUserId: string | null,
): DiaryEntryView {
  return {
    id: entry.id,
    authorId: entry.authorId,
    authorName: entry.authorName,
    authorAvatar: entry.authorAvatar,
    content: entry.content,
    summary: entry.summary,
    likesCount: entry.likes.length,
    likedByMe:
      !!currentUserId && entry.likes.some((l) => l.userId === currentUserId),
    createdAt: entry.createdAt.toISOString(),
    comments: entry.comments.map((comment) => ({
      id: comment.id,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorAvatar: comment.authorAvatar,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    })),
  };
}

export async function registerAction(formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  if (!username || !email || !password) {
    return { ok: false, message: "用户名、邮箱和密码不能为空。" };
  }
  if (password.length < 6) {
    return { ok: false, message: "密码至少 6 位。" };
  }
  if (username.length < 2) {
    return { ok: false, message: "用户名至少 2 个字符。" };
  }
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return { ok: false, message: "用户名已被占用。" };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "该邮箱已注册。" };
  }
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: hashPassword(password),
      displayName: username || "momo",
      avatar: "🙂",
    },
  });
  await createSession(user.id);
  return { ok: true, message: "注册成功，已登录。" };
}

export async function loginAction(formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  if (!email || !password) {
    return { ok: false, message: "邮箱和密码不能为空。" };
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, message: "邮箱或密码错误。" };
  }
  await createSession(user.id);
  return { ok: true, message: "登录成功。" };
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { ok: false, message: "请输入邮箱。" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // 防止探测邮箱是否存在，统一返回成功提示
  if (!user) {
    return { ok: true, message: "如果邮箱存在，我们已发送重置邮件。" };
  }

  const cooldownWindowMs = 60 * 1000;
  const recent = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      createdAt: { gt: new Date(Date.now() - cooldownWindowMs) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return {
      ok: false,
      message: "请求过于频繁，请 1 分钟后再试。",
    };
  }

  const { randomBytes, createHash } = await import("node:crypto");
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const mail = await sendResetEmail({ to: user.email, resetLink });

  if (!mail.sent && "fallbackLink" in mail) {
    return {
      ok: true,
      message: `未配置SMTP，开发重置链接：${mail.fallbackLink}`,
    };
  }
  return { ok: true, message: "重置邮件已发送，请检查邮箱。" };
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  if (!token || !password) {
    return { ok: false, message: "参数不完整。" };
  }
  if (password.length < 6) {
    return { ok: false, message: "密码至少 6 位。" };
  }

  const { createHash } = await import("node:crypto");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!row) {
    return { ok: false, message: "重置链接无效或已过期。" };
  }

  await prisma.user.update({
    where: { id: row.userId },
    data: { passwordHash: hashPassword(password) },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } });
  return { ok: true, message: "密码已重置，请使用新密码登录。" };
}

export async function logoutAction(): Promise<ActionState> {
  await clearSession();
  return { ok: true, message: "已退出登录。" };
}

export async function updateProfileAction(
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { ok: false, message: "请先登录。" };
  }
  const displayName =
    String(formData.get("displayName") ?? "").trim() || "momo";
  const avatar = String(formData.get("avatar") ?? "").trim() || "🙂";
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { displayName, avatar },
  });
  return { ok: true, message: "资料已更新。" };
}

export async function createDiaryEntryAction(
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "请先注册或登录后再发帖。" };
  }
  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    return { ok: false, message: "内容不能为空。" };
  }
  const summary = await summarizeDiaryContent(content);
  try {
    await prisma.diaryEntry.create({
      data: {
        authorId: user.id,
        authorName: user.displayName || "momo",
        authorAvatar: user.avatar || "🙂",
        content,
        summary,
      },
    });
  } catch (error) {
    console.error("Prisma create failed:", error);
    return { ok: false, message: "Prisma 写入失败，请检查 DATABASE_URL。" };
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from("diary_entries").insert({
      author_name: user.displayName || "momo",
      author_avatar: user.avatar || "🙂",
      content,
      summary,
    });
    if (error) {
      console.warn("Supabase insert skipped:", error.message);
    }
  }

  return {
    ok: true,
    message: summary ? `保存成功，AI总结：${summary}` : "发布成功。",
  };
}

export async function searchDiaryEntriesAction(
  keyword: string,
): Promise<DiaryEntryView[]> {
  const currentUser = await getCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const q = keyword.trim();

  const entries = await prisma.diaryEntry.findMany({
    where: q
      ? {
          OR: [
            { content: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
            { authorName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      likes: true,
    },
  });

  return entries.map((entry) => mapEntry(entry, currentUserId));
}

export async function createCommentAction(
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "请先登录后再评论。" };
  }
  const entryId = String(formData.get("entryId") ?? "").trim();
  const content = String(formData.get("commentContent") ?? "").trim();
  if (!entryId || !content) {
    return { ok: false, message: "评论内容不能为空。" };
  }
  try {
    await prisma.comment.create({
      data: {
        entryId,
        content,
        authorId: user.id,
        authorName: user.displayName || "momo",
        authorAvatar: user.avatar || "🙂",
      },
    });
    return { ok: true, message: "评论成功。" };
  } catch (error) {
    console.error("Comment create failed:", error);
    return { ok: false, message: "评论失败，请稍后重试。" };
  }
}

export async function toggleLikeAction(entryId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "请先登录后再点赞。" };
  }
  if (!entryId) {
    return { ok: false, message: "帖子不存在。" };
  }
  const existing = await prisma.like.findUnique({
    where: { userId_entryId: { userId: user.id, entryId } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { ok: true, message: "已取消点赞。" };
  }
  await prisma.like.create({ data: { userId: user.id, entryId } });
  return { ok: true, message: "点赞成功。" };
}

export async function updateDiaryEntryAction(
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "请先登录。" };
  }
  const entryId = String(formData.get("entryId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!entryId || !content) {
    return { ok: false, message: "帖子内容不能为空。" };
  }
  const entry = await prisma.diaryEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.authorId !== user.id) {
    return { ok: false, message: "你没有权限编辑该帖子。" };
  }
  await prisma.diaryEntry.update({ where: { id: entryId }, data: { content } });
  return { ok: true, message: "帖子已更新。" };
}

export async function deleteDiaryEntryAction(
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "请先登录。" };
  }
  const entryId = String(formData.get("entryId") ?? "").trim();
  if (!entryId) {
    return { ok: false, message: "帖子不存在。" };
  }
  const entry = await prisma.diaryEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.authorId !== user.id) {
    return { ok: false, message: "你没有权限删除该帖子。" };
  }
  await prisma.diaryEntry.delete({ where: { id: entryId } });
  return { ok: true, message: "帖子已删除。" };
}
