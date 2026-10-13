export function formatEntryDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    dateStyle: 'long',
    timeZone: 'UTC',
  });
}

export function previewEntryContent(content) {
  const characters = Array.from(content.replace(/\s+/g, ' ').trim());
  return characters.length > 160 ? `${characters.slice(0, 160).join('')}…` : characters.join('');
}
