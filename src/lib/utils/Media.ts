export function validateMediaFile(file: File, maxSizeMB: number = 100): boolean {
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	return file.size <= maxSizeBytes;
}

export function isYouTubeUrl(url: string): boolean {
	return /^(https?:\/\/)?(www\.)?youtube\.com\/|youtu\.be\//.test(url);
}

export function isVimeoUrl(url: string): boolean {
	return /^(https?:\/\/)?(www\.)?vimeo\.com\//.test(url);
}

export async function extractVideoThumbnail(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			reject(new Error('Cannot get canvas context'));
			return;
		}

		video.onloadedmetadata = () => {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			video.currentTime = 0;
		};

		video.onseeked = () => {
			ctx.drawImage(video, 0, 0);
			resolve(canvas.toDataURL('image/jpeg'));
		};

		video.onerror = () => {
			reject(new Error('Failed to load video'));
		};

		video.src = URL.createObjectURL(file);
	});
}

export async function extractVideoThumbnailFromUrl(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			reject(new Error('Cannot get canvas context'));
			return;
		}

		video.crossOrigin = 'anonymous';
		video.onloadedmetadata = () => {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			video.currentTime = 0;
		};

		video.onseeked = () => {
			ctx.drawImage(video, 0, 0);
			resolve(canvas.toDataURL('image/jpeg'));
		};

		video.onerror = () => {
			reject(new Error('Failed to load video'));
		};

		video.src = url;
	});
}

export function detectMediaType(file: File | string): 'image' | 'video' | 'document' | 'unknown' {
	const nameOrMime = typeof file === 'string' ? file : file.type;

	if (nameOrMime.startsWith('image/')) {
		return 'image';
	}
	if (nameOrMime.startsWith('video/')) {
		return 'video';
	}
	if (
		nameOrMime.includes('pdf') ||
		nameOrMime.includes('document') ||
		nameOrMime.includes('word') ||
		nameOrMime.includes('sheet')
	) {
		return 'document';
	}

	return 'unknown';
}
