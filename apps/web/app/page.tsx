import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import type { DiaryEntryView } from "./actions";
import { DiaryApp } from "./diary-app";

async function getDiaryEntries(
  currentUserId: string | null,
): Promise<DiaryEntryView[]> {
  try {
    const entries = await prisma.diaryEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
        likes: true,
      },
    });
    return entries.map((entry) => ({
      id: entry.id,
      authorId: entry.authorId,
      authorName: entry.authorName,
      authorAvatar: entry.authorAvatar,
      content: entry.content,
      summary: entry.summary,
      likesCount: entry.likes.length,
      likedByMe:
        !!currentUserId &&
        entry.likes.some((like) => like.userId === currentUserId),
      createdAt: entry.createdAt.toISOString(),
      comments: entry.comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
    }));
  } catch (error) {
    console.warn("Failed to read diary entries:", error);
    return [];
  }
}

export default async function Home() {
  const currentUser = await getCurrentUser();
  const entries = await getDiaryEntries(currentUser?.id ?? null);
  return (
    <main>
      <DiaryApp
        initialEntries={entries}
        currentUser={
          currentUser
            ? {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                displayName: currentUser.displayName,
                avatar: currentUser.avatar,
              }
            : null
        }
      />
    </main>
  );
}
