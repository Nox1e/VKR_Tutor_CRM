export function getShortName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} ${parts[1]}`;
}

export function isFullName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const parts = name.trim().split(/\s+/);
  return parts.length >= 3;
}

export function formatNameForDisplay(name: string, showFull: boolean = false): string {
  if (!name) {
    return '';
  }
  return showFull ? name : getShortName(name);
}
