/**
 * Svelte action to handle click outside events
 * Usage: use:clickOutside={callback}
 */
export function clickOutside(node: HTMLElement, callback?: (event: CustomEvent) => void) {
	const handleClick = (event: MouseEvent) => {
		if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
			const customEvent = new CustomEvent('clickOutside');
			if (callback) {
				callback(customEvent);
			} else {
				node.dispatchEvent(customEvent);
			}
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
