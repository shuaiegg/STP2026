"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getContactByEmail, addContact, addTagToContact, addTagToContactByName, removeTagFromContact, getTags } from "@/lib/email/systeme";
import type { SystemeContact, SystemeTag, ContactResult, TagsResult } from "@/lib/email/systeme";

type ActionResult = { success: boolean; message: string };

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('无权限');
  }
  return session;
}

// Create a contact without any tag
export async function createUserContact(email: string, name: string, locale?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await addContact(email, name, [], locale);
    return { success: true, message: '联系人已创建' };
  } catch (err: any) {
    return { success: false, message: err?.message ?? '创建失败' };
  }
}

// Load or create contact in systeme.io for a user
export async function fetchUserContact(email: string, name: string, locale?: string): Promise<ContactResult> {
  try {
    await requireAdmin();
    const result = await getContactByEmail(email, locale);
    if (result.ok || !result.notFound) return result;

    // Contact doesn't exist — create without tags
    await addContact(email, name, [], locale);
    // Re-fetch to get the ID
    return await getContactByEmail(email, locale);
  } catch (err: any) {
    return { ok: false, notFound: false, status: 0, body: err?.message ?? '未知错误' };
  }
}

// Add a tag to a user's systeme.io contact (create contact first if needed)
// tagId: systeme.io tag ID; tagName: display name for feedback messages
export async function addUserTag(email: string, name: string, tagId: number, tagName: string, locale?: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const fetchResult = await getContactByEmail(email, locale);
    if (fetchResult.ok) {
      const res = await addTagToContact(fetchResult.contact.id, tagId, locale);
      if (res.ok) return { success: true, message: `已添加标签「${tagName}」` };
      return { success: false, message: res.error ?? '添加失败' };
    } else if (fetchResult.notFound) {
      // Create contact first, then add tag by name (addContact handles tags by name internally)
      await addContact(email, name, [tagName], locale);
      // Re-fetch to verify
      const refetch = await getContactByEmail(email, locale);
      if (refetch.ok) return { success: true, message: `已创建联系人并添加标签「${tagName}」` };
      return { success: true, message: `已创建联系人（标签可能需要刷新后显示）` };
    } else {
      return { success: false, message: `获取联系人失败：${fetchResult.body.slice(0, 80)}` };
    }
  } catch (err: any) {
    return { success: false, message: err?.message ?? '未知错误' };
  }
}

// Remove a tag from a user's systeme.io contact
export async function removeUserTag(contactId: number, tagId: number, tagName: string, locale?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const res = await removeTagFromContact(contactId, tagId, locale);
    if (res.ok) return { success: true, message: `已移除标签「${tagName}」` };
    return { success: false, message: res.error ?? '移除失败' };
  } catch (err: any) {
    return { success: false, message: err?.message ?? '未知错误' };
  }
}

// Get available tags for the add-tag dropdown
export async function fetchAvailableTags(locale?: string): Promise<TagsResult> {
  try {
    await requireAdmin();
    return await getTags(locale);
  } catch (err: any) {
    return { ok: false, status: 0, body: err?.message ?? '未知错误' };
  }
}
