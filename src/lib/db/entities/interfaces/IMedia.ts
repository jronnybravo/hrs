export interface IMedia {
	id?: number;
	type: 'image' | 'video' | 'document';
	url: string;
	thumbnail?: string;
	title?: string;
	description?: string;
	size?: number;
	duration?: number;
	mimeType?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export enum MediaSize {
	SMALL = 'small',
	MEDIUM = 'medium',
	LARGE = 'large',
	ORIGINAL = 'original'
}

export enum MediaType {
	IMAGE = 'image',
	VIDEO = 'video',
	DOCUMENT = 'document'
}
