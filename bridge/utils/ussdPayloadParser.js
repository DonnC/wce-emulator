function normalizeOption(option, index) {
  if (!option) return null;

  const key =
    option.key ||
    option.inputValue ||
    option.accessString ||
    option.id ||
    String(index + 1);

  return {
    key,
    label: option.label || option.title || option.text || `Option ${index + 1}`,
    description: option.description || option.nextStage || option.responseTag || undefined,
    selectable: option.selectable !== false,
    kind: option.kind || option.vendorHints?.kind || "option",
  };
}

function normalizeUssdPayload(payload = {}) {
  const source = payload.screen || payload;
  const options = Array.isArray(source.options)
    ? source.options.map(normalizeOption).filter(Boolean)
    : Array.isArray(source.menuItems)
      ? source.menuItems.map(normalizeOption).filter(Boolean)
      : [];

  const pagination =
    source.pagination ||
    source.vendorHints?.pagination || {
      nextToken: source.vendorHints?.nextToken,
      previousToken: source.vendorHints?.previousToken,
      page: source.vendorHints?.page,
      totalPages: source.vendorHints?.totalPages,
    };

  return {
    sessionId:
      source.sessionId ||
      source.metadata?.sessionId ||
      payload.sessionId ||
      `ussd-${Date.now()}`,
    title:
      source.title ||
      source.metadata?.title ||
      source.shortCode ||
      "USSD Session",
    body: source.body || source.message || source.text || "",
    prompt:
      source.prompt ||
      (source.terminal ? "Session complete" : "Reply with your choice"),
    stage: source.stage || source.metadata?.stage || undefined,
    shortCode: source.shortCode || source.metadata?.shortCode || undefined,
    msisdn: source.msisdn || source.metadata?.msisdn || undefined,
    terminal: Boolean(source.terminal ?? source.endSession ?? false),
    options,
    pagination:
      pagination && Object.values(pagination).some((value) => value !== undefined)
        ? pagination
        : undefined,
    metadata: {
      ...(source.metadata || {}),
      interactionType: source.interactionType,
      sessionMode: source.sessionMode,
      vendorHints: source.vendorHints,
    },
  };
}

module.exports = { normalizeUssdPayload };
