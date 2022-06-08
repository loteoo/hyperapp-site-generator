const addKeys = (node) => {
  if (['title', 'description'].includes(node.tag)) {
    node.key = node.tag;
  }
  return node
}

const combineHeads = (...heads: any[]) => {
  const combinedTags = heads.reduceRight((arr, head) => {
    if (head) {
      arr.push(...head.children);
    }
    return arr;
  }, [])
  
  const uniqueTags = [];
  for (const node of combinedTags.map(addKeys)) {
    if (node.key) {
      if (!uniqueTags.some(n => n.key === node.key)) {
        uniqueTags.push(node);
      }
    } else {
      uniqueTags.push(node);
    }
  }

  return uniqueTags;
}

export default combineHeads