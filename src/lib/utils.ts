import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuditHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-email": localStorage.getItem("userEmail") || "admin@sipeka.com",
    "x-user-name": localStorage.getItem("userName") || "Sistem Admin",
    "x-user-role": localStorage.getItem("activeRole") || "Administrator",
  };
}

export function getDirectImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  try {
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http') && trimmedUrl.length > 15 && !trimmedUrl.includes(' ')) {
       return `https://drive.google.com/uc?export=view&id=${trimmedUrl}`;
    }
    
    if (trimmedUrl.includes('drive.google.com')) {
      const idMatch = trimmedUrl.match(/id=([a-zA-Z0-9_-]+)/) || trimmedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
      }
    }
    return trimmedUrl;
  } catch (e) {
    return url || '';
  }
}

export function parsePhotos(photos: any): string[] {
  if (!photos) return [];
  let photoArr: string[] = [];
  
  if (Array.isArray(photos)) {
    photoArr = photos;
  } else if (typeof photos === 'string') {
    photoArr = photos.split(',');
  }
  
  // Flatten in case an array element itself contains comma separated strings
  photoArr = photoArr.flatMap(p => typeof p === 'string' ? p.split(',') : [p]);
  
  return photoArr.map(p => getDirectImageUrl(p)).filter(p => p !== '');
}
