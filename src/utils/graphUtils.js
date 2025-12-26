export const getDescendants = (rootId, currentLinks) => {
    const descendants = new Set();
    const queue = [rootId];
    while (queue.length > 0) {
        const currId = queue.shift();
        const outgoing = currentLinks.filter(l => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            return sId === currId;
        });
        outgoing.forEach(l => {
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            if (!descendants.has(tId)) {
                descendants.add(tId);
                queue.push(tId);
            }
        });
    }
    return descendants;
};
