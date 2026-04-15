const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');

export const buildShareUrl = (shareId) => {
	const configuredPrefix = process.env.REACT_APP_SHARE_URL_PREFIX;
	if (configuredPrefix) {
		return `${stripTrailingSlash(configuredPrefix)}/${shareId}`;
	}

	const apiBaseUrl = process.env.REACT_APP_API_URL;
	if (apiBaseUrl) {
		return `${stripTrailingSlash(apiBaseUrl).replace(/\/api$/, '')}/share/${shareId}`;
	}

	return `https://s.oofo.cc/share/${shareId}`;
};
