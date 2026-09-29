import { Conversation, Message } from '../types/index.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40) || 'conversation';
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportConversationToMarkdown(
  conversation: Conversation | null,
  messages: Message[]
): { success: boolean; filename: string; count: number } {
  const title = conversation?.title || 'Craft AI Conversation';
  const slug = slugify(title);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${slug}-${dateStr}.md`;

  const validMessages = messages.filter((m) => m.content && m.content.trim());
  const formattedDate = new Date().toLocaleString();

  let md = `# ${title}\n\n`;
  md += `> **Exported from Craft AI**  \n`;
  md += `> **Date:** ${formattedDate}  \n`;
  md += `> **Model:** ${conversation?.model || 'gemini-3.8-flash'}  \n`;
  md += `> **Total Messages:** ${validMessages.length}\n\n`;
  md += `---\n\n`;

  if (validMessages.length === 0) {
    md += `*No messages in this conversation.*\n`;
  } else {
    validMessages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const speaker = isUser ? '👤 **User**' : '🤖 **Craft AI**';
      const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const modelTag = !isUser && msg.model ? ` \`${msg.model}\`` : '';

      md += `### ${speaker}${modelTag}${timeStr ? ` · *${timeStr}*` : ''}\n\n`;

      if (msg.attachments && msg.attachments.length > 0) {
        md += `**Attachments:**\n`;
        msg.attachments.forEach((att) => {
          const sizeKb = att.size ? Math.round(att.size / 1024) : 0;
          md += `- 📎 \`${att.name}\` (${sizeKb} KB, ${att.type})\n`;
        });
        md += `\n`;
      }

      md += `${msg.content.trim()}\n\n`;

      if (idx < validMessages.length - 1) {
        md += `---\n\n`;
      }
    });
  }

  triggerDownload(md, filename, 'text/markdown');
  return { success: true, filename, count: validMessages.length };
}

export function exportConversationToJson(
  conversation: Conversation | null,
  messages: Message[]
): { success: boolean; filename: string; count: number } {
  const title = conversation?.title || 'Craft AI Conversation';
  const slug = slugify(title);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${slug}-${dateStr}.json`;

  const validMessages = messages.filter((m) => m.content && m.content.trim());

  const exportData = {
    appName: 'Craft AI',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    conversation: {
      id: conversation?.id || 'unknown',
      title,
      model: conversation?.model || 'gemini-3.8-flash',
      isPinned: conversation?.isPinned || false,
      isArchived: conversation?.isArchived || false,
      createdAt: conversation?.createdAt || new Date().toISOString(),
      updatedAt: conversation?.updatedAt || new Date().toISOString(),
    },
    messageCount: validMessages.length,
    messages: validMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      model: m.model,
      status: m.status,
      metrics: m.metrics,
      attachments: m.attachments?.map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        type: a.type,
      })),
      createdAt: m.createdAt,
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  triggerDownload(jsonString, filename, 'application/json');
  return { success: true, filename, count: validMessages.length };
}
