export type BannedItemType = 'word' | 'symbol' | 'link';

export type BannedItem = {
	id: string;
	value: string;
	type: BannedItemType;
};
