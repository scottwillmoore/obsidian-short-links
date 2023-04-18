export interface Range {
	from: number;
	to: number;
}

export const createRange = (from: number, to: number): Range => ({ from, to });

export const getRange = (value: string): Range => ({ from: 0, to: value.length });

export const intersectRange = (a: Range, b: Range): boolean => a.from <= b.to && a.to >= b.from;

export const sliceText = (value: string, range: Range): string => value.substring(range.from, range.to);
