"use client";

import { useRouter } from "next/navigation";
import { useEffect, useActionState, useMemo, useState, useTransition } from "react";

import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Toaster, useToast } from "../components/ui/toaster";
import { Loader } from "../components/ui/loader";
import { UserDropdown } from "../components/auth/user-dropdown";
import { LoginDialog } from "../components/auth/login-dialog";
import { AuthGuardModal } from "../components/auth/auth-guard-modal";
import {
  type DiaryEntryView,
  type UserView,
  createCommentAction,
  createDiaryEntryAction,
  deleteDiaryEntryAction,
  loginAction,
  logoutAction,
  registerAction,
  requestPasswordResetAction,
  searchDiaryEntriesAction,
  toggleLikeAction,
  updateDiaryEntryAction,
  updateProfileAction,
} from "./actions";

type Props = {
  initialEntries: DiaryEntryView[];
  currentUser: UserView | null;
};

const initialState = { ok: false, message: "" };
const presetAvatars = ["🙂", "😎", "🌟", "🐱", "🫶", "🍐"];

function formatDay(dateIso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date(dateIso));
}

function hotScore(entry: DiaryEntryView) {
  const hours = Math.max(
    1,
    (Date.now() - new Date(entry.createdAt).getTime()) / 36_000_00,
  );
  return entry.likesCount * 2 + entry.comments.length - hours * 0.1;
}

function Avatar({ value }: { value: string }) {
  const isUrl = /^https?:\/\//i.test(value);
  if (isUrl) {
    return (
      <img
        src={value}
        alt="avatar"
        className="h-10 w-10 rounded-full border border-zinc-200 object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e6cf] text-xl">
      {value || "🙂"}
    </div>
  );
}

function IconSearch() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <path d="M20 20l-4-4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DiaryAppContent({ initialEntries, currentUser }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"latest" | "hot">("latest");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<DiaryEntryView[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [profileName, setProfileName] = useState(currentUser?.displayName ?? "momo");
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar ?? "🙂");

  const [isSearching, startSearchTransition] = useTransition();
  const [isCommentSubmitting, startCommentTransition] = useTransition();
  const [isLikePending, startLikeTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Auth dialog state
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginDialogMode, setLoginDialogMode] = useState<"login" | "register">("login");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Auth guard modal state
  const [authGuardOpen, setAuthGuardOpen] = useState(false);
  const [authGuardAction, setAuthGuardAction] = useState<string>("post");

  const [postState, postAction, isPosting] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await createDiaryEntryAction(formData);
      if (result.ok) {
        toast.success("发布成功");
        setIsEditorOpen(false);
        router.refresh();
      } else {
        toast.error("发布失败", result.message);
      }
      return result;
    },
    initialState,
  );

  const [authState, authAction, isAuthPending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result =
        authMode === "register"
          ? await registerAction(formData)
          : await loginAction(formData);
      if (result.ok) {
        setLoginDialogOpen(false);
        toast.success(authMode === "register" ? "注册成功" : "登录成功");
        router.refresh();
      } else {
        toast.error(authMode === "register" ? "注册失败" : "登录失败", result.message);
      }
      return result;
    },
    initialState,
  );

  const [profileState, profileAction, isProfileSaving] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await updateProfileAction(formData);
      if (result.ok) {
        setIsProfileOpen(false);
        toast.success("资料已更新");
        router.refresh();
      } else {
        toast.error("更新失败", result.message);
      }
      return result;
    },
    initialState,
  );

  const [forgotState, forgotAction, isForgotPending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await requestPasswordResetAction(formData);
      if (result.ok) {
        toast.success("邮件已发送", "请检查您的邮箱");
      } else {
        toast.error("发送失败", result.message);
      }
      return result;
    },
    initialState,
  );

  const shownEntries = useMemo(() => {
    const base = isSearchOpen ? searchResults : initialEntries;
    if (sortMode === "hot") {
      return [...base].sort((a, b) => hotScore(b) - hotScore(a));
    }
    return base;
  }, [initialEntries, isSearchOpen, searchResults, sortMode]);

  const handleSearch = () => {
    startSearchTransition(async () => {
      const rows = await searchDiaryEntriesAction(searchKeyword);
      setSearchResults(rows);
      toast.success(`搜索完成，共 ${rows.length} 条结果`);
    });
  };

  const handleCommentSubmit = (entryId: string) => {
    if (!currentUser) {
      setAuthGuardAction("comment");
      setAuthGuardOpen(true);
      return;
    }
    const text = (commentDrafts[entryId] ?? "").trim();
    if (!text) {
      return;
    }
    startCommentTransition(async () => {
      const fd = new FormData();
      fd.set("entryId", entryId);
      fd.set("commentContent", text);
      const result = await createCommentAction(fd);
      if (result.ok) {
        setCommentDrafts((prev) => ({ ...prev, [entryId]: "" }));
        toast.success("评论成功");
        router.refresh();
      } else {
        toast.error("评论失败", result.message);
      }
    });
  };

  const handleToggleLike = (entryId: string) => {
    if (!currentUser) {
      setAuthGuardAction("like");
      setAuthGuardOpen(true);
      return;
    }
    startLikeTransition(async () => {
      const result = await toggleLikeAction(entryId);
      router.refresh();
    });
  };

  const handleDeletePost = async (entryId: string) => {
    if (!window.confirm("确认删除这条帖子吗？")) {
      return;
    }
    setIsDeleting(true);
    try {
      const fd = new FormData();
      fd.set("entryId", entryId);
      const result = await deleteDiaryEntryAction(fd);
      if (result.ok) {
        toast.success("删除成功");
        router.refresh();
      } else {
        toast.error("删除失败", result.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntryId || !editingContent.trim()) {
      return;
    }
    setIsSavingEdit(true);
    try {
      const fd = new FormData();
      fd.set("entryId", editingEntryId);
      fd.set("content", editingContent.trim());
      const result = await updateDiaryEntryAction(fd);
      if (result.ok) {
        setEditingEntryId(null);
        setEditingContent("");
        toast.success("编辑成功");
        router.refresh();
      } else {
        toast.error("编辑失败", result.message);
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    toast.success("已退出登录");
    router.refresh();
  };

  const handleOpenLoginDialog = (mode: "login" | "register") => {
    setAuthMode(mode);
    setLoginDialogMode(mode);
    setLoginDialogOpen(true);
  };

  const handleAuthGuardLoginClick = () => {
    setAuthGuardOpen(false);
    setAuthMode("login");
    setLoginDialogMode("login");
    setLoginDialogOpen(true);
  };

  const handlePostClick = () => {
    if (!currentUser) {
      setAuthGuardAction("post");
      setAuthGuardOpen(true);
      return;
    }
    setIsEditorOpen((v) => !v);
  };

  return (
    <div className="min-h-screen bg-[#fcfaf5]">
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-4 md:px-6">
        <header className="sticky top-0 z-20 mb-4 border-b border-zinc-200/80 bg-[#fcfaf5]/95 pb-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight">梨树贴吧</h1>
            <div className="flex items-center gap-2 text-zinc-700">
              <button
                type="button"
                className="rounded-lg p-1 hover:bg-zinc-100"
                onClick={() => {
                  const next = !isSearchOpen;
                  setIsSearchOpen(next);
                  if (next) {
                    setSearchResults(initialEntries.slice(0, 30));
                  }
                }}
                aria-label="全局搜索"
              >
                <IconSearch />
              </button>
              <UserDropdown
                currentUser={currentUser}
                onLoginClick={() => handleOpenLoginDialog("login")}
                onRegisterClick={() => handleOpenLoginDialog("register")}
                onProfileClick={() => setIsProfileOpen(true)}
                onLogout={handleLogout}
              />
              <Button
                type="button"
                onClick={handlePostClick}
                className="rounded-xl bg-[#f5deab] px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-[#ecd090]"
              >
                {isEditorOpen ? "收起" : "发帖"}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortMode("latest")}
              className={`rounded-full px-3 py-1 text-sm ${
                sortMode === "latest"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700"
              }`}
            >
              最新
            </button>
            <button
              type="button"
              onClick={() => setSortMode("hot")}
              className={`rounded-full px-3 py-1 text-sm ${
                sortMode === "hot"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700"
              }`}
            >
              最热
            </button>
          </div>

          {isSearchOpen ? (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                    if (e.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                  placeholder="搜索内容/作者/AI总结..."
                  className="h-10"
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  loading={isSearching}
                  className="h-10"
                >
                  搜索
                </Button>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {isSearching ? "搜索中..." : `共 ${shownEntries.length} 条结果`}
              </p>
            </div>
          ) : null}
        </header>

        {isEditorOpen ? (
          <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <form action={postAction} className="space-y-3">
              <p className="text-base font-semibold text-zinc-700">
                发布新帖子
              </p>
              <Textarea
                name="content"
                placeholder="写点什么，发到梨树贴吧..."
                className="min-h-36 rounded-xl border-zinc-200 bg-white text-base"
              />
              <div className="flex items-center justify-between">
                <p
                  className={
                    postState.ok
                      ? "text-sm text-green-600"
                      : "text-sm text-red-600"
                  }
                >
                  {postState.message || "点击「发帖」才会发布"}
                </p>
                <Button
                  type="submit"
                  loading={isPosting}
                  className="rounded-xl bg-[#f5deab] px-5 text-zinc-900 hover:bg-[#ecd090]"
                >
                  发帖
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <button
            type="button"
            onClick={handlePostClick}
            className="mb-4 w-full rounded-2xl border border-dashed border-zinc-300 bg-[#f7f1e6] px-4 py-5 text-left text-zinc-600"
          >
            点这里发一条新帖子...
          </button>
        )}

        <section className="space-y-4">
          {shownEntries.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
              {isSearchOpen
                ? "未搜索到匹配内容，请换个关键词。"
                : "还没有帖子，先发第一条吧。"}
            </div>
          ) : (
            shownEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar value={entry.authorAvatar} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {entry.authorName || "momo"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDay(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      loading={isLikePending}
                      onClick={() => handleToggleLike(entry.id)}
                      size="sm"
                      className={`rounded-lg ${
                        entry.likedByMe
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {entry.likedByMe ? "已赞" : "点赞"} {entry.likesCount}
                    </Button>
                    {currentUser?.id === entry.authorId ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setEditingEntryId(entry.id);
                            setEditingContent(entry.content);
                          }}
                          className="rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        >
                          编辑
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          loading={isDeleting}
                          onClick={() => handleDeletePost(entry.id)}
                          className="rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        >
                          删除
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                {editingEntryId === entry.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-24 rounded-xl border-zinc-200 bg-white text-base"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        loading={isSavingEdit}
                        onClick={handleSaveEdit}
                      >
                        保存
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingEntryId(null)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-lg leading-8 text-zinc-900">
                    {entry.content}
                  </p>
                )}

                {entry.summary ? (
                  <p className="mt-3 rounded-lg bg-[#f8f4ea] px-3 py-2 text-sm text-zinc-600">
                    AI 总结：{entry.summary}
                  </p>
                ) : null}

                <div className="mt-4 space-y-2 rounded-xl bg-[#fcfaf5] p-3">
                  <p className="text-xs font-semibold text-zinc-500">
                    评论区（{entry.comments.length}）
                  </p>
                  <div className="space-y-2">
                    {entry.comments.length === 0 ? (
                      <p className="text-xs text-zinc-400">
                        暂无评论，来抢沙发吧。
                      </p>
                    ) : (
                      entry.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-2 rounded-lg bg-white p-2"
                        >
                          <Avatar value={comment.authorAvatar} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-700">
                              {comment.authorName}
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-zinc-800">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={commentDrafts[entry.id] ?? ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [entry.id]: e.target.value,
                        }))
                      }
                      placeholder={currentUser ? "写评论..." : "请先登录后评论"}
                      className="h-9"
                      disabled={!currentUser}
                    />
                    <Button
                      type="button"
                      size="sm"
                      loading={isCommentSubmitting}
                      onClick={() => handleCommentSubmit(entry.id)}
                    >
                      评论
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        {!isEditorOpen ? (
          <button
            type="button"
            onClick={handlePostClick}
            className="fixed bottom-6 right-6 h-16 w-16 rounded-2xl bg-[#f5deab] text-4xl text-zinc-900 shadow-md md:hidden"
          >
            +
          </button>
        ) : null}
      </div>

      {/* Login Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        mode={loginDialogMode}
        onOpenChange={setLoginDialogOpen}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setLoginDialogMode(mode);
        }}
        authAction={authAction}
        isAuthPending={isAuthPending}
        authState={authState}
        forgotAction={forgotAction}
        isForgotPending={isForgotPending}
        forgotState={forgotState}
        showForgotPassword={showForgotPassword}
        onShowForgotPasswordChange={setShowForgotPassword}
      />

      {/* Auth Guard Modal */}
      <AuthGuardModal
        open={authGuardOpen}
        action={authGuardAction}
        onOpenChange={setAuthGuardOpen}
        onLoginClick={handleAuthGuardLoginClick}
      />

      {/* Profile Modal */}
      {isProfileOpen && currentUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">个人资料</h3>
              <button type="button" onClick={() => setIsProfileOpen(false)}>
                关闭
              </button>
            </div>
            <form action={profileAction} className="space-y-3">
              <Input
                name="displayName"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="昵称"
              />
              <Input
                name="avatar"
                value={profileAvatar}
                onChange={(e) => setProfileAvatar(e.target.value)}
                placeholder="头像（emoji 或 URL）"
              />
              <div className="flex flex-wrap items-center gap-2">
                {presetAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setProfileAvatar(avatar)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg ${
                      profileAvatar === avatar
                        ? "border-zinc-900 bg-[#f2e6cf]"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
                <div className="ml-2 inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-2 py-1">
                  <span className="text-xs text-zinc-500">预览</span>
                  <Avatar value={profileAvatar} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p
                  className={
                    profileState.ok
                      ? "text-xs text-green-600"
                      : "text-xs text-red-600"
                  }
                >
                  {profileState.message}
                </p>
                <Button
                  type="submit"
                  loading={isProfileSaving}
                >
                  保存
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DiaryApp(props: Props) {
  return (
    <Toaster>
      <DiaryAppContent {...props} />
    </Toaster>
  );
}