export interface PlaceCategory {
	id: string;
	name: string;
	icon?: string;
}

export interface EventCategory {
	id: string;
	name: string;
	description?: string;
	color?: string;
}

export enum CategoryType {
	PLACE = 'place',
	EVENT = 'event'
}
